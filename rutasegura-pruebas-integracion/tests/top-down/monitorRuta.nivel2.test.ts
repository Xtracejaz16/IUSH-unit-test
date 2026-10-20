import { MonitorRuta } from '../../src/monitorRuta';
import { NotificadorAcudientes } from '../../src/notificador';
import { ProveedorGPSStub } from '../stubs/ProveedorGPSStub';
import { RepositorioRutasStub } from '../stubs/RepositorioRutasStub';
import { ServicioTraficoStub } from '../stubs/ServicioTraficoStub';
import { MensajeriaStub } from '../stubs/MensajeriaStub';
import { BUS_CERCA, BUS_LEJOS, HORA_ACTUAL, PLACA, crearRuta } from '../datosPrueba';
import { PosicionGPS } from '../../src/servicios';

/**
 * INTEGRACIÓN DESCENDENTE (top-down) — NIVEL 2
 *
 * Bajamos un nivel: el NotificadorStub se reemplaza por el NotificadorAcudientes REAL.
 * Ahora el stub queda un nivel más abajo: el proveedor de SMS (MensajeriaStub).
 *
 *   [MonitorRuta] ──> [NotificadorAcudientes] ──> MensajeriaStub
 *        ├──> ProveedorGPSStub
 *        ├──> RepositorioRutasStub
 *        └──> ServicioTraficoStub
 */
describe('Top-down N2 - MonitorRuta + NotificadorAcudientes real', () => {
  // Mismo patrón del nivel 1: el notificador ahora es el REAL; el stub baja hasta la mensajería.
  // Por defecto: bus cerca a 10 m/s y tráfico 1.0.
  function crearMonitor(mensajeria: MensajeriaStub, posicion?: PosicionGPS, factorTrafico = 1.0) {
    return new MonitorRuta(
      new ProveedorGPSStub(posicion ?? { ...BUS_CERCA, velocidadMs: 10 }),
      new RepositorioRutasStub().conRuta(PLACA, crearRuta()),
      new ServicioTraficoStub(factorTrafico),
      new NotificadorAcudientes(mensajeria)
    );
  }

  it('monitorear_conBusCerca_debeEnviarSMSSoloAAcudientesConNotificacionesActivas', async () => {
    // Arrange
    const mensajeria = new MensajeriaStub();
    const monitor = new MonitorRuta(
      new ProveedorGPSStub({ ...BUS_CERCA, velocidadMs: 10 }),
      new RepositorioRutasStub().conRuta(PLACA, crearRuta()),
      new ServicioTraficoStub(1.0),
      new NotificadorAcudientes(mensajeria)
    );

    // Act
    const reporte = await monitor.monitorear(PLACA, HORA_ACTUAL);

    // Assert: el SMS llegó al final de la cadena MonitorRuta -> Notificador -> Mensajería
    expect(reporte.estado).toBe('EN_RUTA');
    expect(reporte.smsEnviados).toBe(2);
    expect(mensajeria.enviados.map((e) => e.telefono)).toEqual(['3001112233', '3007778899']);
  });

  it('monitorear_debeEnviarSMSConLosMinutosCalculadosPorEtaYNoOtros', async () => {
    // Arrange
    const mensajeria = new MensajeriaStub();
    const monitor = crearMonitor(mensajeria);

    // Act
    await monitor.monitorear(PLACA, HORA_ACTUAL);

    // Assert: 10 m/s = 36 km/h -> 1.322 / 36 x 60 = 2.2 -> 3 minutos (RN-01 + RN-18).
    // Este es el TEXTO EXACTO (RN-12) que leería el acudiente en su celular.
    expect(mensajeria.enviados.map((e) => e.mensaje)).toEqual([
      'RutaSegura: el bus WPX482 llegará en aproximadamente 3 minutos.',
      'RutaSegura: el bus WPX482 llegará en aproximadamente 3 minutos.',
    ]);
  });

  it('monitorear_conFalloDeUnSMS_debeReportarSoloLosEnviosExitosos', async () => {
    // Arrange: el operador rechaza el SMS de Marta (3007778899); Luisa sí lo recibe; Carlos está apagado
    const mensajeria = new MensajeriaStub().fallarPara('3007778899');
    const monitor = crearMonitor(mensajeria);

    // Act
    const reporte = await monitor.monitorear(PLACA, HORA_ACTUAL);

    // Assert: el fallo de un SMS no tumba el monitoreo (RN-13) y el reporte cuenta solo los exitosos
    expect(reporte.estado).toBe('EN_RUTA');
    expect(reporte.smsEnviados).toBe(1);
    expect(mensajeria.enviados.map((e) => e.telefono)).toEqual(['3001112233']);
  });

  it('monitorear_conBusLejosAMasDeDiezMinutos_noDebeEnviarNingunSMS', async () => {
    // Arrange: BUS_LEJOS a 5 m/s = 18 km/h, vía libre
    const mensajeria = new MensajeriaStub();
    const monitor = crearMonitor(mensajeria, { ...BUS_LEJOS, velocidadMs: 5 });

    // Act
    const reporte = await monitor.monitorear(PLACA, HORA_ACTUAL);

    // Assert: 3.314 / 18 x 60 = 11.05 -> 12 min. 12 > 10 (RN-10) -> nadie recibe SMS, pero el bus SÍ está en ruta
    expect(reporte.estado).toBe('EN_RUTA');
    expect(reporte.smsEnviados).toBe(0);
    expect(mensajeria.enviados).toHaveLength(0);
    expect(reporte.minutosEstimados).toBe(12);
  });

  // EXTRA (no pedida por la guía): muestra la falla que ve el usuario. Con ETA correcto (7 min) el
  // acudiente DEBE recibir aviso; con el defecto de unidades el sistema cree que faltan 25 min y calla.
  it('monitorear_conBusLejosA8MetrosPorSegundo_debeNotificarPorqueEstaA7Minutos', async () => {
    // Arrange: 8 m/s = 28.8 km/h; 3.314 / 28.8 x 60 = 6.9 -> 7 min (<= 10)
    const mensajeria = new MensajeriaStub();
    const monitor = crearMonitor(mensajeria, { ...BUS_LEJOS, velocidadMs: 8 });

    // Act
    const reporte = await monitor.monitorear(PLACA, HORA_ACTUAL);

    // Assert
    expect(reporte.minutosEstimados).toBe(7);
    expect(reporte.smsEnviados).toBe(2);
    expect(mensajeria.enviados[0].mensaje).toBe(
      'RutaSegura: el bus WPX482 llegará en aproximadamente 7 minutos.'
    );
  });
});
