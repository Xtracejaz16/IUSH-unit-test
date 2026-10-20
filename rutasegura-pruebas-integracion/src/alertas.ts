/**
 * RutaSegura - Alertas para la coordinación de transporte del colegio.
 * Reglas de negocio: RN-08 y RN-09 (ver README.md).
 * Versión 1.1: defectos del taller de pruebas unitarias corregidos.
 */

export type NivelAlerta = 'NINGUNA' | 'LEVE' | 'GRAVE';

/**
 * Clasifica el retraso de una ruta frente a su horario programado.
 *   0 a 5 minutos (incluido)          -> NINGUNA
 *   más de 5 y hasta 15 (incluido)    -> LEVE
 *   más de 15                         -> GRAVE
 */
export function determinarNivelAlerta(minutosRetraso: number): NivelAlerta {
  if (minutosRetraso < 0) {
    throw new RangeError('El retraso no puede ser negativo');
  }
  if (minutosRetraso > 15) {
    return 'GRAVE';
  }
  if (minutosRetraso > 5) {
    return 'LEVE';
  }
  return 'NINGUNA';
}

/**
 * Calcula el porcentaje de ocupación del bus, redondeado a 1 decimal.
 * Puede superar 100 (sobrecupo): la coordinación necesita verlo.
 */
export function calcularPorcentajeOcupacion(estudiantesABordo: number, capacidad: number): number {
  if (capacidad <= 0) {
    throw new RangeError('La capacidad debe ser mayor que cero');
  }
  if (estudiantesABordo < 0) {
    throw new RangeError('El número de estudiantes no puede ser negativo');
  }
  const porcentaje = (estudiantesABordo / capacidad) * 100;
  return Math.round(porcentaje * 10) / 10;
}
