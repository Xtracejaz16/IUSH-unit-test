import { MonitorRuta } from '../../src/monitorRuta';
import { InfoRuta } from '../../src/servicios';
import { ProveedorGPSStub } from '../stubs/ProveedorGPSStub';
import { RepositorioRutasStub } from '../stubs/RepositorioRutasStub';
import { ServicioTraficoStub } from '../stubs/ServicioTraficoStub';
import { NotificadorStub } from '../stubs/NotificadorStub';
import { BUS_CERCA, HORA_ACTUAL, PLACA, crearRuta } from '../datosPrueba';

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

    it.todo('monitorear_conPlacaSinRutaAsignada_debeRetornarRutaNoEncontrada');
    it.todo('monitorear_conPlacaEnMinusculasYEspacios_debeNormalizarlaAntesDeConsultarLaRuta');
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

    it.todo('monitorear_conCoordenadasFueraDeRango_debeRetornarGpsInvalidoSinConsultarTrafico');
  });

  describe('RN-17 servicio de tráfico', () => {
    it.todo('monitorear_conServicioDeTraficoCaido_debeUsarFactorPorDefecto15');
  });

  describe('RN-18 conversión de unidades y ETA', () => {
    // Pista: con velocidadMs = 10 (36 km/h) y 1.322 km, ¿cuántos minutos esperan según RN-01?
    it.todo('monitorear_conVelocidadEnMetrosPorSegundo_debeConvertirlaAKmhAntesDeCalcularETA');
  });

  describe('RN-19 bus detenido', () => {
    it.todo('monitorear_conVelocidadCero_debeRetornarDetenidoSinNotificar');
  });

  describe('RN-20 retraso y alerta', () => {
    it.todo('monitorear_conBusQueLlegaAntesDeLaHoraProgramada_debeReportarRetrasoCeroYAlertaNinguna');
    it.todo('monitorear_conBusMuyRetrasado_debeReportarAlertaGrave');
  });

  describe('RN-21 llamada al notificador', () => {
    it.todo('monitorear_debeEntregarAlNotificadorLaPlacaLosMinutosYLosAcudientesDeLaRuta');
  });
});
