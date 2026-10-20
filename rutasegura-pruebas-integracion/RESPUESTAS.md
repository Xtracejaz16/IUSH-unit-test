# Respuestas del taller — RutaSegura (Integración)

Integrantes:
- Sebastian Estrada Bustamante
- Yair Santiago Cetre Diaz

## Ejercicio 1 — Orden de integración

Regla para leer la tabla: **stub = reemplaza a lo que está debajo** (lo llama el módulo bajo prueba); **driver = reemplaza a lo que está arriba** (es quien llama al módulo bajo prueba).

| Paso | Top-down: módulos reales | Stubs necesarios | Bottom-up: módulos reales | Drivers necesarios |
|---|---|---|---|---|
| 1 | `MonitorRuta` + `validaciones`, `geo`, `eta`, `alertas` | `ProveedorGPSStub`, `RepositorioRutasStub`, `ServicioTraficoStub`, `NotificadorStub` (nivel 1) | `geo` + `eta` + `alertas` (las hojas de cálculo, sin dependencias externas) | `driverCalculoLlegada` (hace de `MonitorRuta`) |
| 2 | Se agrega `NotificadorAcudientes` real (nivel 2) | `ProveedorGPSStub`, `RepositorioRutasStub`, `ServicioTraficoStub` y, un nivel más abajo, `MensajeriaStub` (el `NotificadorStub` ya no hace falta) | `eta` + `NotificadorAcudientes` | `driverNotificacion` (hace de `MonitorRuta`) + `MensajeriaStub` debajo del notificador |
| 3 | Se reemplazan los stubs externos por los componentes reales a medida que existan (GPS, base de datos de rutas, servicio de tráfico, proveedor de SMS) | Solo los que todavía no existan (hoy: el servicio de tráfico lo construye otro equipo) | `MonitorRuta` **real** sobre todos los módulos ya integrados | **Ninguno**: el driver desaparece porque ahora existe el módulo real. Aún se necesitan stubs para los externos que no estén listos |

## Preguntas

**1.** Con sus palabras y usando un archivo de este repositorio como ejemplo: ¿cuál es la diferencia entre un stub y un driver? ¿En qué dirección de la llamada está cada uno?

Ambos son piezas **falsas** que usamos porque la pieza real no existe o no conviene usarla, pero están en lados opuestos de la llamada.

- **Stub:** está **debajo** del módulo que probamos. Es el que **recibe** la llamada y responde con datos fijos. Ejemplo: `tests/stubs/ProveedorGPSStub.ts`. `MonitorRuta` lo llama (`MonitorRuta → ProveedorGPSStub`) y él responde siempre la posición que configuramos, en lugar de un GPS real. Reemplaza al hardware GPS.
- **Driver:** está **arriba** del módulo que probamos. Es el que **hace** la llamada. Ejemplo: `tests/drivers/driverCalculoLlegada.ts`. Él llama a `geo`, `eta` y `alertas` (`driverCalculoLlegada → [geo, eta, alertas]`), tal como lo haría `MonitorRuta`, que en ese momento no existe. Reemplaza a `MonitorRuta`.

Frase: *«El stub está **debajo** del módulo bajo prueba (lo llaman a él) y el driver está **encima** (él llama al módulo)».* Analogía: en un restaurante, el **driver** es el mesero de prueba que le pide platos al cocinero; el **stub** es el proveedor falso que le entrega al cocinero ingredientes siempre iguales.

El arreglo `llamadas` del stub sirve para verificar **interacciones**: no solo qué retornó `MonitorRuta`, sino **a quién consultó**. Por ejemplo, `monitorear_conPlacaInvalida_debeRetornarPlacaInvalidaSinConsultarGPS` comprueba `expect(gps.llamadas).toHaveLength(0)`: el reporte puede decir `PLACA_INVALIDA` y aun así estar mal hecho si primero hubiera gastado una consulta al GPS.

Un stub «puro» solo entrega respuestas y no anota nada. Un mock, además, **anota cómo lo llamaron** y la prueba lo verifica. Nuestros stubs entregan respuestas y además guardan las llamadas; cuando la prueba revisa `gps.llamadas`, el stub se está usando como **mock**.

**2.** Todos los módulos de `src/` pasaron sus pruebas unitarias en el taller anterior. ¿Por qué aun así pueden aparecer defectos al integrarlos? Den un ejemplo que hayan encontrado.

Porque cada prueba unitaria comprueba que la pieza cumple **su** contrato **por separado**, con entradas que **nosotros** le damos. No comprueba que quien la usa le entregue lo que espera: las unidades, los rangos, el orden de las llamadas. Los defectos de integración viven en las **costuras** entre módulos.

Ejemplo que encontramos (DEF-INT-01): `eta.calcularMinutosEstimados` es correcto *si le llega km/h*. El GPS entrega m/s y `MonitorRuta` le pasó ese número tal cual (`monitorRuta.ts`, línea 84). Los dos lados cumplen su contrato, pero el contrato **entre** ellos se rompe. Segundo ejemplo (DEF-INT-02): `determinarNivelAlerta(-12)` lanza `RangeError`, que es lo que pide RN-08 y su prueba unitaria pasa; el defecto es que `MonitorRuta` no limitó el retraso a 0 antes de llamarla. Evidencia: las 9 pruebas ascendentes (módulos reales entre sí) pasan; los 2 defectos aparecieron solo cuando entró `MonitorRuta`.

**3.** En `monitorRuta.nivel1.test.ts` el notificador es un stub y en `monitorRuta.nivel2.test.ts` es el real. ¿Qué defecto podría pasar desapercibido en el nivel 1 pero detectarse en el nivel 2?

El `NotificadorStub` retorna un número fijo y no aplica ninguna regla (RN-10 a RN-13), así que en el nivel 1 **se ve la llamada pero no su consecuencia**. En el nivel 2, con el notificador real, se ve lo que realmente le llegaría al acudiente: el **texto exacto** del SMS, el **umbral** de 10 minutos y a **cuántos** se envía.

Ejemplo real de nuestro proyecto: la prueba extra de nivel 2 `monitorear_conBusLejosA8MetrosPorSegundo_debeNotificarPorqueEstaA7Minutos`. Con DEF-INT-01 el sistema calcula 25 minutos en lugar de 7; el notificador real, correctamente, **no envía nada** porque 25 > 10. En el nivel 1 el stub habría devuelto su número fijo y sería fácil creer que «se notificó». Solo el nivel 2 muestra que el acudiente **se queda sin aviso**. También la prueba `monitorear_debeEnviarSMSConLosMinutosCalculadosPorEtaYNoOtros` solo puede verificar el mensaje «…en aproximadamente 3 minutos» con el notificador real (obtenemos «8»). Otro caso típico: un cambio que dejara pasar `null` al notificador; el stub lo aceptaría, el real tendría que tratarlo como «no notificar» (RN-10).

**4.** Un stub siempre responde lo que ustedes le configuran. ¿Qué riesgo hay si el stub no se comporta como el componente real (por ejemplo, si `ProveedorGPSStub` devolviera km/h en lugar de m/s)? ¿Cómo lo mitigarían?

**Riesgo:** las pruebas pasan en verde con un mundo que no existe. Si el stub devolviera km/h, `MonitorRuta` (que ignora la conversión) daría resultados «correctos» en las pruebas y el defecto DEF-INT-01 **nunca se vería**, pero fallaría con el GPS real. Es lo mismo que ya pasó con `driverCalculoLlegada`: recibe km/h y por eso no detectó nada. Es una falsa sensación de seguridad.

**Mitigación:**
1. **Fuente única de verdad del contrato:** `servicios.ts` ya documenta que `velocidadMs` está en m/s y el stub usa la misma interfaz `PosicionGPS`. Se puede reforzar con nombres/tipos que no se puedan confundir (por ejemplo, un tipo `MetrosPorSegundo` distinto de `KilometrosPorHora`).
2. **Pruebas de contrato:** una misma prueba que se ejecute contra el stub **y** contra el componente real (o su ambiente de pruebas) para verificar que se comportan igual.
3. **Datos tomados de respuestas reales** grabadas del proveedor (no inventadas).
4. Reemplazar stubs por reales en cuanto existan y repetir las pruebas.

**5.** Comparen `npm run driver` (driver de consola) con `tests/bottom-up/calculoLlegada.test.ts`. ¿Qué ventajas tiene el segundo? ¿Hay algún caso en que el driver de consola sea útil?

El de consola solo **imprime** una tabla y una persona debe mirarla y decidir si está bien; si hay un error (como un ETA de 40 en lugar de lo esperado), puede pasar inadvertido. Las pruebas con Jest tienen: **verificación automática** (`expect`), valores esperados calculados aparte, resultado pasa/falla sin interpretación humana, repetibilidad y ejecución en cada cambio (regresión), casos de borde explícitos con nombre y reporte de cobertura.

El driver de consola sigue siendo útil para **explorar**: ver rápidamente cómo se comportan los módulos con varios escenarios, entender los números antes de escribir los `expect` o hacer una demostración. Por ejemplo, la tabla nos sirvió para ver que «Lejos, trancón» da 40 min / retraso 30 / GRAVE, y luego lo confirmamos a mano. Útil para explorar; insuficiente como prueba.

**6.** ¿Qué estrategia (top-down o bottom-up) les permitió encontrar primero cada defecto? ¿Por qué?

Ambos defectos los encontró **top-down, nivel 1**. **Bottom-up no encontró ninguno**, aunque en el orden del taller se hizo primero.

- **DEF-INT-01** (m/s → km/h): lo mostró `monitorear_conVelocidadEnMetrosPorSegundo_debeConvertirlaAKmhAntesDeCalcularETA` (esperado 3, obtenido 8). Bottom-up no podía: `driverCalculoLlegada` recibe `velocidadKmh` directamente; el error está en una línea de `MonitorRuta` que el driver reemplaza y por eso nunca ejecuta.
- **DEF-INT-02** (retraso negativo): lo mostró `monitorear_conBusQueLlegaAntesDeLaHoraProgramada_...` (`RangeError`). El driver ya limita con `Math.max(0, …)`, así que su lógica «arregla» el caso sin que `MonitorRuta` lo haga.

Razón: los defectos estaban en el código de **`MonitorRuta`** (la «pegatina» entre módulos). La estrategia ascendente sustituye ese código por un driver; la descendente lo ejecuta de verdad. Lección: **un driver solo prueba lo que el driver hace**. Bottom-up fue útil para confirmar que las piezas de abajo están sanas (9/9) y por eso, cuando top-down falló, supimos que el problema estaba arriba.

**7.** El servicio de tráfico «lo está construyendo otro equipo». ¿Cómo les permitió el stub avanzar sin esperarlo? ¿Qué pruebas tendrán que repetir cuando el servicio real esté listo?

`ServicioTraficoStub` cumple la interfaz `ServicioTrafico` (`servicios.ts`): da un factor fijo o simula una caída. Así probamos todo `MonitorRuta` y, en particular, RN-17 (`...conServicioDeTraficoCaido_debeUsarFactorPorDefecto15`) sin esperar al otro equipo ni depender de la red.

Cuando el servicio real esté listo hay que **repetir** (con el real en lugar del stub): las pruebas de nivel 1 y 2 que lo usan (las de ETA, retraso y SMS dependen del factor), un conjunto pequeño de pruebas de **contrato** (¿devuelve siempre entre 1.0 y 3.0? ¿qué pasa con la latencia, el timeout, un valor inválido?) y la prueba de «tráfico caído» con una caída real. También validar las observaciones del reporte (valor fuera de rango).

**8.** ¿Por qué todas las pruebas usan `HORA_ACTUAL` fija en vez de `new Date()`? ¿Qué pasaría con la prueba de retraso a las 6:30 a. m. y a las 2:00 p. m.?

Por el principio **Repeatable** de FIRST: una prueba debe dar el mismo resultado siempre. Con `new Date()` el resultado dependería del reloj de quien la ejecute.

Ejemplo con el escenario del Paso 2 (bus a 3 min, programado a las 06:40): a las **6:30 a. m.** llega 06:33 → retraso 0 → `NINGUNA`. A las **2:00 p. m.** llegaría 14:03 y la diferencia contra 06:40 son 443 minutos → `GRAVE`. La misma prueba pasaría por la mañana y fallaría por la tarde, sin que el código haya cambiado. Con `HORA_ACTUAL` fija (2026-10-13 06:30) el resultado es idéntico en cualquier máquina y horario.

**9.** Si el proyecto hubiera usado integración **big bang**, ¿cómo habría sido el diagnóstico de los defectos que encontraron?

En big bang se juntan **todos** los componentes reales a la vez (GPS, base de datos, tráfico, `MonitorRuta`, `eta`, `alertas`, notificador y SMS) y se prueba el sistema completo. El síntoma sería «el SMS dice 8 minutos y deberían ser 3», y el culpable podría ser el GPS, la base, el tráfico, `geo`, `eta`, la hora o `MonitorRuta`: **~10 sospechosos**. Para el segundo defecto sería peor: un `RangeError` en el medio, sin saber cuál módulo. Habría que depurar a mano, con datos reales que cambian de un minuto a otro (no repetibles).

Con nuestro enfoque, el diagnóstico fue casi inmediato: el bottom-up nos dijo que las piezas de abajo están sanas, y en el top-down, con stubs que siempre devuelven lo mismo, la **única variable** era `MonitorRuta`. Y la prueba nos mostró la causa: 10 m/s tratados como 10 km/h dan 8 minutos (1.322 / 10 × 60 = 7.9). Cada defecto se localizó con una sola prueba.

**10.** Para cada defecto encontrado, describan la cadena **error → defecto → falla**. ¿Es un defecto de una unidad o de la **interfaz** entre unidades? Justifiquen.

| | DEF-INT-01 (unidades) | DEF-INT-02 (retraso negativo) |
|---|---|---|
| **Error** (equivocación humana) | Quien programó `MonitorRuta` pasó por alto (o no leyó) que `PosicionGPS.velocidadMs` está en m/s y asumió que ya era km/h. | Quien programó `MonitorRuta` no consideró que un bus puede ir **adelantado** y que la diferencia de horas puede ser negativa. |
| **Defecto** (en el código) | `monitorRuta.ts:84`: `const velocidadKmh = posicion.velocidadMs;` (falta `× 3.6`). | `monitorRuta.ts:104-107`: el retraso no se limita a 0 (falta `Math.max(0, …)`) antes de `determinarNivelAlerta`. |
| **Falla** (lo que se ve) | El acudiente recibe «llegará en aproximadamente 8 minutos» (real: 3) o **no recibe aviso** cuando el bus está a 7 minutos; alertas de retraso exageradas. | El monitoreo del bus **falla con un error** cuando va adelantado; no hay reporte ni SMS. |
| **¿Unidad o interfaz?** | **Interfaz** `ProveedorGPS`/`MonitorRuta` → `eta`. Ninguna unidad es incorrecta por separado: el GPS entrega m/s (como dice su contrato) y `eta` espera km/h (como dice RN-01). Falla lo que une a ambas. | **Interfaz** `MonitorRuta` → `alertas`. `determinarNivelAlerta` hace lo que RN-08 manda (rechazar negativos). `MonitorRuta` incumple la precondición de quien la llama (RN-20). |
