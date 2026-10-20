import { Acudiente } from '../src/notificador';
import { InfoRuta } from '../src/servicios';

/**
 * Datos de prueba compartidos (fixtures). Coordenadas reales de Medellín.
 * Distancias calculadas con Haversine:
 *   BUS_LEJOS  -> PARADERO_COLEGIO ≈ 3.314 km
 *   BUS_CERCA  -> PARADERO_COLEGIO ≈ 1.322 km
 */
export const PLACA = 'WPX482';

export const PARADERO_COLEGIO = { latitud: 6.2476, longitud: -75.5658 };
export const BUS_LEJOS = { latitud: 6.23, longitud: -75.59 };
export const BUS_CERCA = { latitud: 6.24, longitud: -75.575 };

/** Siempre se usa una hora fija (principio FIRST: Repeatable). Nunca new Date() sin argumentos. */
export const HORA_ACTUAL = new Date('2026-10-13T06:30:00-05:00');

export const ACUDIENTES: Acudiente[] = [
  { nombre: 'Luisa Gómez', telefono: '3001112233', notificacionesActivas: true },
  { nombre: 'Carlos Ruiz', telefono: '3004445566', notificacionesActivas: false },
  { nombre: 'Marta Díaz', telefono: '3007778899', notificacionesActivas: true },
];

/**
 * Crea una ruta válida; cada prueba sobrescribe solo lo que le interesa.
 * Por defecto el bus debía llegar a las 06:30 (la HORA_ACTUAL), es decir, ya va tarde.
 */
export function crearRuta(cambios: Partial<InfoRuta> = {}): InfoRuta {
  return {
    paradero: PARADERO_COLEGIO,
    horaProgramadaLlegada: HORA_ACTUAL,
    capacidad: 40,
    estudiantesABordo: 30,
    acudientes: ACUDIENTES,
    ...cambios,
  };
}
