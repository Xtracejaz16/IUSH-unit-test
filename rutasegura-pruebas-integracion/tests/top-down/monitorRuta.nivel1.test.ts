import { MonitorRuta } from '../../src/monitorRuta';
import { InfoRuta } from '../../src/servicios';
import { ProveedorGPSStub } from '../stubs/ProveedorGPSStub';
import { RepositorioRutasStub } from '../stubs/RepositorioRutasStub';
import { ServicioTraficoStub } from '../stubs/ServicioTraficoStub';
import { NotificadorStub } from '../stubs/NotificadorStub';
import { ACUDIENTES, BUS_CERCA, BUS_LEJOS, HORA_ACTUAL, PLACA, crearRuta } from '../datosPrueba';

/**
 * INTEGRACIÓN DESCENDENTE (top-down) — NIVEL 1
 *
 * Se prueba el módulo de más arriba (MonitorRuta) integrado con los módulos internos reales
 * (validaciones, geo, eta, alertas), pero con TODOS sus colaboradores externos reemplazados
 * por STUBS, incluido el notificador.
 *
 *   [MonitorRuta] ──> validaciones, geo, eta, alertas (reales)
 *        │
 *        ├──> ProveedorGPSStub
 *        ├──> RepositorioRutasStub
 *        ├──> ServicioTraficoStub
 *        └──> NotificadorStub          <- en el nivel 2 se reemplaza por el real
 */
describe('Top-down N1 - MonitorRuta con todos los colaboradores como stubs', () => {
  // Patrón: cada prueba arma su propio "mundo" para no depender de otras (FIRST: Independent).
  // Por defecto: bus cerca a 10 m/s, tráfico 1.0 y la ruta de datosPrueba. Cambien solo lo que necesiten.
  function crearMonitor(
    opciones: {
      gps?: ProveedorGPSStub;
      trafico?: ServicioTraficoStub;
      ruta?: InfoRuta;
      notificador?: NotificadorStub;
    } = {}
  ) {
    const gps = opciones.gps ?? new ProveedorGPSStub({ ...BUS_CERCA, velocidadMs: 10 });
    const trafico = opciones.trafico ?? new ServicioTraficoStub(1.0);
    const rutas = new RepositorioRutasStub().conRuta(PLACA, opciones.ruta ?? crearRuta());
    const notificador = opciones.notificador ?? new NotificadorStub();
    return { monitor: new MonitorRuta(gps, rutas, trafico, notificador), gps, trafico, notificador };
  }

  describe('RN-15 placa y ruta', () => {
    it('monitorear_conPlacaInvalida_debeRetornarPlacaInvalidaSinConsultarGPS', async () => {
      // Arrange
      const { monitor, gps } = crearMonitor();

      // Act
      const reporte = await monitor.monitorear('BUS-1', HORA_ACTUAL);

      // Assert: el resultado Y la interacción con el componente de abajo
      expect(reporte.estado).toBe('PLACA_INVALIDA');
      expect(gps.llamadas).toHaveLength(0);
    });

    it('monitorear_conPlacaSinRutaAsignada_debeRetornarRutaNoEncontrada', async () => {
      // Arrange: 'ABC123' tiene formato válido, pero el repositorio solo conoce a WPX482
      const { monitor, gps, notificador } = crearMonitor();

      // Act
      const reporte = await monitor.monitorear('ABC123', HORA_ACTUAL);

      // Assert: sin ruta no hay a dónde ir -> no se pregunta por el GPS ni se avisa a nadie
      expect(reporte.estado).toBe('RUTA_NO_ENCONTRADA');
      expect(reporte.placa).toBe('ABC123');
      expect(gps.llamadas).toHaveLength(0);
      expect(notificador.llamadas).toHaveLength(0);
    });

    it('monitorear_conPlacaEnMinusculasYEspacios_debeNormalizarlaAntesDeConsultarLaRuta', async () => {
      // Arrange
      const { monitor, gps } = crearMonitor();

      // Act: '  wpx482 ' debe convertirse en 'WPX482' (RN-15) y por eso el repositorio SÍ encuentra la ruta
      const reporte = await monitor.monitorear('  wpx482 ', HORA_ACTUAL);

      // Assert: resultado + con qué placa se llamó al GPS
      expect(reporte.placa).toBe('WPX482');
      expect(reporte.estado).toBe('EN_RUTA');
      expect(gps.llamadas).toEqual(['WPX482']);
    });
  });

  describe('RN-16 lectura del GPS', () => {
    it('monitorear_conGPSSinSenal_debeRetornarSinSenalYNoNotificar', async () => {
      // Arrange
      const gps = new ProveedorGPSStub({ ...BUS_CERCA, velocidadMs: 10 }).simularSinSenal();
      const { monitor, notificador } = crearMonitor({ gps });

      // Act
      const reporte = await monitor.monitorear(PLACA, HORA_ACTUAL);

      // Assert
      expect(reporte.estado).toBe('SIN_SENAL');
      expect(reporte.smsEnviados).toBe(0);
      expect(notificador.llamadas).toHaveLength(0);
    });

    it('monitorear_conCoordenadasFueraDeRango_debeRetornarGpsInvalidoSinConsultarTrafico', async () => {
      // Arrange: latitud 95 no existe (el máximo es 90)
      const gps = new ProveedorGPSStub({ latitud: 95, longitud: -75.575, velocidadMs: 10 });
      const { monitor, trafico, notificador } = crearMonitor({ gps });

      // Act
      const reporte = await monitor.monitorear(PLACA, HORA_ACTUAL);

      // Assert: además del estado, lo que NO debe haber pasado (RN-16)
      expect(reporte.estado).toBe('GPS_INVALIDO');
      expect(reporte.smsEnviados).toBe(0);
      expect(trafico.llamadas).toBe(0);
      expect(notificador.llamadas).toHaveLength(0);
    });
  });

  describe('RN-17 servicio de tráfico', () => {
    it('monitorear_conServicioDeTraficoCaido_debeUsarFactorPorDefecto15', async () => {
      // Arrange: ORÁCULO RELATIVO. En vez de calcular a mano el ETA (que depende también de RN-18),
      // se compara contra un monitor idéntico cuyo tráfico responde 1.5 sin fallar.
      const caido = crearMonitor({ trafico: new ServicioTraficoStub(1.0).simularCaida() });
      const referencia = crearMonitor({ trafico: new ServicioTraficoStub(1.5) });

      // Act
      const reporteCaido = await caido.monitor.monitorear(PLACA, HORA_ACTUAL);
      const reporteReferencia = await referencia.monitor.monitorear(PLACA, HORA_ACTUAL);

      // Assert: el monitoreo continuó (no se cayó con el servicio) y calculó igual que con factor 1.5
      expect(caido.trafico.llamadas).toBe(1);
      expect(reporteCaido.estado).toBe('EN_RUTA');
      expect(reporteCaido.minutosEstimados).toBe(reporteReferencia.minutosEstimados);
      expect(reporteCaido.horaEstimadaLlegada).toEqual(reporteReferencia.horaEstimadaLlegada);
    });
  });

  describe('RN-18 conversión de unidades y ETA', () => {
    // Pista: con velocidadMs = 10 (36 km/h) y 1.322 km, ¿cuántos minutos esperan según RN-01?
    it('monitorear_conVelocidadEnMetrosPorSegundo_debeConvertirlaAKmhAntesDeCalcularETA', async () => {
      // Arrange: el GPS (stub por defecto) entrega 10 m/s
      const { monitor } = crearMonitor();

      // Act
      const reporte = await monitor.monitorear(PLACA, HORA_ACTUAL);

      // Assert: 10 m/s x 3.6 = 36 km/h -> 1.322 / 36 x 60 = 2.2 min -> 3 min (vía libre).
      // Llega 06:33 y estaba programado a las 06:30 -> retraso 3 -> NINGUNA
      expect(reporte.distanciaKm).toBeCloseTo(1.322, 3);
      expect(reporte.minutosEstimados).toBe(3);
      expect(reporte.horaEstimadaLlegada).toEqual(new Date('2026-10-13T06:33:00-05:00'));
      expect(reporte.minutosRetraso).toBe(3);
      expect(reporte.nivelAlerta).toBe('NINGUNA');
    });
  });

  describe('RN-19 bus detenido', () => {
    it('monitorear_conVelocidadCero_debeRetornarDetenidoSinNotificar', async () => {
      // Arrange
      const gps = new ProveedorGPSStub({ ...BUS_CERCA, velocidadMs: 0 });
      const { monitor, notificador } = crearMonitor({ gps });

      // Act
      const reporte = await monitor.monitorear(PLACA, HORA_ACTUAL);

      // Assert: RN-19 -> hay distancia y ocupación (30/40 = 75 %), pero nada que dependa del tiempo
      expect(reporte.estado).toBe('DETENIDO');
      expect(reporte.distanciaKm).toBeCloseTo(1.322, 3);
      expect(reporte.porcentajeOcupacion).toBe(75);
      expect(reporte.minutosEstimados).toBeNull();
      expect(reporte.horaEstimadaLlegada).toBeNull();
      expect(reporte.minutosRetraso).toBeNull();
      expect(reporte.nivelAlerta).toBeNull();
      expect(reporte.smsEnviados).toBe(0);
      expect(notificador.llamadas).toHaveLength(0);
    });
  });

  describe('RN-20 retraso y alerta', () => {
    it('monitorear_conBusQueLlegaAntesDeLaHoraProgramada_debeReportarRetrasoCeroYAlertaNinguna', async () => {
      // Arrange: el bus llega ~06:33 (36 km/h) pero estaba programado a las 06:45 -> va ADELANTADO
      const ruta = crearRuta({ horaProgramadaLlegada: new Date('2026-10-13T06:45:00-05:00') });
      const { monitor } = crearMonitor({ ruta });

      // Act
      const reporte = await monitor.monitorear(PLACA, HORA_ACTUAL);

      // Assert: RN-20 -> si va adelantado el retraso es 0 (nunca negativo) y la alerta NINGUNA
      expect(reporte.estado).toBe('EN_RUTA');
      expect(reporte.minutosRetraso).toBe(0);
      expect(reporte.nivelAlerta).toBe('NINGUNA');
    });

    it('monitorear_conBusMuyRetrasado_debeReportarAlertaGrave', async () => {
      // Arrange: BUS_LEJOS a 5 m/s (18 km/h) con tráfico 1.5; programado a las 06:30 (= HORA_ACTUAL)
      const gps = new ProveedorGPSStub({ ...BUS_LEJOS, velocidadMs: 5 });
      const { monitor } = crearMonitor({ gps, trafico: new ServicioTraficoStub(1.5) });

      // Act
      const reporte = await monitor.monitorear(PLACA, HORA_ACTUAL);

      // Assert: 3.314 / 18 x 60 = 11.05; x 1.5 = 16.57 -> 17 min -> retraso 17 (> 15) -> GRAVE
      expect(reporte.minutosEstimados).toBe(17);
      expect(reporte.minutosRetraso).toBe(17);
      expect(reporte.nivelAlerta).toBe('GRAVE');
    });
  });

  describe('RN-21 llamada al notificador', () => {
    it('monitorear_debeEntregarAlNotificadorLaPlacaLosMinutosYLosAcudientesDeLaRuta', async () => {
      // Arrange: el notificador stub responde que "envió" 2 SMS
      const { monitor, notificador } = crearMonitor({ notificador: new NotificadorStub(2) });

      // Act
      const reporte = await monitor.monitorear('  wpx482 ', HORA_ACTUAL);

      // Assert: se llamó UNA vez, con la placa normalizada, los minutos de RN-01/RN-18 (3) y los acudientes
      expect(notificador.llamadas).toEqual([
        { placa: 'WPX482', minutosEstimados: 3, acudientes: ACUDIENTES },
      ]);
      // y lo que el notificador retornó es lo que el reporte informa
      expect(reporte.smsEnviados).toBe(2);
    });
  });
});
