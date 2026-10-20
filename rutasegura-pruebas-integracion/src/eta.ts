/**
 * RutaSegura - Módulo de cálculo de tiempo estimado de llegada (ETA).
 * Reglas de negocio: RN-01 a RN-05 (ver README.md).
 * Versión 1.1: defectos del taller de pruebas unitarias corregidos.
 */

export const FACTOR_TRAFICO_MIN = 1.0;
export const FACTOR_TRAFICO_MAX = 3.0;

/**
 * Calcula los minutos estimados que le faltan al bus para llegar al paradero.
 *
 * @param velocidadKmh        Velocidad actual del bus en km/h.
 * @param distanciaRestanteKm Distancia que falta hasta el paradero en km.
 * @param factorTrafico       Multiplicador por congestión (1.0 = vía libre, 3.0 = trancón severo).
 * @returns Minutos estimados (redondeados hacia arriba) o null si el bus está detenido.
 */
export function calcularMinutosEstimados(
  velocidadKmh: number,
  distanciaRestanteKm: number,
  factorTrafico: number
): number | null {
  if (velocidadKmh < 0 || distanciaRestanteKm < 0) {
    throw new RangeError('La velocidad y la distancia no pueden ser negativas');
  }
  if (factorTrafico < FACTOR_TRAFICO_MIN || factorTrafico > FACTOR_TRAFICO_MAX) {
    throw new RangeError(
      `El factor de tráfico debe estar entre ${FACTOR_TRAFICO_MIN} y ${FACTOR_TRAFICO_MAX}`
    );
  }
  if (distanciaRestanteKm === 0) {
    return 0;
  }
  if (velocidadKmh === 0) {
    return null;
  }

  const minutosSinTrafico = (distanciaRestanteKm / velocidadKmh) * 60;
  const minutosConTrafico = minutosSinTrafico * factorTrafico;
  return Math.ceil(minutosConTrafico);
}

/**
 * Calcula la hora (Date) en la que el bus llegará al paradero.
 *
 * @param horaActual Hora de referencia. NO debe ser modificada por la función.
 * @returns Nueva instancia de Date con la hora estimada, o null si el bus está detenido.
 */
export function calcularHoraEstimadaLlegada(
  velocidadKmh: number,
  distanciaRestanteKm: number,
  factorTrafico: number,
  horaActual: Date
): Date | null {
  const minutos = calcularMinutosEstimados(velocidadKmh, distanciaRestanteKm, factorTrafico);
  if (minutos === null) {
    return null;
  }
  return new Date(horaActual.getTime() + minutos * 60_000);
}
