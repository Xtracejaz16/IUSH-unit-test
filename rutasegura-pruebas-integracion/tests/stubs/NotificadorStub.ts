import { Acudiente } from '../../src/notificador';
import { Notificador } from '../../src/servicios';

/**
 * STUB del módulo de notificación (usado en el NIVEL 1 de la integración descendente).
 * No contiene la lógica real de RN-10 a RN-13: solo registra con qué lo llamaron
 * y retorna un número fijo de SMS "enviados".
 */
export class NotificadorStub implements Notificador {
  public llamadas: { placa: string; minutosEstimados: number | null; acudientes: Acudiente[] }[] = [];

  constructor(private readonly smsEnviados: number = 0) {}

  async notificarProximidad(
    placa: string,
    minutosEstimados: number | null,
    acudientes: Acudiente[]
  ): Promise<number> {
    this.llamadas.push({ placa, minutosEstimados, acudientes });
    return this.smsEnviados;
  }
}
