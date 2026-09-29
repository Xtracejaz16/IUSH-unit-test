import { calcularMinutosEstimados, calcularHoraEstimadaLlegada } from '../src/eta';

// TODO: escribir las pruebas de RN-01 a RN-05.
// Recuerden: caso feliz + valores límite + casos de error. Un describe por regla.

describe('RN-01 calcularMinutosEstimados - fórmula y redonde', () => {
  it('calcularMinutosEstimados_con40kmh10kmFactor1_5_debeRetornar23', () => {
    
    const velocidad = 40, distancia = 10, factor = 1.5;
    const resultado = calcularMinutosEstimados(velocidad, distancia, factor);
    
    expect(resultado).toBe(23);
  });
  it('calcularMinutosEstimados_con60kmh60kmFactor1_0_debeRetornar60', () => {
    expect(calcularMinutosEstimados(60, 60, 1.0)).toBe(60); // 
  });

  it('calcularMinutosEstimados_con45kmh10kmFactor1_0_noDebeRedondearHaciaArriba', () => {
    expect(calcularMinutosEstimados(45, 10, 1.0)).toBe(14); // 10/45*60 = 13.3333..., *1.0 = 13.3333..., redondeado = 14
  });

  it('calcularMinutosEstimados_con60kmh60kmFactor1_2_debeRetornar24', () => {
    expect(calcularMinutosEstimados(60, 60, 0.09)).toThrow(RangeError);
  });

});


describe('RN-02 calcularMinutosEstimados - bus detenido / en paradero', () => {
  it('calcularMinutosEstimados_conVelocidadCeroYDistanciaCero_debeRetornarCero', () => {
    expect(calcularMinutosEstimados(0, 0, 1.0)).toBe(0);
  });

  it('calcularMinutosEstimados_conVelocidadCeroYDistanciaMayorACero_debeRetornarNull', () => {
    expect(calcularMinutosEstimados(0, 10, 1.4)).toBeNull();
  });

  it('calcularMinutosEstimados_conDistanciaCeroYVelocidadPositiva_debeRetornarCero', () => {
    expect(calcularMinutosEstimados(40, 0, 1.0)).toBe(0);
  });
});


describe('RN-03 calcularMinutosEstimados - datos negativos', () => {
  it('calcularMinutosEstimados_conDistanciaNegativa_debeLanzarRangeError', () => {
    expect(() => calcularMinutosEstimados(5, -10, 1.2)).toThrow(RangeError);
  });

  it('calcularMinutosEstimados_conVelocidadNegativa_debeLanzarRangeError', () => {
    expect(() => calcularMinutosEstimados(-4, 8, 1.6)).toThrow(RangeError);
  });
});


describe('RN-04 calcularMinutosEstimados - rango del factor de tráfico', () => {
  it('calcularMinutosEstimados_conFactorEnLimiteSuperior_debeCalcular', () => {
    expect(calcularMinutosEstimados(60, 60, 3.0)).toBe(180);
  });

  it('calcularMinutosEstimados_conFactorEnLimiteInferior_debeCalcular', () => {
    expect(calcularMinutosEstimados(60, 60, 1.0)).toBe(60);
  });

  it('calcularMinutosEstimados_conFactorJustoBajo1_0_debeLanzarRangeError', () => {
    expect(() => calcularMinutosEstimados(60, 60, 0.99)).toThrow(RangeError);
  });

  it('calcularMinutosEstimados_conFactorJustoSobre3_0_debeLanzarRangeError', () => {
    expect(() => calcularMinutosEstimados(60, 60, 3.01)).toThrow(RangeError);
  });
});


describe('RN-05 calcularHoraEstimadaLlegada', () => {
  // Hora fija para que la prueba no dependa del reloj real (FIRST: Repeatable)
  const crearHora = () => new Date('2026-01-15T06:30:00');

  it('calcularHoraEstimadaLlegada_conDatosNormales_debeSumarMinutosAHoraActual', () => {
    // 40 km/h, 10 km, factor 1.5 -> 23 min -> 06:30 + 23 = 06:53
    const resultado = calcularHoraEstimadaLlegada(40, 10, 1.5, crearHora());
    expect(resultado).toEqual(new Date('2026-01-15T06:53:00'));
  });

  it('calcularHoraEstimadaLlegada_conBusDetenido_debeRetornarNull', () => {
    expect(calcularHoraEstimadaLlegada(0, 5, 1.0, crearHora())).toBeNull();
  });

  it('calcularHoraEstimadaLlegada_siempre_noDebeModificarHoraActual', () => {
    const horaActual = crearHora();
    const original = horaActual.getTime();
    calcularHoraEstimadaLlegada(40, 10, 1.5, horaActual);
    expect(horaActual.getTime()).toBe(original);
  });

  it('calcularHoraEstimadaLlegada_siempre_debeRetornarUnObjetoDateNuevo', () => {
    const horaActual = crearHora();
    const resultado = calcularHoraEstimadaLlegada(40, 10, 1.5, horaActual);
    expect(resultado).not.toBe(horaActual);
  });

  it('calcularHoraEstimadaLlegada_conVelocidadNegativa_debePropagarRangeError', () => {
    expect(() => calcularHoraEstimadaLlegada(-1, 10, 1.0, crearHora())).toThrow(RangeError);
  });

  it('calcularHoraEstimadaLlegada_conFactorFueraDeRango_debePropagarRangeError', () => {
    expect(() => calcularHoraEstimadaLlegada(40, 10, 3.5, crearHora())).toThrow(RangeError);
  });
});