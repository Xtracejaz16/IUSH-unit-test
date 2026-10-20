import { calcularMinutosEstimados } from '../../src/eta';
import { Acudiente, NotificadorAcudientes, ServicioMensajeria } from '../../src/notificador';

/**
 * DRIVER de integración ascendente (bottom-up) — Nivel 1: eta + notificador.
 *
 * Verifica la INTERFAZ entre los dos módulos: que el valor que produce eta
 * (number | null) sea aceptado y bien interpretado por el notificador.
 * Debajo del notificador seguimos necesitando un STUB de mensajería: en la práctica
 * es normal combinar drivers (arriba) y stubs (abajo).
 */
export async function driverNotificacion(
  mensajeria: ServicioMensajeria,
  placa: string,
  velocidadKmh: number,
  distanciaKm: number,
  factorTrafico: number,
  acudientes: Acudiente[]
): Promise<{ minutosEstimados: number | null; smsEnviados: number }> {
  const minutosEstimados = calcularMinutosEstimados(velocidadKmh, distanciaKm, factorTrafico);
  const notificador = new NotificadorAcudientes(mensajeria);
  const smsEnviados = await notificador.notificarProximidad(placa, minutosEstimados, acudientes);
  return { minutosEstimados, smsEnviados };
}
