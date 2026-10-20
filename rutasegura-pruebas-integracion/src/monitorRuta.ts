/**
 * RutaSegura - Monitor de ruta: módulo de NIVEL SUPERIOR que integra a todos los demás.
 * Reglas de negocio: RN-15 a RN-21 (ver README.md).
 *
 *                         MonitorRuta
 *        ┌──────────┬──────────┼──────────┬───────────┐
 *   validaciones   geo        eta       alertas    Notificador ──> ServicioMensajeria
 *        └── ProveedorGPS, RepositorioRutas, ServicioTrafico (externos)
 */
import { esPlacaValida, validarCoordenadas } from './validaciones';
import { calcularDistanciaKm } from './geo';
import { calcularMinutosEstimados, calcularHoraEstimadaLlegada } from './eta';
import { determinarNivelAlerta, calcularPorcentajeOcupacion, NivelAlerta } from './alertas';
import { Notificador, ProveedorGPS, RepositorioRutas, ServicioTrafico } from './servicios';

export type EstadoSeguimiento =
  | 'EN_RUTA'
  | 'DETENIDO'
  | 'PLACA_INVALIDA'
  | 'RUTA_NO_ENCONTRADA'
  | 'SIN_SENAL'
  | 'GPS_INVALIDO';

export interface ReporteSeguimiento {
  placa: string;
  estado: EstadoSeguimiento;
  distanciaKm: number | null;
  minutosEstimados: number | null;
  horaEstimadaLlegada: Date | null;
  minutosRetraso: number | null;
  nivelAlerta: NivelAlerta | null;
  porcentajeOcupacion: number | null;
  smsEnviados: number;
}

export const FACTOR_TRAFICO_POR_DEFECTO = 1.5;

export class MonitorRuta {
  constructor(
    private readonly gps: ProveedorGPS,
    private readonly rutas: RepositorioRutas,
    private readonly trafico: ServicioTrafico,
    private readonly notificador: Notificador
  ) {}

  async monitorear(placaRecibida: string, horaActual: Date): Promise<ReporteSeguimiento> {
    const placa = placaRecibida.trim().toUpperCase();

    // RN-15
    if (!esPlacaValida(placa)) {
      return reporteSinDatos(placa, 'PLACA_INVALIDA');
    }
    const ruta = await this.rutas.obtenerRuta(placa);
    if (ruta === null) {
      return reporteSinDatos(placa, 'RUTA_NO_ENCONTRADA');
    }

    // RN-16
    let posicion;
    try {
      posicion = await this.gps.obtenerPosicion(placa);
    } catch {
      return reporteSinDatos(placa, 'SIN_SENAL');
    }
    if (!validarCoordenadas(posicion.latitud, posicion.longitud)) {
      return reporteSinDatos(placa, 'GPS_INVALIDO');
    }

    // RN-17
    let factorTrafico: number;
    try {
      factorTrafico = await this.trafico.obtenerFactor(posicion.latitud, posicion.longitud);
    } catch {
      factorTrafico = FACTOR_TRAFICO_POR_DEFECTO;
    }

    // RN-18
    const distanciaKm = calcularDistanciaKm(
      posicion.latitud,
      posicion.longitud,
      ruta.paradero.latitud,
      ruta.paradero.longitud
    );
    const velocidadKmh = posicion.velocidadMs;
    const minutosEstimados = calcularMinutosEstimados(velocidadKmh, distanciaKm, factorTrafico);
    const horaEstimadaLlegada = calcularHoraEstimadaLlegada(
      velocidadKmh,
      distanciaKm,
      factorTrafico,
      horaActual
    );
    const porcentajeOcupacion = calcularPorcentajeOcupacion(ruta.estudiantesABordo, ruta.capacidad);

    // RN-19
    if (minutosEstimados === null || horaEstimadaLlegada === null) {
      return {
        ...reporteSinDatos(placa, 'DETENIDO'),
        distanciaKm,
        porcentajeOcupacion,
      };
    }

    // RN-20
    const minutosRetraso = Math.ceil(
      (horaEstimadaLlegada.getTime() - ruta.horaProgramadaLlegada.getTime()) / 60_000
    );
    const nivelAlerta = determinarNivelAlerta(minutosRetraso);

    // RN-21
    const smsEnviados = await this.notificador.notificarProximidad(
      placa,
      minutosEstimados,
      ruta.acudientes
    );

    return {
      placa,
      estado: 'EN_RUTA',
      distanciaKm,
      minutosEstimados,
      horaEstimadaLlegada,
      minutosRetraso,
      nivelAlerta,
      porcentajeOcupacion,
      smsEnviados,
    };
  }
}

function reporteSinDatos(placa: string, estado: EstadoSeguimiento): ReporteSeguimiento {
  return {
    placa,
    estado,
    distanciaKm: null,
    minutosEstimados: null,
    horaEstimadaLlegada: null,
    minutosRetraso: null,
    nivelAlerta: null,
    porcentajeOcupacion: null,
    smsEnviados: 0,
  };
}
