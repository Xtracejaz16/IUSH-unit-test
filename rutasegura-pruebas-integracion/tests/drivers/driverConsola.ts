import { driverCalculoLlegada } from './driverCalculoLlegada';
import { BUS_CERCA, BUS_LEJOS, HORA_ACTUAL, PARADERO_COLEGIO } from '../datosPrueba';

/**
 * DRIVER "clásico" de consola: ejecuta los módulos integrados con una tabla de escenarios
 * e imprime los resultados para inspección manual. Ejecutar con:  npm run driver
 *
 * Compárenlo con tests/bottom-up/: el driver de consola NO verifica nada automáticamente,
 * una persona tiene que mirar la tabla. ¿Qué ventaja tiene convertirlo en pruebas con Jest?
 */
const programada = new Date('2026-10-13T06:40:00-05:00');

const escenarios = [
  { nombre: 'Cerca, vía libre', bus: BUS_CERCA, velocidadKmh: 30, factorTrafico: 1.0 },
  { nombre: 'Lejos, vía libre', bus: BUS_LEJOS, velocidadKmh: 30, factorTrafico: 1.0 },
  { nombre: 'Lejos, trancón', bus: BUS_LEJOS, velocidadKmh: 15, factorTrafico: 3.0 },
  { nombre: 'Bus detenido', bus: BUS_LEJOS, velocidadKmh: 0, factorTrafico: 1.0 },
];

const filas = escenarios.map((e) => {
  const r = driverCalculoLlegada({
    bus: e.bus,
    paradero: PARADERO_COLEGIO,
    velocidadKmh: e.velocidadKmh,
    factorTrafico: e.factorTrafico,
    horaActual: HORA_ACTUAL,
    horaProgramadaLlegada: programada,
  });
  return {
    escenario: e.nombre,
    'distancia (km)': r.distanciaKm.toFixed(3),
    'ETA (min)': r.minutosEstimados,
    'retraso (min)': r.minutosRetraso,
    alerta: r.nivelAlerta,
  };
});

console.table(filas);
