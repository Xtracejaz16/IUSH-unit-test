/**
 * RutaSegura - Cálculos geográficos.
 * Regla de negocio: RN-14 (ver README.md).
 */

export const RADIO_TIERRA_KM = 6371;

const aRadianes = (grados: number): number => (grados * Math.PI) / 180;

/**
 * Distancia en línea recta (fórmula de Haversine) entre dos coordenadas, en kilómetros.
 */
export function calcularDistanciaKm(
  latitud1: number,
  longitud1: number,
  latitud2: number,
  longitud2: number
): number {
  const dLat = aRadianes(latitud2 - latitud1);
  const dLon = aRadianes(longitud2 - longitud1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(latitud1)) * Math.cos(aRadianes(latitud2)) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}
