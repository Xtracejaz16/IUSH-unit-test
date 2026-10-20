# RutaSegura — Taller de Pruebas de Integración: Stubs y Drivers (ASCAS12)

Continuación del taller de pruebas unitarias del curso **Aseguramiento de la Calidad del Software (ASCAS12)** — IUSH.

En el taller anterior probamos cada módulo de RutaSegura **aislado**. Esta es la **versión 1.1**: el equipo de desarrollo ya corrigió los defectos que ustedes reportaron, y agregó el módulo que une todo: **`MonitorRuta`**. Ahora la pregunta no es "¿funciona cada pieza?" sino **"¿funcionan las piezas JUNTAS?"**.

> ⚠️ **Regla del taller:** NO modifiquen nada dentro de `src/`. Si una prueba falla porque el código no cumple la especificación, es un **hallazgo**: déjenla fallando y repórtenla en `REPORTE_DEFECTOS.md`.

> 📘 **Empiecen por [`TALLER_GUIADO.md`](TALLER_GUIADO.md)**: tiene el paso a paso de la sesión.

## Requisitos e instalación

Node.js 18 o superior y npm.

```bash
npm install
npm test                # todas las pruebas
npm run test:topdown    # solo integración descendente (stubs)
npm run test:bottomup   # solo integración ascendente (drivers)
npm run test:coverage   # cobertura (abrir coverage/index.html)
npm run driver          # driver de consola: imprime una tabla de escenarios
```

## Conceptos clave

| Concepto | Qué es | En este repositorio |
|---|---|---|
| **Stub** | Componente **falso que reemplaza a uno de ABAJO** (llamado por el módulo bajo prueba). Responde con datos fijos y controlados. | `tests/stubs/` — GPS, base de datos de rutas, tráfico, notificador y SMS |
| **Driver** | Programa **falso que reemplaza a uno de ARRIBA** (el que llama). Prepara datos, invoca los módulos de bajo nivel y entrega los resultados. | `tests/drivers/` — hacen el papel de `MonitorRuta` antes de que exista |
| **Top-down (descendente)** | Se empieza por el módulo superior con stubs, y se van cambiando stubs por módulos reales, nivel por nivel. | `tests/top-down/` nivel 1 y nivel 2 |
| **Bottom-up (ascendente)** | Se empieza por los módulos de abajo, combinados mediante drivers, y se sube hasta el módulo real. | `tests/bottom-up/` |
| **Big bang** | Se integra todo a la vez y se prueba al final. Cuando falla, es difícil saber dónde está el problema. | (No lo usamos: es el anti-ejemplo) |

> **Stub vs. mock:** un stub **entrega respuestas** para que el módulo de arriba pueda seguir. Un mock además **verifica las interacciones** (cómo lo llamaron). Nuestros stubs escritos a mano guardan las llamadas (`llamadas`, `enviados`), así que también permiten esas verificaciones. Con Jest se haría lo mismo con `jest.fn().mockResolvedValue(...)`. Aquí los escribimos a mano para que vean qué hay por dentro.

## Arquitectura

```
                               ┌──────────────┐
                               │  MonitorRuta │   ← módulo de nivel superior (nuevo)
                               └──────┬───────┘
     ┌──────────────┬────────────┬────┴─────┬────────────┬─────────────────────┐
┌────┴──────┐ ┌─────┴─────┐ ┌────┴──┐ ┌─────┴───┐ ┌──────┴───────┐ ┌───────────┴───────────┐
│validaciones│ │    geo    │ │  eta  │ │ alertas │ │ Notificador  │ │ ProveedorGPS          │
└───────────┘ └───────────┘ └───────┘ └─────────┘ └──────┬───────┘ │ RepositorioRutas      │
                                                          │         │ ServicioTrafico       │
                                                  ┌───────┴───────┐ │   (externos: STUBS)   │
                                                  │ServicioMensaj.│ └───────────────────────┘
                                                  │ (externo:STUB)│
                                                  └───────────────┘
```

## Estructura

```
src/
  validaciones.ts, eta.ts, alertas.ts, notificador.ts   Módulos del taller unitario (v1.1, corregidos)
  geo.ts             RN-14       Distancia entre dos coordenadas (nuevo)
  servicios.ts       Contratos (interfaces) de los componentes externos
  monitorRuta.ts     RN-15 a RN-21  Orquestador que integra todo (nuevo)
tests/
  datosPrueba.ts     Datos compartidos: placa, coordenadas de Medellín, hora fija, acudientes
  stubs/             Stubs escritos a mano
  drivers/           Drivers (incluye driverConsola.ts, que se ejecuta con npm run driver)
  top-down/          Integración descendente: nivel 1 (todo con stubs) y nivel 2 (notificador real)
  bottom-up/         Integración ascendente: módulos reales combinados con drivers
TALLER_GUIADO.md     Guía paso a paso de la sesión
RESPUESTAS.md        Preguntas del taller
REPORTE_DEFECTOS.md  Plantilla de defectos
```

## Especificación (reglas nuevas)

Las reglas RN-01 a RN-13 siguen vigentes (ver el repositorio del taller unitario).

### Módulo `geo.ts`

| ID | Regla |
|---|---|
| RN-14 | `calcularDistanciaKm(lat1, lon1, lat2, lon2)`: distancia en km con la fórmula de Haversine (radio de la Tierra = 6371 km). |

### Módulo `monitorRuta.ts` — `MonitorRuta.monitorear(placa, horaActual): Promise<ReporteSeguimiento>`

`MonitorRuta` recibe en su constructor: `ProveedorGPS`, `RepositorioRutas`, `ServicioTrafico` y un `Notificador`.

| ID | Regla |
|---|---|
| RN-15 | La placa se normaliza (sin espacios y en mayúsculas). Si no es válida (RN-07), retorna estado `PLACA_INVALIDA` **sin consultar** ningún otro componente. Si el repositorio no tiene ruta para la placa, retorna `RUTA_NO_ENCONTRADA`. |
| RN-16 | Si el GPS lanza un error, retorna `SIN_SENAL`. Si las coordenadas no son válidas (RN-06), retorna `GPS_INVALIDO` y **no consulta** el tráfico ni notifica. |
| RN-17 | El factor de tráfico se pide al `ServicioTrafico`. Si el servicio falla, se usa el factor por defecto **1.5** y el monitoreo continúa. |
| RN-18 | La distancia se calcula del bus al paradero (RN-14). **El GPS entrega la velocidad en m/s**: se debe convertir a km/h (× 3.6) antes de calcular el ETA (RN-01 y RN-05). |
| RN-19 | Si el bus está detenido (ETA `null`), retorna `DETENIDO` con la distancia y la ocupación. **No** calcula alerta y **no** notifica. |
| RN-20 | Retraso = minutos (redondeados hacia arriba) entre la hora programada de llegada y la hora estimada. **Si el bus va adelantado, el retraso es 0** (nunca negativo). El nivel de alerta se calcula con RN-08. |
| RN-21 | Si el bus está en ruta, entrega al `Notificador` la placa normalizada, los minutos estimados y los acudientes de la ruta, y reporta en `smsEnviados` lo que el notificador retorne. Estado: `EN_RUTA`. |

## Convención de nombres de pruebas

Igual que en el taller unitario: `<función>_<condición>_<resultadoEsperado>`.
