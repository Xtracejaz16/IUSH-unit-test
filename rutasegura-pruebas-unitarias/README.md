# RutaSegura — Taller de Pruebas Unitarias (ASCAS12)

Repositorio base del taller de pruebas unitarias del curso **Aseguramiento de la Calidad del Software (ASCAS12)** — IUSH.

RutaSegura es la app que permite a los acudientes seguir en tiempo real el bus escolar de sus hijos. En este repositorio está una parte del **núcleo de lógica** de la app. Su trabajo es **probarla con Jest + TypeScript contra la especificación de este README**, no contra lo que "hace" el código.

> ⚠️ **Regla del taller:** NO modifiquen nada dentro de `src/`. Si una prueba falla porque el código no cumple la especificación, eso es un **hallazgo**: déjenla fallando y repórtenla en `REPORTE_DEFECTOS.md`.

## Requisitos

- Node.js 18 o superior
- npm

## Instalación y ejecución

```bash
npm install
npm test               # ejecuta todas las pruebas
npm run test:watch     # modo observación mientras escriben pruebas
npm run test:coverage  # reporte de cobertura (abrir coverage/index.html)
```

## Estructura

```
src/
  eta.ts            RN-01 a RN-05  Cálculo de tiempo y hora estimada de llegada
  validaciones.ts   RN-06 y RN-07  Coordenadas GPS y placa del bus
  alertas.ts        RN-08 y RN-09  Nivel de alerta por retraso y ocupación del bus
  notificador.ts    RN-10 a RN-13  SMS a acudientes (depende de un servicio externo)
tests/
  ejemplo.test.ts   Prueba de ejemplo (patrón AAA). Úsenla como guía.
  *.test.ts         Archivos que ustedes deben completar
RESPUESTAS.md       Preguntas del taller (responder aquí)
REPORTE_DEFECTOS.md Plantilla para reportar los defectos encontrados
evidencias/         Captura del reporte de cobertura
```

## Especificación (reglas de negocio)

.

### Módulo `eta.ts`

**`calcularMinutosEstimados(velocidadKmh, distanciaRestanteKm, factorTrafico): number | null`**

| ID | Regla |
|---|---|
| RN-01 | Minutos = (distancia / velocidad) × 60 × factorTrafico, **redondeado hacia arriba** al minuto entero. El tráfico **aumenta** el tiempo. Ej.: 10 km a 40 km/h con factor 1.5 → 22.5 → **23** minutos. |
| RN-02 | Si la distancia es 0 retorna **0** (el bus ya está en el paradero), aunque la velocidad sea 0. Si la velocidad es 0 y la distancia es mayor que 0, retorna **null** (bus detenido: tiempo indefinido). |
| RN-03 | Velocidad negativa o distancia negativa lanza **RangeError** (error de sensor). |
| RN-04 | El factor de tráfico debe estar entre **1.0 y 3.0, ambos incluidos**. Fuera de ese rango lanza **RangeError**. |

**`calcularHoraEstimadaLlegada(velocidadKmh, distanciaRestanteKm, factorTrafico, horaActual): Date | null`**

| ID | Regla |
|---|---|
| RN-05 | Retorna una **nueva** fecha igual a `horaActual` + los minutos de RN-01. Si el bus está detenido retorna **null**. **No debe modificar** el objeto `horaActual` recibido. Propaga los errores de RN-03 y RN-04. |

### Módulo `validaciones.ts`

| ID | Regla |
|---|---|
| RN-06 | `validarCoordenadas(latitud, longitud)`: retorna `true` solo si la latitud está en **[-90, 90]** y la longitud en **[-180, 180]**, **límites incluidos**. Si alguno es `NaN` retorna `false`. |
| RN-07 | `esPlacaValida(placa)`: formato de 3 letras + 3 dígitos (`ABC123`). Acepta guion opcional (`ABC-123`), minúsculas (`abc123`) y espacios al inicio/final. Cualquier otro formato es inválido. |

### Módulo `alertas.ts`

| ID | Regla |
|---|---|
| RN-08 | `determinarNivelAlerta(minutosRetraso)`: de 0 a 5 minutos (incluido) → `'NINGUNA'`; más de 5 y hasta 15 (incluido) → `'LEVE'`; más de 15 → `'GRAVE'`. Retraso negativo lanza **RangeError**. |
| RN-09 | `calcularPorcentajeOcupacion(estudiantesABordo, capacidad)`: porcentaje redondeado a **1 decimal**. Puede superar 100 (sobrecupo, la coordinación debe verlo). Capacidad ≤ 0 o estudiantes negativos lanzan **RangeError**. |

### Módulo `notificador.ts`

**`NotificadorAcudientes.notificarProximidad(placa, minutosEstimados, acudientes): Promise<number>`**

La clase recibe en su constructor un `ServicioMensajeria` (proveedor de SMS externo). **En las pruebas unitarias este servicio se simula con `jest.fn()`**: nunca se envía un SMS real.

| ID | Regla |
|---|---|
| RN-10 | Solo notifica si `minutosEstimados` **no es null** y es **menor o igual a 10**. En otro caso no envía nada y retorna 0. |
| RN-11 | Solo se envía SMS a los acudientes con `notificacionesActivas === true`. |
| RN-12 | El mensaje enviado es exactamente: `RutaSegura: el bus <PLACA> llegará en aproximadamente <N> minutos.` |
| RN-13 | Si el envío a un acudiente falla (el servicio rechaza la promesa o retorna `false`), se continúa con los demás. El valor retornado es la cantidad de envíos **exitosos**. |

## Convención de nombres de pruebas

```
<función>_<condición>_<resultadoEsperado>
calcularMinutosEstimados_conVelocidadCero_debeRetornarNull
```
