import { driverCalculoLlegada } from '../drivers/driverCalculoLlegada';
import { BUS_CERCA, BUS_LEJOS, HORA_ACTUAL, PARADERO_COLEGIO } from '../datosPrueba';

/**
 * INTEGRACIÓN ASCENDENTE (bottom-up) — geo + eta + alertas
 *
 * Aquí MonitorRuta "no existe": el DRIVER (tests/drivers/driverCalculoLlegada.ts) hace su papel
 * llamando a los módulos de bajo nivel en el orden correcto.
 *
 *   driverCalculoLlegada  (driver, reemplaza a MonitorRuta)
 *        ├──> geo       (real)
 *        ├──> eta       (real)
 *        └──> alertas   (real)
 */
describe('Bottom-up - geo + eta + alertas mediante driver', () => {
  // Escenario base (el del ejemplo). Cada prueba cambia solo lo que le interesa con el operador spread.
  const base = {
    bus: BUS_CERCA,
    paradero: PARADERO_COLEGIO,
    velocidadKmh: 30,
    factorTrafico: 1.0,
    horaActual: HORA_ACTUAL,
    horaProgramadaLlegada: new Date('2026-10-13T06:40:00-05:00'),
  };

  it('driverCalculoLlegada_conBusCercaAViaLibre_debeEncadenarDistanciaETAyAlerta', () => {
    // Arrange
    const escenario = { ...base };

    // Act
    const r = driverCalculoLlegada(escenario);

    // Assert: 1.322 km a 30 km/h = 2.64 min -> 3 min -> llega 06:33, antes de las 06:40
    expect(r.distanciaKm).toBeCloseTo(1.322, 3);
    expect(r.minutosEstimados).toBe(3);
    expect(r.horaEstimadaLlegada).toEqual(new Date('2026-10-13T06:33:00-05:00'));
    expect(r.minutosRetraso).toBe(0);
    expect(r.nivelAlerta).toBe('NINGUNA');
  });

  it('driverCalculoLlegada_conBusLejosYTrancon_debeReportarAlertaGrave', () => {
    // Arrange: 3.314 km a 15 km/h con trancón severo (x3.0)
    const escenario = { ...base, bus: BUS_LEJOS, velocidadKmh: 15, factorTrafico: 3.0 };

    // Act
    const r = driverCalculoLlegada(escenario);

    // Assert: 3.314 / 15 x 60 = 13.26 min; x 3.0 = 39.77 -> 40 min -> llega 07:10.
    // Programada 06:40 -> retraso de 30 min (> 15) -> GRAVE
    expect(r.distanciaKm).toBeCloseTo(3.314, 3);
    expect(r.minutosEstimados).toBe(40);
    expect(r.horaEstimadaLlegada).toEqual(new Date('2026-10-13T07:10:00-05:00'));
    expect(r.minutosRetraso).toBe(30);
    expect(r.nivelAlerta).toBe('GRAVE');
  });

  it('driverCalculoLlegada_conRetrasoDeExactamente15Minutos_debeReportarAlertaLeve', () => {
    // Arrange: el bus llega 06:33 (3 min). Para tener exactamente 15 min de retraso,
    // la hora programada debe ser 06:33 - 15 min = 06:18
    const escenario = { ...base, horaProgramadaLlegada: new Date('2026-10-13T06:18:00-05:00') };

    // Act
    const r = driverCalculoLlegada(escenario);

    // Assert: RN-08 -> "más de 5 y hasta 15 (incluido)" es LEVE; 15 NO es GRAVE
    expect(r.minutosEstimados).toBe(3);
    expect(r.horaEstimadaLlegada).toEqual(new Date('2026-10-13T06:33:00-05:00'));
    expect(r.minutosRetraso).toBe(15);
    expect(r.nivelAlerta).toBe('LEVE');
  });

  it('driverCalculoLlegada_conBusEnElParadero_debeRetornarCeroMinutos', () => {
    // Arrange: el bus tiene EXACTAMENTE las coordenadas del paradero -> distancia 0
    const escenario = { ...base, bus: PARADERO_COLEGIO };

    // Act
    const r = driverCalculoLlegada(escenario);

    // Assert: RN-02 -> distancia 0 = 0 minutos; llega "ahora" (06:30) y estaba programado a las 06:40 -> sin retraso
    expect(r.distanciaKm).toBe(0);
    expect(r.minutosEstimados).toBe(0);
    expect(r.horaEstimadaLlegada).toEqual(HORA_ACTUAL);
    expect(r.minutosRetraso).toBe(0);
    expect(r.nivelAlerta).toBe('NINGUNA');
  });

  it('driverCalculoLlegada_conBusDetenido_debeRetornarETAyAlertaNull', () => {
    // Arrange: velocidad 0 con distancia > 0 -> tiempo indefinido
    const escenario = { ...base, velocidadKmh: 0 };

    // Act
    const r = driverCalculoLlegada(escenario);

    // Assert: RN-02 y RN-05 -> null en todo lo que dependa del tiempo; la distancia sí se conoce
    expect(r.distanciaKm).toBeCloseTo(1.322, 3);
    expect(r.minutosEstimados).toBeNull();
    expect(r.horaEstimadaLlegada).toBeNull();
    expect(r.minutosRetraso).toBeNull();
    expect(r.nivelAlerta).toBeNull();
  });
});
