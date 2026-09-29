import { esPlacaValida } from '../src/validaciones';

/**
 * PRUEBA DE EJEMPLO — patrón Arrange / Act / Assert (AAA).
 * Úsenla como guía para escribir las demás. Pueden ampliar este archivo con más casos de RN-07.
 */
describe('RN-07 esPlacaValida', () => {
  it('esPlacaValida_conFormatoEstandar_debeRetornarTrue', () => {
    // Arrange: preparar los datos de entrada
    const placa = 'WPX482';

    // Act: ejecutar la unidad bajo prueba
    const resultado = esPlacaValida(placa);

    // Assert: verificar el resultado contra la especificación
    expect(resultado).toBe(true);
  });
});


