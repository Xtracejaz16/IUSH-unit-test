import { determinarNivelAlerta, calcularPorcentajeOcupacion } from '../src/alertas';

describe('RN-08 determinarNivelAlerta', () => {
  it('determinarNivelAlerta_conRetrasoCero_debeRetornarNINGUNA', () => {
    expect(determinarNivelAlerta(0)).toBe('NINGUNA');
  });
  it('determinarNivelAlerta_conRetraso5_debeRetornarNINGUNA', () => {
    expect(determinarNivelAlerta(5)).toBe('NINGUNA');
  });
  it('determinarNivelAlerta_conRetraso6_debeRetornarLEVE', () => {
    expect(determinarNivelAlerta(6)).toBe('LEVE');
  });
  it('determinarNivelAlerta_conRetraso15_debeRetornarLEVE', () => {
    expect(determinarNivelAlerta(15)).toBe('LEVE');
  });
  it('determinarNivelAlerta_conRetraso16_debeRetornarGRAVE', () => {
    expect(determinarNivelAlerta(16)).toBe('GRAVE');
  });
  it('determinarNivelAlerta_conRetrasoNegativo_debeLanzarRangeError', () => {
    expect(() => determinarNivelAlerta(-1)).toThrow(RangeError);
  });
});

describe('RN-09 calcularPorcentajeOcupacion', () => {
  it('calcularPorcentajeOcupacion_conMitadDeCapacidad_debeRetornar50', () => {
    expect(calcularPorcentajeOcupacion(20, 40)).toBe(50);
  });
  it('calcularPorcentajeOcupacion_con1De3_debeRedondearA33punto3', () => {
    expect(calcularPorcentajeOcupacion(1, 3)).toBe(33.3);
  });
  it('calcularPorcentajeOcupacion_con2De3_debeRedondearA66punto7', () => {
    expect(calcularPorcentajeOcupacion(2, 3)).toBe(66.7);
  });
  it('calcularPorcentajeOcupacion_conSobrecupo_debeRetornarMasDe100', () => {
    expect(calcularPorcentajeOcupacion(45, 40)).toBe(112.5);
  });
  it('calcularPorcentajeOcupacion_conCeroEstudiantes_debeRetornarCero', () => {
    expect(calcularPorcentajeOcupacion(0, 40)).toBe(0);
  });
  it('calcularPorcentajeOcupacion_conCapacidadCero_debeLanzarRangeError', () => {
    expect(() => calcularPorcentajeOcupacion(10, 0)).toThrow(RangeError);
  });
  it('calcularPorcentajeOcupacion_conCapacidadNegativa_debeLanzarRangeError', () => {
    expect(() => calcularPorcentajeOcupacion(10, -5)).toThrow(RangeError);
  });
  it('calcularPorcentajeOcupacion_conEstudiantesNegativos_debeLanzarRangeError', () => {
    expect(() => calcularPorcentajeOcupacion(-1, 40)).toThrow(RangeError);
  });
});