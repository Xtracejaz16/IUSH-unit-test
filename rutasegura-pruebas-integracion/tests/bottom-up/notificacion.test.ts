import { driverNotificacion } from '../drivers/driverNotificacion';
import { MensajeriaStub } from '../stubs/MensajeriaStub';
import { ACUDIENTES, PLACA } from '../datosPrueba';

/**
 * INTEGRACIÓN ASCENDENTE (bottom-up) — eta + notificador
 *
 *   driverNotificacion  (driver: hace de MonitorRuta)
 *        ├──> eta                    (real)
 *        └──> NotificadorAcudientes  (real) ──> MensajeriaStub (stub)
 */
describe('Bottom-up - eta + notificador mediante driver', () => {
  it('driverNotificacion_conBusAOchoMinutos_debeEnviarMensajeConLosMinutosDeEta', async () => {
    // Arrange: 5 km a 40 km/h, vía libre -> 7.5 -> 8 minutos
    const mensajeria = new MensajeriaStub();

    // Act
    const r = await driverNotificacion(mensajeria, PLACA, 40, 5, 1.0, ACUDIENTES);

    // Assert: el valor producido por eta llegó intacto hasta el texto del SMS
    expect(r.minutosEstimados).toBe(8);
    expect(r.smsEnviados).toBe(2);
    expect(mensajeria.enviados[0].mensaje).toBe(
      'RutaSegura: el bus WPX482 llegará en aproximadamente 8 minutos.'
    );
  });

  it.todo('driverNotificacion_conTraficoQueSubeElETAPorEncimaDe10_noDebeEnviarSMS');
  it.todo('driverNotificacion_conBusDetenido_debePasarNullAlNotificadorYNoEnviarSMS');
  it.todo('driverNotificacion_conUnTelefonoQueFalla_debeContarSoloLosExitosos');
});
