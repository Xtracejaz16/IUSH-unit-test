import { ServicioTrafico } from '../../src/servicios';

/**
 * STUB del servicio de tráfico (el componente real aún no existe: lo construye otro equipo).
 * Retorna un factor fijo, o falla si se configura "caído".
 */
export class ServicioTraficoStub implements ServicioTrafico {
  public llamadas = 0;
  private caido = false;

  constructor(private readonly factor: number = 1.0) {}

  simularCaida(): this {
    this.caido = true;
    return this;
  }

  async obtenerFactor(): Promise<number> {
    this.llamadas++;
    if (this.caido) {
      throw new Error('Servicio de tráfico no disponible');
    }
    return this.factor;
  }
}
