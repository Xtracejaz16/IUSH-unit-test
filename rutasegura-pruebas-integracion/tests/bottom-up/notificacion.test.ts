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

  it('driverNotificacion_conTraficoQueSubeElETAPorEncimaDe10_noDebeEnviarSMS', async () => {
    // Arrange: el mismo viaje del ejemplo (5 km, 40 km/h) pero con tráfico 1.5
    const mensajeria = new MensajeriaStub();

    // Act
    const r = await driverNotificacion(mensajeria, PLACA, 40, 5, 1.5, ACUDIENTES);

    // Assert: 5 / 40 x 60 = 7.5; x 1.5 = 11.25 -> 12 min. 12 > 10 (RN-10) -> no se avisa a nadie
    expect(r.minutosEstimados).toBe(12);
    expect(r.smsEnviados).toBe(0);
    expect(mensajeria.enviados).toHaveLength(0);
  });

  it('driverNotificacion_conBusDetenido_debePasarNullAlNotificadorYNoEnviarSMS', async () => {
    // Arrange: velocidad 0 y 5 km por recorrer -> eta retorna null
    const mensajeria = new MensajeriaStub();

    // Act
    const r = await driverNotificacion(mensajeria, PLACA, 0, 5, 1.0, ACUDIENTES);

    // Assert: la INTERFAZ eta -> notificador acepta el null y lo interpreta como "no notificar" (RN-10)
    expect(r.minutosEstimados).toBeNull();
    expect(r.smsEnviados).toBe(0);
    expect(mensajeria.enviados).toHaveLength(0);
  });

  it('driverNotificacion_conUnTelefonoQueFalla_debeContarSoloLosExitosos', async () => {
    // Arrange: 8 minutos (se notifica); el SMS de Luisa (3001112233) lo rechaza el operador
    const mensajeria = new MensajeriaStub().fallarPara('3001112233');

    // Act
    const r = await driverNotificacion(mensajeria, PLACA, 40, 5, 1.0, ACUDIENTES);

    // Assert: RN-11 deja 2 candidatos (Carlos tiene notificaciones apagadas); RN-13: 1 falla, 1 llega
    expect(r.minutosEstimados).toBe(8);
    expect(r.smsEnviados).toBe(1);
    expect(mensajeria.enviados.map((e) => e.telefono)).toEqual(['3007778899']);
  });
});
