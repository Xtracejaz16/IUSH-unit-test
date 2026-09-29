import { validarCoordenadas, esPlacaValida } from '../src/validaciones';

describe('RN-06 validarCoordenadas', () => {
  it('validarCoordenadas_conValoresDelMedio_debeRetornarTrue', () => {
    expect(validarCoordenadas(6.25, -75.56)).toBe(true);
  });
  it('validarCoordenadas_conLatitud90_debeRetornarTrue', () => {
    expect(validarCoordenadas(90, 0)).toBe(true);
  });
  it('validarCoordenadas_conLatitudMenos90_debeRetornarTrue', () => {
    expect(validarCoordenadas(-90, 0)).toBe(true);
  });
  it('validarCoordenadas_conLongitud180_debeRetornarTrue', () => {
    expect(validarCoordenadas(0, 180)).toBe(true);
  });
  it('validarCoordenadas_conLongitudMenos180_debeRetornarTrue', () => {
    expect(validarCoordenadas(0, -180)).toBe(true);
  });
  it('validarCoordenadas_conLatitudSobre90_debeRetornarFalse', () => {
    expect(validarCoordenadas(90.0001, 0)).toBe(false);
  });
  it('validarCoordenadas_conLatitudBajoMenos90_debeRetornarFalse', () => {
    expect(validarCoordenadas(-90.0001, 0)).toBe(false);
  });
  it('validarCoordenadas_conLongitudSobre180_debeRetornarFalse', () => {
    expect(validarCoordenadas(0, 180.0001)).toBe(false);
  });
  it('validarCoordenadas_conLongitudBajoMenos180_debeRetornarFalse', () => {
    expect(validarCoordenadas(0, -180.0001)).toBe(false);
  });
  it('validarCoordenadas_conLatitudNaN_debeRetornarFalse', () => {
    expect(validarCoordenadas(NaN, 0)).toBe(false);
  });
  it('validarCoordenadas_conLongitudNaN_debeRetornarFalse', () => {
    expect(validarCoordenadas(0, NaN)).toBe(false);
  });
});

describe('RN-07 esPlacaValida', () => {
  it('esPlacaValida_conFormatoEstandar_debeRetornarTrue', () => {
    // Arrange
    const placa = 'WPX482';
    // Act
    const resultado = esPlacaValida(placa);
    // Assert
    expect(resultado).toBe(true);
  });
  it('esPlacaValida_conGuion_debeRetornarTrue', () => {
    expect(esPlacaValida('ABC-123')).toBe(true);
  });
  it('esPlacaValida_conMinusculas_debeRetornarTrue', () => {
    expect(esPlacaValida('abc123')).toBe(true);
  });
  it('esPlacaValida_conEspaciosAlInicioYFinal_debeRetornarTrue', () => {
    expect(esPlacaValida('  ABC123  ')).toBe(true);
  });
  it('esPlacaValida_conDosLetras_debeRetornarFalse', () => {
    expect(esPlacaValida('AB1234')).toBe(false);
  });
  it('esPlacaValida_conCuatroLetras_debeRetornarFalse', () => {
    expect(esPlacaValida('ABCD12')).toBe(false);
  });
  it('esPlacaValida_conDosDigitos_debeRetornarFalse', () => {
    expect(esPlacaValida('ABC12')).toBe(false);
  });
  it('esPlacaValida_conCuatroDigitos_debeRetornarFalse', () => {
    expect(esPlacaValida('ABC1234')).toBe(false);
  });
  it('esPlacaValida_conDigitosAntesDeLetras_debeRetornarFalse', () => {
    expect(esPlacaValida('123ABC')).toBe(false);
  });
  it('esPlacaValida_conCadenaVacia_debeRetornarFalse', () => {
    expect(esPlacaValida('')).toBe(false);
  });
  it('esPlacaValida_conDobleGuion_debeRetornarFalse', () => {
    expect(esPlacaValida('ABC--123')).toBe(false);
  });
  it('esPlacaValida_conEspacioEnElMedio_debeRetornarFalse', () => {
    expect(esPlacaValida('ABC 123')).toBe(false);
  });
});