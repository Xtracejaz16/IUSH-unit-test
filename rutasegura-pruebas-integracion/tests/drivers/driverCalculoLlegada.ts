import { calcularDistanciaKm } from '../../src/geo';
import { calcularMinutosEstimados, calcularHoraEstimadaLlegada } from '../../src/eta';
import { determinarNivelAlerta, NivelAlerta } from '../../src/alertas';
import { Coordenada } from '../../src/servicios';

/**
 * DRIVER de integración ascendente (bottom-up) — Nivel 1: geo + eta + alertas.
 *
 * Imaginen que MonitorRuta todavía NO existe. Para probar que geo, eta y alertas funcionan
 * JUNTOS, escribimos este "programa conductor": prepara las entradas, llama a los módulos
 * de bajo nivel en el orden en que lo haría el módulo superior y entrega los resultados.
 *
 * Un driver es código de prueba: es desechable y se reemplaza por el módulo real (MonitorRuta)
 * cuando este esté listo.
 */
export interface EscenarioLlegada {
  bus: Coordenada;
  paradero: Coordenada;
  velocidadKmh: number;
  factorTrafico: number;
  horaActual: Date;
  horaProgramadaLlegada: Date;
}

export interface ResultadoLlegada {
  distanciaKm: number;
  minutosEstimados: number | null;
  horaEstimadaLlegada: Date | null;
  minutosRetraso: number | null;
  nivelAlerta: NivelAlerta | null;
}

export function driverCalculoLlegada(e: EscenarioLlegada): ResultadoLlegada {
  const distanciaKm = calcularDistanciaKm(
    e.bus.latitud,
    e.bus.longitud,
    e.paradero.latitud,
    e.paradero.longitud
  );
  const minutosEstimados = calcularMinutosEstimados(e.velocidadKmh, distanciaKm, e.factorTrafico);
  const horaEstimadaLlegada = calcularHoraEstimadaLlegada(
    e.velocidadKmh,
    distanciaKm,
    e.factorTrafico,
    e.horaActual
  );
  if (horaEstimadaLlegada === null) {
    return { distanciaKm, minutosEstimados, horaEstimadaLlegada, minutosRetraso: null, nivelAlerta: null };
  }
  const minutosRetraso = Math.max(
    0,
    Math.ceil((horaEstimadaLlegada.getTime() - e.horaProgramadaLlegada.getTime()) / 60_000)
  );
  return {
    distanciaKm,
    minutosEstimados,
    horaEstimadaLlegada,
    minutosRetraso,
    nivelAlerta: determinarNivelAlerta(minutosRetraso),
  };
}
