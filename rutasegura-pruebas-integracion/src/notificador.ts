/**
 * RutaSegura - Notificación a acudientes cuando el bus está cerca.
 * Reglas de negocio: RN-10 a RN-13 (ver README.md).
 * Versión 1.1: defectos del taller de pruebas unitarias corregidos.
 */

export interface Acudiente {
  nombre: string;
  telefono: string;
  notificacionesActivas: boolean;
}

/** Dependencia externa: proveedor de SMS. En las pruebas unitarias se debe simular (mock). */
export interface ServicioMensajeria {
  enviarSMS(telefono: string, mensaje: string): Promise<boolean>;
}

export const UMBRAL_MINUTOS_NOTIFICACION = 10;

export class NotificadorAcudientes {
  constructor(private readonly mensajeria: ServicioMensajeria) {}

  /**
   * Envía un SMS a los acudientes si el bus está a UMBRAL_MINUTOS_NOTIFICACION minutos o menos.
   * @returns Cantidad de SMS enviados con éxito.
   */
  async notificarProximidad(
    placa: string,
    minutosEstimados: number | null,
    acudientes: Acudiente[]
  ): Promise<number> {
    if (minutosEstimados === null || minutosEstimados > UMBRAL_MINUTOS_NOTIFICACION) {
      return 0;
    }

    const mensaje = `RutaSegura: el bus ${placa} llegará en aproximadamente ${minutosEstimados} minutos.`;
    let enviados = 0;

    for (const acudiente of acudientes.filter((a) => a.notificacionesActivas)) {
      try {
        const ok = await this.mensajeria.enviarSMS(acudiente.telefono, mensaje);
        if (ok) {
          enviados++;
        }
      } catch {
        // Si falla un envío se continúa con los demás acudientes.
      }
    }
    return enviados;
  }
}
