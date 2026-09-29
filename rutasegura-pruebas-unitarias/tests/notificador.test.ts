import { NotificadorAcudientes, ServicioMensajeria, Acudiente } from '../src/notificador';

// AJUSTAR si en src/notificador.ts la interfaz Acudiente tiene otros nombres de campo
const crearAcudiente = (telefono: string, activas: boolean): Acudiente => ({
  nombre: 'Acudiente ' + telefono,
  telefono,
  notificacionesActivas: activas,
});

describe('NotificadorAcudientes.notificarProximidad', () => {
  let mensajeria: jest.Mocked<ServicioMensajeria>;
  let notificador: NotificadorAcudientes;

  // FIRST - Independent: cada prueba arranca con un mock nuevo
  beforeEach(() => {
    mensajeria = {
      enviarSMS: jest.fn().mockResolvedValue(true),
    } as jest.Mocked<ServicioMensajeria>;
    notificador = new NotificadorAcudientes(mensajeria);
  });

  describe('RN-10 notificarProximidad - umbral de minutos', () => {
    it('notificarProximidad_conBusAMasDeDiezMinutos_noDebeEnviarSMS', async () => {
      // Arrange
      const acudientes = [crearAcudiente('300', true)];
      // Act
      const enviados = await notificador.notificarProximidad('ABC123', 11, acudientes);
      // Assert
      expect(enviados).toBe(0);
      expect(mensajeria.enviarSMS).not.toHaveBeenCalled();
    });

    it('notificarProximidad_conMinutosNull_noDebeEnviarSMS', async () => {
      const enviados = await notificador.notificarProximidad('ABC123', null, [crearAcudiente('300', true)]);
      expect(enviados).toBe(0);
      expect(mensajeria.enviarSMS).not.toHaveBeenCalled();
    });

    it('notificarProximidad_conExactamenteDiezMinutos_debeEnviarSMS', async () => {
      const enviados = await notificador.notificarProximidad('ABC123', 10, [crearAcudiente('300', true)]);
      expect(enviados).toBe(1);
      expect(mensajeria.enviarSMS).toHaveBeenCalledTimes(1);
    });

    it('notificarProximidad_conCeroMinutos_debeEnviarSMS', async () => {
      const enviados = await notificador.notificarProximidad('ABC123', 0, [crearAcudiente('300', true)]);
      expect(enviados).toBe(1);
    });
  });

  describe('RN-11 notificarProximidad - preferencias del acudiente', () => {
    it('notificarProximidad_conAcudienteConNotificacionesDesactivadas_noDebeEnviarleSMS', async () => {
      const acudientes = [crearAcudiente('300', false), crearAcudiente('301', true)];
      const enviados = await notificador.notificarProximidad('ABC123', 5, acudientes);

      expect(enviados).toBe(1);
      expect(mensajeria.enviarSMS).toHaveBeenCalledTimes(1);
      // Ninguna llamada debe haberse hecho al teléfono 300
      const telefonosLlamados = mensajeria.enviarSMS.mock.calls.map((c) => c[0]);
      expect(telefonosLlamados).not.toContain('300');
    });
  });

  describe('RN-12 notificarProximidad - contenido del mensaje', () => {
    it('notificarProximidad_debeEnviarMensajeConPlacaYMinutos', async () => {
      await notificador.notificarProximidad('ABC123', 7, [crearAcudiente('300', true)]);

      expect(mensajeria.enviarSMS).toHaveBeenCalledWith(
        '300',
        'RutaSegura: el bus ABC123 llegará en aproximadamente 7 minutos.'
      );
    });
  });

  describe('RN-13 notificarProximidad - tolerancia a fallos', () => {
    it('notificarProximidad_conUnEnvioFallido_debeContinuarYContarSoloExitosos', async () => {
      mensajeria.enviarSMS.mockRejectedValueOnce(new Error('Sin señal'));
      const acudientes = [crearAcudiente('300', true), crearAcudiente('301', true)];

      const enviados = await notificador.notificarProximidad('ABC123', 5, acudientes);

      expect(mensajeria.enviarSMS).toHaveBeenCalledTimes(2); // siguió con el segundo
      expect(enviados).toBe(1);
    });

    it('notificarProximidad_conServicioQueRetornaFalse_noDebeContarloComoExitoso', async () => {
      mensajeria.enviarSMS.mockResolvedValueOnce(false);
      const acudientes = [crearAcudiente('300', true), crearAcudiente('301', true)];

      const enviados = await notificador.notificarProximidad('ABC123', 5, acudientes);

      expect(mensajeria.enviarSMS).toHaveBeenCalledTimes(2);
      expect(enviados).toBe(1);
    });

    it('notificarProximidad_conTodosLosEnviosExitosos_debeRetornarLaCantidadTotal', async () => {
      const acudientes = [crearAcudiente('300', true), crearAcudiente('301', true), crearAcudiente('302', true)];
      const enviados = await notificador.notificarProximidad('ABC123', 5, acudientes);
      expect(enviados).toBe(3);
    });
  });
});