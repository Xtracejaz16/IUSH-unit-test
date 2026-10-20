import { InfoRuta, RepositorioRutas } from '../../src/servicios';

/**
 * STUB de la base de datos de rutas.
 * Funciona como una "base de datos en memoria": solo conoce las placas que la prueba registre.
 */
export class RepositorioRutasStub implements RepositorioRutas {
  private readonly rutas = new Map<string, InfoRuta>();

  conRuta(placa: string, ruta: InfoRuta): this {
    this.rutas.set(placa, ruta);
    return this;
  }

  async obtenerRuta(placa: string): Promise<InfoRuta | null> {
    return this.rutas.get(placa) ?? null;
  }
}
