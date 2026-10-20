import { ServicioMensajeria } from '../../src/notificador';

/**
 * STUB del proveedor de SMS. Nunca envía un SMS real: guarda los mensajes en memoria
 * para que la prueba pueda revisarlos. Se le puede indicar qué teléfonos deben fallar.
 */
export class MensajeriaStub implements ServicioMensajeria {
  public enviados: { telefono: string; mensaje: string }[] = [];
  private readonly telefonosQueFallan = new Set<string>();

  fallarPara(telefono: string): this {
    this.telefonosQueFallan.add(telefono);
    return this;
  }

  async enviarSMS(telefono: string, mensaje: string): Promise<boolean> {
    if (this.telefonosQueFallan.has(telefono)) {
      throw new Error(`Operador rechazó el SMS a ${telefono}`);
    }
    this.enviados.push({ telefono, mensaje });
    return true;
  }
}
