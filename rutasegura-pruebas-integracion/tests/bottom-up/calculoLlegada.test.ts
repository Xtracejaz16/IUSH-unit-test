import { driverCalculoLlegada } from '../drivers/driverCalculoLlegada';
import { BUS_CERCA, HORA_ACTUAL, PARADERO_COLEGIO } from '../datosPrueba';

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
  it('driverCalculoLlegada_conBusCercaAViaLibre_debeEncadenarDistanciaETAyAlerta', () => {
    // Arrange
    const escenario = {
      bus: BUS_CERCA,
      paradero: PARADERO_COLEGIO,
      velocidadKmh: 30,
      factorTrafico: 1.0,
      horaActual: HORA_ACTUAL,
      horaProgramadaLlegada: new Date('2026-10-13T06:40:00-05:00'),
    };

    // Act
    const r = driverCalculoLlegada(escenario);

    // Assert: 1.322 km a 30 km/h = 2.64 min -> 3 min -> llega 06:33, antes de las 06:40
    expect(r.distanciaKm).toBeCloseTo(1.322, 3);
    expect(r.minutosEstimados).toBe(3);
    expect(r.horaEstimadaLlegada).toEqual(new Date('2026-10-13T06:33:00-05:00'));
    expect(r.minutosRetraso).toBe(0);
    expect(r.nivelAlerta).toBe('NINGUNA');
  });

  it.todo('driverCalculoLlegada_conBusLejosYTrancon_debeReportarAlertaGrave');
  it.todo('driverCalculoLlegada_conRetrasoDeExactamente15Minutos_debeReportarAlertaLeve');
  it.todo('driverCalculoLlegada_conBusEnElParadero_debeRetornarCeroMinutos');
  it.todo('driverCalculoLlegada_conBusDetenido_debeRetornarETAyAlertaNull');
});
