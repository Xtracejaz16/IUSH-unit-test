# Guía de estudio y sustentación — Taller de pruebas de integración (RutaSegura)

> Esta guía explica **todo** el taller con lenguaje sencillo y analogías, paso a paso, para poder sustentarlo. Los entregables formales están en `REPORTE_DEFECTOS.md` y `RESPUESTAS.md`.

---

## 0. El taller en 30 segundos (para empezar la sustentación)

1. **RutaSegura** calcula cuánto le falta al bus escolar para llegar al paradero y avisa por SMS a los acudientes cuando está a 10 minutos o menos.
2. En el taller anterior probamos cada módulo **por separado** (pruebas unitarias). Ahora probamos si **funcionan juntos** (pruebas de integración).
3. Como no siempre están todas las piezas, usamos **stubs** (piezas falsas que reemplazan a lo de *abajo*) y **drivers** (piezas falsas que reemplazan a lo de *arriba*).
4. Integramos de dos maneras: **ascendente** (de abajo hacia arriba, con drivers) y **descendente** (de arriba hacia abajo, con stubs).
5. Resultado: **25 pruebas, 18 pasan y 7 fallan**. Las 7 fallas vienen de **solo 2 defectos**, ambos en `MonitorRuta` y en la **unión** con otros módulos: (1) la velocidad del GPS está en **m/s** y nadie la pasó a **km/h**; (2) cuando el bus va **adelantado** el retraso sale negativo y el sistema se cae.
6. Comprobamos que las pruebas están bien porque, al corregir las 2 líneas en una **copia**, pasan las **25**. No tocamos `src/`, como pide la regla del taller.

---

## 1. Los conceptos, con una analogía de restaurante

Imaginen que estamos abriendo un **restaurante**. Cada pieza hace algo: el proveedor entrega ingredientes, el cocinero prepara el plato, el mesero lo lleva a la mesa.

| Concepto | En el restaurante | En RutaSegura |
|---|---|---|
| **Prueba unitaria** | Probar cada ingrediente y cada receta **por separado**: ¿la sal es sal? ¿la salsa queda bien? | El taller anterior: probar `eta`, `alertas`, `notificador`… solos |
| **Prueba de integración** | Probar que el plato **completo** sale bien cuando proveedor, cocinero y mesero trabajan **juntos**. | Este taller: ¿funcionan `MonitorRuta` + GPS + tráfico + notificador **juntos**? |
| **Stub** (reemplaza a lo de **abajo**) | El **proveedor de mentiras**: llega siempre con los mismos ingredientes, sin sorpresas, para poder probar al cocinero aunque el proveedor real no haya llegado. | `ProveedorGPSStub`, `ServicioTraficoStub`, `RepositorioRutasStub`, `NotificadorStub`, `MensajeriaStub` |
| **Driver** (reemplaza a lo de **arriba**) | El **mesero de mentiras**: un actor que hace pedidos al cocinero, porque el mesero real todavía no existe. | `driverCalculoLlegada`, `driverNotificacion` (hacen el papel de `MonitorRuta`) |
| **Big bang** | Abrir el restaurante al público el primer día con todo sin probar. Si el plato sale mal, ¿fue el proveedor, el cocinero, el mesero o el horno? **No lo sabes.** | Lo que **no** hicimos (es el anti-ejemplo) |
| **Top-down** (descendente) | Probar primero el **servicio completo** con proveedores de mentira, y cambiarlos por los reales de a poco. | `tests/top-down/` nivel 1 y nivel 2 |
| **Bottom-up** (ascendente) | Probar primero **la cocina**, luego sumarle el mesero de mentira, hasta llegar al restaurante completo. | `tests/bottom-up/` |

**Regla para no confundirlos nunca:**

```
       (arriba)   quien LLAMA        →  DRIVER lo reemplaza
          │
   [ módulo que probamos ]
          │
       (abajo)    quien es LLAMADO   →  STUB lo reemplaza
```

> «El **driver** conduce (arranca la prueba y llama). El **stub** responde (contesta lo que se le programó).»

**Stub vs. mock:** el stub *da respuestas*. El mock, además, *verifica cómo lo llamaron*. Nuestros stubs guardan las llamadas (`gps.llamadas`, `notificador.llamadas`, `mensajeria.enviados`), así que también se pueden usar para verificar interacciones. Analogía: el stub es el actor que dice su línea; si además anota quién le habló y cuándo, es un testigo con libreta.

---

## 2. La arquitectura: ¿quién hace qué?

```
                         MonitorRuta                ← el "director de orquesta" (nivel superior)
     ┌──────────┬────────┬────────┬─────────┬──────────────┐
validaciones    geo     eta    alertas   Notificador   GPS / Rutas / Tráfico (externos)
                                              │
                                        ServicioMensajería (SMS externo)
```

**`MonitorRuta` es un director de orquesta**: no toca ningún instrumento, les da la entrada a todos y en el orden correcto. Si cada músico toca perfecto solo (pruebas unitarias) pero el director da mal la entrada, la música suena mal. Eso es exactamente lo que encontramos.

El orden en que trabaja `MonitorRuta.monitorear(placa, hora)`:

| Paso | Regla | Qué hace | Analogía |
|---|---|---|---|
| 1 | RN-15 | Limpia la placa y revisa que exista la ruta | El portero revisa que la placa sea válida y esté en la lista |
| 2 | RN-16 | Pide la posición al GPS | Llamar al conductor: «¿dónde estás?» |
| 3 | RN-17 | Pide el tráfico; si falla usa 1.5 | Si la app de tráfico no responde, suponer «tráfico medio» |
| 4 | RN-18 | Calcula distancia y **convierte m/s a km/h** | Traducir idiomas antes de hablar con el calculista |
| 5 | RN-19 | Si está detenido, lo reporta y termina | Si el bus no avanza, no hay hora de llegada |
| 6 | RN-20 | Calcula retraso y alerta | Comparar «cuándo debía llegar» con «cuándo llegará» |
| 7 | RN-21 | Avisa a los acudientes | Mandar el SMS |

---

## 3. Paso a paso del taller

### Paso 0 — Preparar el ambiente
`npm install`, `npm test` y `npm run driver`. Al comienzo: 5 pruebas pasan y 19 son `todo` (pendientes). Al terminar: 0 `todo`.

### Paso 1 — Leer un stub y un driver

| | `ProveedorGPSStub` | `driverCalculoLlegada` |
|---|---|---|
| ¿Quién lo llama? | `MonitorRuta` | La prueba de Jest |
| ¿A quién llama? | A nadie (solo responde) | `geo`, `eta` y `alertas` |
| ¿Qué reemplaza? | Al GPS real (hardware) | A `MonitorRuta`, que todavía no existe |

```
   driver ──→ [ geo, eta, alertas ]        (bottom-up: el driver llama hacia abajo)
   [ MonitorRuta ] ──→ stubs               (top-down: los stubs reciben la llamada)
```

El arreglo `llamadas` del stub sirve para verificar **a quién consultó** `MonitorRuta`, no solo qué devolvió.

**Frase de control:** «El stub está **debajo** del módulo bajo prueba y el driver está **encima**».

### Paso 2 — Integración ascendente (drivers)

**La regla de oro:** primero calcular **a mano**, luego programar. Una prueba cuyo valor esperado se copia de lo que el código devolvió no prueba nada (sería una «foto del defecto»).

Fórmula (RN-01): `minutos = ⌈ distancia / velocidad × 60 × factor ⌉` (⌈ ⌉ = redondear hacia arriba).

**Tabla 2.1 completa, con cada cálculo explicado:**

| Escenario | Distancia | Velocidad | Factor | Minutos ETA | Hora llegada | Programada | Retraso | Alerta |
|---|---|---|---|---|---|---|---|---|
| Ejemplo (hecho) | 1.322 km | 30 km/h | 1.0 | 3 | 06:33 | 06:40 | 0 | NINGUNA |
| Lejos y trancón | 3.314 km | 15 km/h | 3.0 | **40** | **07:10** | 06:40 | **30** | **GRAVE** |
| Retraso de exactamente 15 | 1.322 km | 30 km/h | 1.0 | **3** | **06:33** | **06:18** | 15 | **LEVE** |
| Bus en el paradero | 0 km | 30 km/h | 1.0 | **0** | **06:30** | 06:40 | **0** | **NINGUNA** |
| Bus detenido | 1.322 km | 0 km/h | 1.0 | **null** | **null** | 06:40 | **null** | **null** |

Cómo se calculó cada fila:

- **Ejemplo:** 1.322 / 30 = 0.0441 h × 60 = 2.64 min → ⌈2.64⌉ = **3**. 06:30 + 3 = 06:33, antes de las 06:40 → retraso 0.
- **Lejos y trancón:** 3.314 / 15 × 60 = 13.26 min; × 3.0 (trancón severo) = 39.77 → **40**. 06:30 + 40 min = **07:10**. Programada 06:40 → **30 min de retraso** → más de 15 → **GRAVE**.
- **Retraso exacto de 15:** el bus llega 06:33. Para que el retraso sea justo 15, la hora programada tiene que ser 06:33 − 15 = **06:18**. RN-08: «más de 5 y *hasta 15 incluido*» es **LEVE**, no GRAVE. Es la prueba de **valor límite**: el 15 exacto es donde más se equivocan los programadores (`>` vs `>=`).
- **Bus en el paradero:** el bus debe tener **las mismas coordenadas del paradero** (`PARADERO_COLEGIO`; por eso `BUS_LEJOS` no sirve) → distancia 0 → 0 minutos (RN-02). Llega 06:30 y estaba programado a las 06:40 → llegó 10 min antes → el retraso es 0 (no −10).
- **Bus detenido:** velocidad 0 con distancia > 0 → tiempo indefinido → `null` en todo lo que depende del tiempo. La distancia sí se conoce (1.322).

**Tabla del notificador (`notificacion.test.ts`):**

| Prueba | Cálculo | Resultado |
|---|---|---|
| Tráfico sube el ETA sobre 10 | 5 km, 40 km/h: 7.5 min × 1.5 = 11.25 → **12** > 10 | 0 SMS (RN-10) |
| Bus detenido | velocidad 0 → `eta` da `null` → el notificador recibe `null` | 0 SMS; la interfaz `eta → notificador` acepta `null` |
| Un teléfono que falla | 8 min (se notifica). RN-11 deja 2 (Carlos tiene notificaciones apagadas); falla Luisa | 1 SMS exitoso (a Marta), RN-13 |

**Resultado:** `npm run test:bottomup` → **9 de 9 pasan**.

**Pregunta de reflexión («¿encontraron defectos?»):** **No**, y es una conclusión valiosa. Los módulos de abajo están sanos. Además el driver recibe la velocidad ya en km/h y limita el retraso a 0 por sí mismo, así que **no ejecuta el código de `MonitorRuta`** donde estaban los defectos. *Un driver solo prueba lo que el driver hace.*

### Paso 3 — Integración descendente, nivel 1 (todo con stubs)

Ahora `MonitorRuta` es real y **todos** sus colaboradores externos son stubs. En estas pruebas se verifica:
1. **El resultado:** `reporte.estado`, `minutosEstimados`…
2. **Las interacciones:** `gps.llamadas`, `trafico.llamadas`, `notificador.llamadas` (a quién llamó **y a quién no**).

| # | Prueba | Idea y cálculo | ¿Pasa? |
|---|---|---|---|
| 1 | Placa sin ruta | `'ABC123'` es válida pero el repositorio no la conoce → `RUTA_NO_ENCONTRADA`. Verificar `gps.llamadas` vacío (sin ruta no se pregunta al GPS) | ✅ |
| 2 | Placa `'  wpx482 '` | Debe normalizarse a `WPX482`: se verifica `reporte.placa` y que `gps.llamadas` sea `['WPX482']` | ✅ |
| 3 | Coordenadas fuera de rango | Latitud 95 → `GPS_INVALIDO`, y **no** debe haberse consultado el tráfico ni notificado | ✅ |
| 4 | Velocidad cero | `DETENIDO`, con distancia 1.322 y ocupación 30/40 = **75 %**, sin ETA, sin alerta, sin SMS | ✅ |
| 5 | **m/s → km/h** | 10 m/s × 3.6 = **36 km/h**. 1.322 / 36 × 60 = 2.2 → **3 min** (no 8) | ❌ DEF-INT-01 |
| 6 | **Bus adelantado** | Programado 06:45, llega ~06:33 → retraso debe ser **0** y alerta NINGUNA | ❌ DEF-INT-02 |
| 7 | **Muy retrasado** | BUS_LEJOS a 5 m/s = 18 km/h, tráfico 1.5: 3.314 / 18 × 60 = 11.05 × 1.5 = 16.6 → **17** > 15 → GRAVE | ❌ DEF-INT-01 |
| 8 | Tráfico caído | Oráculo relativo (ver sección 4) | ✅ |
| 9 | Entrega al notificador | Con `toEqual` exacto: placa `WPX482`, **3** minutos y los 3 acudientes | ❌ DEF-INT-01 |

**Sobre la prueba 7:** elegimos los datos para que el ETA correcto (17) y el equivocado (60) sean distintos y la prueba verifique `minutosEstimados`. Si solo hubiéramos mirado «GRAVE», habría pasado **por la razón equivocada**: con el defecto también da GRAVE.

> ❌ **Error típico:** ver `Received: 8`, pensar «entonces es 8» y cambiar el `expect`. El valor esperado sale del **README**, nunca del código.

### Paso 4 — Integración descendente, nivel 2 (notificador real)

Bajamos un nivel: el `NotificadorStub` se cambia por el `NotificadorAcudientes` **real**; el stub baja hasta la mensajería (`MensajeriaStub`). Ahora vemos **lo que realmente leería el acudiente**.

| Prueba | Qué verifica | ¿Pasa? |
|---|---|---|
| SMS con minutos de `eta` | Texto exacto: «RutaSegura: el bus WPX482 llegará en aproximadamente **3** minutos.» (obtiene 8) | ❌ DEF-INT-01 |
| Falla un SMS | `fallarPara('3007778899')`: el monitoreo continúa; `smsEnviados` = 1; solo Luisa recibió | ✅ |
| Bus lejos, más de 10 min | BUS_LEJOS a 5 m/s (18 km/h): 11.05 → **12** > 10 → 0 SMS (RN-10). También se verifica `minutosEstimados = 12` (obtiene 40) | ❌ DEF-INT-01 |
| **Extra:** bus lejos a 8 m/s | 8 m/s = 28.8 km/h → 3.314 / 28.8 × 60 = 6.9 → **7 min** → debe avisar. Con el defecto el sistema cree que son **25 min** y **no avisa a nadie** | ❌ DEF-INT-01 |

La prueba **extra** es la que mejor demuestra el impacto real: *un acudiente no recibe aviso aunque el bus esté a 7 minutos*.

### Paso 5 — Reporte, respuestas y cobertura

- `REPORTE_DEFECTOS.md`: 2 defectos (7 pruebas fallidas → 2 causas raíz).
- `RESPUESTAS.md`: ejercicio 1 y las 10 preguntas.
- `evidencias/cobertura.png` (y `cobertura.txt`): 95 % de sentencias, `monitorRuta.ts` al 100 %. Lo no cubierto son las ramas de `RangeError` de `eta`, `alertas` y `validaciones`, que ya tienen su cobertura en el taller **unitario**: cada tipo de prueba cubre lo suyo.

---

## 4. Los 2 defectos explicados con analogías

### DEF-INT-01 — Unidades: el GPS habla en m/s y `eta` espera km/h

**Línea:** `monitorRuta.ts:84`

```ts
const velocidadKmh = posicion.velocidadMs;        // ❌  m/s usado como si fueran km/h
const velocidadKmh = posicion.velocidadMs * 3.6;  // ✅
```

**Analogía:** el cocinero dice «necesito la receta en **tazas**» y el proveedor la entrega en **litros**. Cada uno hace bien su trabajo, pero nadie *traduce*, y el plato sale mal.

**Caso real famoso:** en 1999 la NASA perdió la sonda **Mars Climate Orbiter** (~125 millones de dólares) porque un equipo entregó datos en unidades inglesas (libras-fuerza) y otro los esperaba en métricas (newtons). Cada software estaba «correcto»; **la unión** no. Es exactamente este defecto.

**Por qué nadie lo ve:** los dos son `number`. TypeScript no distingue 10 m/s de 10 km/h.

**Impacto:** 10 m/s son 36 km/h, pero el sistema lo toma como 10 km/h → el bus parece 3.6 veces más lento → ETA de 8 min en vez de 3, y en el peor caso **el acudiente no recibe el SMS**.

**Por qué las pruebas unitarias no lo detectan:** `eta` está bien (si le dan km/h calcula bien) y `MonitorRuta` no existía.

### DEF-INT-02 — Retraso negativo cuando el bus va adelantado

**Línea:** `monitorRuta.ts:104-107`

```ts
// ❌ si el bus va adelantado, la resta es negativa y determinarNivelAlerta lanza RangeError
const minutosRetraso = Math.ceil((llegadaEstimada - programada) / 60_000);

// ✅ RN-20: nunca negativo
const minutosRetraso = Math.max(0, Math.ceil((llegadaEstimada - programada) / 60_000));
```

**Analogía:** llegas **10 minutos antes** a una cita y el sistema de registro de la clínica muestra «Error: llegaste −10 minutos tarde» y se bloquea. No existe el «retraso negativo»: llegar antes es «sin retraso».

**Detalle fino:** `determinarNivelAlerta(-1)` lanzando un error **es lo correcto** (RN-08). La culpa no es de `alertas`: es de quien la llama, `MonitorRuta`, que debía respetar su condición de uso (que el retraso sea ≥ 0). Es un defecto de **interfaz** (el «contrato» entre dos módulos).

**Impacto:** un bus adelantado es el caso **bueno y común**, y justo ahí el monitoreo se cae y no se manda el SMS (el error ocurre antes de RN-21).

### Por qué no «se mezclan»
Con una copia del código, corrigiendo **solo** el 1: falla solo la prueba del DEF-INT-02. Corrigiendo **solo** el 2: fallan las 6 del DEF-INT-01. Corrigiendo ambos: **25/25 pasan**. Son independientes. «Si dos pruebas fallan por la misma causa, es **un solo defecto** detectado por dos pruebas.»

---

## 5. Dos técnicas de diseño de pruebas que usamos

### Oráculo (de dónde sale el «valor esperado»)
El **oráculo** es la fuente de la verdad que dice cuál debe ser el resultado. Aquí es **el README** (la especificación) más cálculos hechos **a mano**, nunca la salida del código.

### Oráculo relativo (prueba 8, tráfico caído)
**Problema:** para probar RN-17 («si el tráfico falla, usar 1.5»), lo «obvio» es calcular a mano el ETA con factor 1.5 y compararlo. Pero ese ETA depende también de RN-18, que está defectuosa. La prueba fallaría **por la razón equivocada** (un defecto **enmascara** al otro).

**Solución:** armar **dos monitores idénticos**, uno con el tráfico caído y otro con `ServicioTraficoStub(1.5)`, y verificar que dan **los mismos** minutos. Se **comparan entre sí** y el defecto de unidades afecta a ambos por igual y se cancela.

**Analogía:** para saber si una balanza falla cuando se cae la luz, no necesitas conocer el peso exacto del objeto: pesas el objeto con la balanza «normal» y con la balanza «en modo de emergencia» y verificas que marquen **lo mismo**. Si la balanza está descalibrada, lo está en ambas y no estorba a lo que quieres probar.

Resultado: esta prueba **pasa** aunque exista DEF-INT-01, que es justo lo que se quiere: aísla RN-17.

---

## 6. ¿Qué hacemos con las pruebas que fallan?

**Dejarlas fallando.** La regla del taller es no modificar `src/`, y una prueba que falla porque el código incumple la especificación es un **hallazgo**, no un error nuestro. Las reportamos en `REPORTE_DEFECTOS.md`.

Para demostrar que no es un error de las pruebas, hicimos la copia de `src/` con las 2 correcciones: `Tests: 25 passed, 25 total`. (La copia no forma parte del repositorio.)

---

## 7. Preguntas probables en la sustentación (y respuesta corta)

| Pregunta | Respuesta corta |
|---|---|
| ¿Diferencia entre stub y driver? | Stub reemplaza a lo de **abajo** (lo llaman); driver reemplaza a lo de **arriba** (llama). `ProveedorGPSStub` vs `driverCalculoLlegada`. |
| ¿Por qué si las unitarias pasaron hay defectos? | Los defectos viven en las **uniones** entre módulos (unidades, rangos, orden). Cada pieza cumple su contrato, pero no el que las une. |
| ¿Por qué usaron valores a mano y no los del código? | Para no «fotografiar el defecto». El oráculo es el README. |
| ¿Qué defectos hallaron y con qué estrategia? | 2 defectos, ambos con **top-down N1**. Bottom-up no los vio porque el driver reemplaza a `MonitorRuta`. |
| ¿Cuántos defectos son si fallan 7 pruebas? | **2**. Varias pruebas pueden fallar por la misma causa. Lo comprobamos corrigiendo cada una por separado. |
| ¿Por qué N2 si ya hay N1? | El notificador stub no aplica reglas; con el real se ve el **texto exacto** y el **umbral** (el acudiente que no recibe aviso). |
| ¿Qué es un oráculo relativo? | Comparar dos ejecuciones entre sí en vez de contra un número calculado, para aislar una regla de otros defectos. |
| ¿Por qué hora fija? | Para que sea **Repeatable**: con `new Date()` la misma prueba pasaría a las 6:30 y fallaría a las 14:00. |
| ¿Qué riesgo tienen los stubs? | Que no se comporten como lo real y las pruebas pasen en un mundo falso. Se mitiga con contratos, pruebas de contrato y datos reales. |
| ¿Por qué no big bang? | Si todo falla a la vez no se sabe qué pieza es la culpable; con stubs/drivers la única variable es el módulo bajo prueba. |
| ¿Severidad? | **Alta** en ambos: afectan el propósito central (avisar al acudiente a tiempo). |
| ¿Qué dejaron como observación? | Placa con guion, tráfico que devuelve un valor fuera de rango y velocidad negativa: el README no los define, hay que aclararlos. |

---

## 8. Cómo ejecutarlo

```bash
cd rutasegura-pruebas-integracion
npm install
npm test               # 25 pruebas: 18 pasan, 7 fallan (esperado: son los hallazgos)
npm run test:bottomup  # 9 pasan
npm run test:topdown   # 7 fallan (6 por DEF-INT-01, 1 por DEF-INT-02)
npm run test:coverage  # cobertura (coverage/index.html)
npm run driver         # driver de consola
```

**Mapa de archivos:**

| Archivo | Para qué |
|---|---|
| `tests/bottom-up/calculoLlegada.test.ts` | Paso 2.2 — `geo + eta + alertas` con driver |
| `tests/bottom-up/notificacion.test.ts` | Paso 2.3 — `eta + notificador` con driver y stub de SMS |
| `tests/top-down/monitorRuta.nivel1.test.ts` | Paso 3 — todo con stubs |
| `tests/top-down/monitorRuta.nivel2.test.ts` | Paso 4 — notificador real |
| `REPORTE_DEFECTOS.md` | Paso 5 — 2 defectos |
| `RESPUESTAS.md` | Ejercicio 1 y preguntas 1-10 |
| `evidencias/cobertura.png` / `.txt` | Captura de cobertura |

---

## 9. Glosario rápido

| Término | Significado |
|---|---|
| **ETA** | *Estimated Time of Arrival*: minutos estimados para llegar |
| **Stub** | Pieza falsa que responde datos fijos; reemplaza a un componente de **abajo** |
| **Driver** | Programa falso que **llama** al módulo; reemplaza a uno de **arriba** |
| **Mock** | Como un stub, pero además **verifica cómo lo llamaron** |
| **Oráculo** | La fuente de verdad que define el resultado esperado |
| **Valor límite** | Valor justo en el borde de una regla (por ejemplo 15 minutos) |
| **Interfaz** | El «contrato» entre dos módulos (qué datos, en qué unidades y rangos) |
| **Error → defecto → falla** | Error: equivocación humana. Defecto: línea mala en el código. Falla: lo que ve el usuario |
| **FIRST** | Fast, Independent, **Repeatable**, Self-validating, Timely: características de una buena prueba |
| **Enmascarar** | Que un defecto esconda a otro (o haga que una prueba falle por la razón equivocada) |
| **AAA** | *Arrange-Act-Assert*: preparar, ejecutar, verificar |
