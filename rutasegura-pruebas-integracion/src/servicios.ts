/**
 * RutaSegura - Contratos (interfaces) de los componentes externos que usa MonitorRuta.
 * Ninguno tiene implementación real en este repositorio: en las pruebas de integración
 * se reemplazan por STUBS (ver tests/stubs/).
 */
import { Acudiente } from './notificador';

/** Lectura cruda del dispositivo GPS instalado en el bus. */
export interface PosicionGPS {
  latitud: number;
  longitud: number;
  /** Velocidad en METROS POR SEGUNDO (así la entrega el hardware GPS). */
  velocidadMs: number;
}

/** Proveedor GPS (hardware + API del fabricante). Lanza un Error si el bus no tiene señal. */
export interface ProveedorGPS {
  obtenerPosicion(placa: string): Promise<PosicionGPS>;
}

export interface Coordenada {
  latitud: number;
  longitud: number;
}

/** Información de la ruta escolar registrada en la base de datos del colegio. */
export interface InfoRuta {
  paradero: Coordenada;
  horaProgramadaLlegada: Date;
  capacidad: number;
  estudiantesABordo: number;
  acudientes: Acudiente[];
}

/** Base de datos de rutas. Retorna null si la placa no tiene ruta asignada. */
export interface RepositorioRutas {
  obtenerRuta(placa: string): Promise<InfoRuta | null>;
}

/** Servicio de tráfico (lo está construyendo otro equipo). Retorna un factor entre 1.0 y 3.0. */
export interface ServicioTrafico {
  obtenerFactor(latitud: number, longitud: number): Promise<number>;
}

/** Lo que MonitorRuta necesita del módulo de notificación (lo cumple NotificadorAcudientes). */
export interface Notificador {
  notificarProximidad(
    placa: string,
    minutosEstimados: number | null,
    acudientes: Acudiente[]
  ): Promise<number>;
}
