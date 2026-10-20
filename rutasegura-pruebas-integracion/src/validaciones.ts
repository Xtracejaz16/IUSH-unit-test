/**
 * RutaSegura - Validaciones de datos recibidos desde el GPS y del registro de buses.
 * Reglas de negocio: RN-06 y RN-07 (ver README.md).
 * Versión 1.1: defectos del taller de pruebas unitarias corregidos.
 */

/**
 * Valida que una coordenada reportada por el GPS sea geográficamente posible.
 * Latitud válida: [-90, 90]. Longitud válida: [-180, 180]. Límites incluidos.
 */
export function validarCoordenadas(latitud: number, longitud: number): boolean {
  if (Number.isNaN(latitud) || Number.isNaN(longitud)) {
    return false;
  }
  const latitudValida = latitud >= -90 && latitud <= 90;
  const longitudValida = longitud >= -180 && longitud <= 180;
  return latitudValida && longitudValida;
}

/**
 * Valida el formato de placa de un bus escolar en Colombia: 3 letras + 3 dígitos.
 * Acepta guion opcional ("ABC-123"), minúsculas y espacios al inicio o al final.
 */
export function esPlacaValida(placa: string): boolean {
  const normalizada = placa.trim().toUpperCase();
  return /^[A-Z]{3}-?\d{3}$/.test(normalizada);
}
