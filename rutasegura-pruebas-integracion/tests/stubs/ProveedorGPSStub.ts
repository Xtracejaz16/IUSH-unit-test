import { PosicionGPS, ProveedorGPS } from '../../src/servicios';

/**
 * STUB del proveedor GPS.
 * Reemplaza al hardware real: retorna SIEMPRE la posición que la prueba le configure,
 * o lanza un error si se configura "sin señal". También registra cuántas veces lo llamaron.
 */
export class ProveedorGPSStub implements ProveedorGPS {
  public llamadas: string[] = [];
  private sinSenal = false;

  constructor(private posicion: PosicionGPS) {}

  simularSinSenal(): this {
    this.sinSenal = true;
    return this;
  }

  async obtenerPosicion(placa: string): Promise<PosicionGPS> {
    this.llamadas.push(placa);
    if (this.sinSenal) {
      throw new Error('GPS sin señal');
    }
    return this.posicion;
  }
}
