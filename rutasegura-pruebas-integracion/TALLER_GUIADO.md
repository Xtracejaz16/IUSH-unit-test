# Taller guiado — Pruebas de integración con stubs y drivers
## Aseguramiento de la Calidad del Software (ASCAS12) — IUSH

**Objetivo:** integrar los módulos de RutaSegura con dos estrategias (ascendente y descendente) usando drivers y stubs, y encontrar defectos que **solo aparecen cuando los módulos trabajan juntos**.
**Modalidad:** parejas.
**Duración:** 2 horas.
**Prerrequisito:** taller de pruebas unitarias de RutaSegura (patrón AAA, Jest, mocks) y la clase de integración (stubs, drivers, top-down, bottom-up, big bang).

> ⚠️ Igual que en el taller anterior: **no modifiquen `src/`**. Si una prueba bien escrita falla, es un hallazgo: déjenla fallando y repórtenla.

### Mapa del taller

| Paso | Qué hacen | Tiempo |
|---|---|---|
| 0 | Preparar el ambiente | 10 min |
| 1 | Leer un stub y un driver | 15 min |
| 2 | Integración **ascendente** con drivers | 30 min |
| 3 | Integración **descendente** nivel 1 (todo con stubs) | 35 min |
| 4 | Integración descendente nivel 2 (notificador real) | 15 min |
| 5 | Reporte de defectos y cierre | 15 min |

Al final de cada paso hay un **✅ Punto de control**: no avancen sin cumplirlo.

---

## Paso 0 — Preparar el ambiente (10 min)

```bash
cd rutasegura-pruebas-integracion
npm install
npm test
npm run driver
```

Deberían ver **5 pruebas que pasan y 19 `todo`**, y una tabla con 4 escenarios impresa por el driver de consola.

Lean en el `README.md` las secciones **Conceptos clave**, **Arquitectura** y las reglas **RN-14 a RN-21**.

✅ **Punto de control:** `npm test` muestra `5 passed, 19 todo` y la tabla del driver aparece en la consola.

---

## Paso 1 — Leer un stub y un driver (15 min)

Abran estos dos archivos lado a lado:

- `tests/stubs/ProveedorGPSStub.ts`
- `tests/drivers/driverCalculoLlegada.ts`

Respondan en una hoja (o en `RESPUESTAS.md`, pregunta 1):

1. ¿Quién **llama** al `ProveedorGPSStub`? ¿Y a quién llama el `driverCalculoLlegada`?
2. ¿Qué componente **real** reemplaza cada uno?
3. ¿Para qué sirve el arreglo `llamadas` del stub? (Pista: en una prueba no solo importa *qué* retorna `MonitorRuta`, también *a quién* consultó.)

Completen este dibujo con flechas (→ significa "llama a"):

```
   ¿? ──→ [ geo, eta, alertas ]        (bottom-up)
   [ MonitorRuta ] ──→ ¿?             (top-down)
```

✅ **Punto de control:** pueden explicar en una frase: *"El stub está ______ del módulo bajo prueba y el driver está ______."*

---

## Paso 2 — Integración ascendente con drivers (30 min)

**Escenario:** `MonitorRuta` todavía no existe. Queremos comprobar que `geo`, `eta` y `alertas` funcionan bien **juntos**. El driver hace el papel del módulo que falta.

### 2.1 Calcular a mano antes de programar

Los datos están en `tests/datosPrueba.ts`. Completen la tabla **antes** de escribir código. Una prueba sin un valor esperado calculado de forma independiente no prueba nada.

| Escenario | Distancia | Velocidad | Factor | Minutos ETA | Hora llegada | Programada | Retraso | Alerta |
|---|---|---|---|---|---|---|---|---|
| Ejemplo (ya hecho) | 1.322 km | 30 km/h | 1.0 | 3 | 06:33 | 06:40 | 0 | NINGUNA |
| Lejos y trancón | 3.314 km | 15 km/h | 3.0 | | | 06:40 | | |
| Retraso de exactamente 15 | 1.322 km | 30 km/h | 1.0 | | | ¿? | 15 | |
| Bus en el paradero | 0 km | 30 km/h | 1.0 | | | 06:40 | | |
| Bus detenido | 1.322 km | 0 km/h | 1.0 | | | 06:40 | | |

> Fórmula (RN-01): `minutos = ⌈ distancia / velocidad × 60 × factor ⌉`

### 2.2 Completar `tests/bottom-up/calculoLlegada.test.ts`

Copien la prueba de ejemplo y cambien solo lo necesario. Para no repetir el escenario completo, pueden sacarlo a una constante y usar el operador *spread*:

```ts
const base = {
  bus: BUS_CERCA,
  paradero: PARADERO_COLEGIO,
  velocidadKmh: 30,
  factorTrafico: 1.0,
  horaActual: HORA_ACTUAL,
  horaProgramadaLlegada: new Date('2026-10-13T06:40:00-05:00'),
};

it('driverCalculoLlegada_conBusLejosYTrancon_debeReportarAlertaGrave', () => {
  // Act
  const r = driverCalculoLlegada({ ...base, bus: BUS_LEJOS, velocidadKmh: 15, factorTrafico: 3.0 });

  // Assert
  expect(r.minutosEstimados).toBe(/* su valor de la tabla */);
  expect(r.nivelAlerta).toBe(/* ... */);
});
```

Hagan las otras tres (`it.todo` → `it`). Para el bus en el paradero, ¿qué coordenadas debe tener el bus? (Pista: `BUS_LEJOS` no sirve.)

### 2.3 Completar `tests/bottom-up/notificacion.test.ts`

Este driver integra `eta` con el `NotificadorAcudientes` **real**, y debajo usa un stub de SMS. Es normal combinar drivers arriba y stubs abajo.

| Prueba | Pista |
|---|---|
| Tráfico que sube el ETA por encima de 10 | Mismo viaje del ejemplo (5 km, 40 km/h) pero con factor 1.5. ¿Cuántos minutos da? ¿Se notifica? |
| Bus detenido | Velocidad 0. ¿Qué valor le llega al notificador? Revisen `mensajeria.enviados`. |
| Un teléfono que falla | `new MensajeriaStub().fallarPara('3001112233')` |

✅ **Punto de control:** `npm run test:bottomup` → **9 pruebas pasan, 0 todo**. Si alguna falla, revisen primero su tabla de cálculos.

**Para pensar:** todos los módulos de abajo pasaron las pruebas unitarias. ¿Encontraron algún defecto en este paso? Anoten por qué creen que sí o que no.

---

## Paso 3 — Integración descendente, nivel 1 (35 min)

**Escenario ahora al revés:** `MonitorRuta` ya existe, pero el GPS, la base de datos, el servicio de tráfico y el notificador **no** (o no queremos usar los reales). Todos son **stubs**.

Abran `tests/top-down/monitorRuta.nivel1.test.ts`. La función `crearMonitor` arma el monitor con stubs por defecto. **Solo le pasan el stub que quieran cambiar:**

```ts
const { monitor, gps, trafico, notificador } = crearMonitor();                       // todo por defecto
const { monitor } = crearMonitor({ gps: new ProveedorGPSStub({ ...BUS_LEJOS, velocidadMs: 5 }) });
const { monitor } = crearMonitor({ trafico: new ServicioTraficoStub(1.0).simularCaida() });
const { monitor } = crearMonitor({ ruta: crearRuta({ horaProgramadaLlegada: new Date('...') }) });
```

En las pruebas top-down se verifican **dos cosas**:
1. **El resultado:** `reporte.estado`, `reporte.minutosEstimados`, etc.
2. **Las interacciones:** a quién llamó y a quién no (`gps.llamadas`, `trafico.llamadas`, `notificador.llamadas`).

### Pruebas a completar, en este orden

| # | Prueba | Pista |
|---|---|---|
| 1 | `...conPlacaSinRutaAsignada...` | Usen una placa válida que no esté en el stub, por ejemplo `'ABC123'`. ¿Se debe consultar el GPS? |
| 2 | `...conPlacaEnMinusculasYEspacios...` | `'  wpx482 '`. Verifiquen `reporte.placa` y con qué placa se llamó al GPS. |
| 3 | `...conCoordenadasFueraDeRango...` | Latitud 95. Además del estado, ¿qué **no** debe haber pasado? |
| 4 | `...conVelocidadCero...` | `velocidadMs: 0`. Revisen todos los campos que exige RN-19. |
| 5 | `...conVelocidadEnMetrosPorSegundo...` | **Lean RN-18 con calma.** El stub dice `velocidadMs: 10`. ¿Cuántos km/h son? ¿Cuántos minutos esperan para 1.322 km? Calcúlenlo **a mano**. |
| 6 | `...conBusQueLlegaAntesDeLaHoraProgramada...` | Programen la llegada a las 06:45. Según RN-20, ¿cuál debe ser el retraso? |
| 7 | `...conBusMuyRetrasado...` | Escojan GPS y tráfico para superar los 15 minutos de retraso. |
| 8 | `...conServicioDeTraficoCaido...` | Ver el reto abajo ⬇️ |
| 9 | `...debeEntregarAlNotificador...` | `expect(notificador.llamadas).toEqual([{ placa: ..., minutosEstimados: ..., acudientes: ... }])` |

### 🧩 Reto de la prueba 8 (tráfico caído)

La forma obvia es calcular a mano el ETA con factor 1.5 y compararlo. Pero si `MonitorRuta` tiene otro defecto en el cálculo del ETA, su prueba fallará **por la razón equivocada**: el otro defecto **enmascara** lo que quieren probar.

Idea: armen **dos** monitores, uno con el tráfico caído y otro con `new ServicioTraficoStub(1.5)`, y verifiquen que dan **los mismos** minutos. Esto se llama **oráculo relativo**. ¿Por qué aísla mejor la regla RN-17?

✅ **Punto de control:** `npm run test:topdown`. Deben tener **0 todo** en el nivel 1. **Es posible que algunas pruebas fallen.** Si están seguros de su valor esperado (calculado con la especificación), **no lo cambien para que pase**. Anoten la prueba, lo esperado y lo obtenido: lo usarán en el Paso 5.

> ❌ **Error típico:** ver `Received: 8`, pensar "ah, entonces es 8" y cambiar el `expect`. Eso convierte la prueba en una foto del defecto. El valor esperado sale del **README**, nunca del código.

---

## Paso 4 — Integración descendente, nivel 2 (15 min)

Ahora **bajamos un nivel**: el `NotificadorStub` se reemplaza por el `NotificadorAcudientes` **real**. El stub baja hasta el proveedor de SMS (`MensajeriaStub`).

Abran `tests/top-down/monitorRuta.nivel2.test.ts` y completen:

| Prueba | Pista |
|---|---|
| `...debeEnviarSMSConLosMinutosCalculadosPorEta...` | Verifiquen el **texto exacto** que le llegaría al acudiente. ¿Cuántos minutos debería decir según la especificación? |
| `...conFalloDeUnSMS...` | `new MensajeriaStub().fallarPara('3007778899')` |
| `...conBusLejosAMasDeDiezMinutos...` | `BUS_LEJOS` a 5 m/s. Calculen el ETA. |

Les conviene crear un `crearMonitor(mensajeria, ...)` como el del nivel 1 para no repetir el montaje.

✅ **Punto de control:** `npm test` → **0 todo** en todo el repositorio.

**Para pensar:** si en el Paso 3 encontraron un defecto en el cálculo del ETA, ¿qué ve ahora el **acudiente** en su celular? Con esto pasa de ser "un número mal calculado" a una **falla visible** para el usuario.

---

## Paso 5 — Reporte de defectos y cierre (15 min)

1. Por cada prueba que falla, llenen un bloque `DEF-INT-XX` en `REPORTE_DEFECTOS.md`. Si **dos pruebas fallan por la misma causa**, es **un solo defecto** detectado por dos pruebas.
2. Respondan en `RESPUESTAS.md` las preguntas 2, 3 y 6 (las demás quedan de tarea).
3. Ejecuten `npm run test:coverage` y guarden una captura en `evidencias/`.

### Entregables

- [ ] `tests/` sin ningún `it.todo`
- [ ] `REPORTE_DEFECTOS.md` con los defectos encontrados
- [ ] `RESPUESTAS.md` (preguntas 2, 3 y 6 en clase; el resto de tarea)
- [ ] Captura de cobertura en `evidencias/`

### Rúbrica

| Criterio | Qué se evalúa | % |
|---|---|---|
| Drivers (Paso 2) | Las 7 pruebas ascendentes con valores esperados calculados a mano y correctos | 20 % |
| Stubs (Pasos 3 y 4) | Pruebas descendentes que verifican **resultado e interacciones** (`llamadas`, `enviados`) | 30 % |
| Integridad del oráculo | Valores esperados tomados de la especificación; no se "acomodaron" pruebas al código | 20 % |
| Reporte de defectos | Defectos completos, sin duplicados, con módulos e interfaz involucrados | 20 % |
| Respuestas | Argumentadas con sus propias pruebas | 10 % |
