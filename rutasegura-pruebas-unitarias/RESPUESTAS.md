# Respuestas del taller — RutaSegura

Integrantes:
- Sebastian Estrada Bustamante
- Yair Santiago Cetre Diaz

## Ejercicio 1 — Diseño de casos (RN-01 a RN-04)

La columna **Regla principal** indica la regla que se quiere aislar en cada caso. La columna **Regla que se verifica** hace explícito cuando los mismos datos también activan otra regla; por ejemplo, toda prueba de fórmula necesita un factor válido de RN-04, pero su propósito principal puede ser comprobar RN-01.

| Regla principal | Prueba asociada | Entradas (velocidad, distancia, factor) | Resultado esperado (calculado a mano) | Tipo | Regla que se verifica |
|---|---|---|---|---|---|
| RN-01 | `calcularMinutosEstimados_con50kmh60kmFactor1_4_debeRetornar101` | (50, 60, 1.4) | 101 minutos: `(60 / 50) × 60 × 1.4 = 100.8`, redondeado hacia arriba | Feliz / fórmula | RN-01. El factor 1.4 también está dentro del rango válido de RN-04; aquí se comprueba principalmente la multiplicación por tráfico y el redondeo. |
| RN-01 | `calcularMinutosEstimados_con45kmh10kmFactor1_0_debeRedondearHaciaArribaA14` | (45, 10, 1.0) | 14 minutos: `(10 / 45) × 60 = 13.33...`, redondeado hacia arriba | Feliz / redondeo | RN-01. El factor 1.0 coincide además con el límite inferior válido de RN-04. |
| RN-01 | `calcularMinutosEstimados_conResultadoExacto30_noDebeSubirA31` | (60, 30, 1.0) | 30 minutos: `(30 / 60) × 60 = 30` exactos | Feliz / fórmula exacta | RN-01. Comprueba que `ceil` no aumente un resultado que ya es entero; el factor 1.0 también satisface RN-04. |
| RN-01 | `calcularMinutosEstimados_con60kmh20kmFactor1_2_debeRetornar24` | (60, 20, 1.2) | 24 minutos: `(20 / 60) × 60 × 1.2 = 24` | Feliz / fórmula | RN-01. El factor 1.2 es válido según RN-04, pero el objetivo es verificar la fórmula. |
| RN-01 | `calcularMinutosEstimados_conFactorMayor_debeAumentarElTiempo` | (40, 10, 2.0) | 30 minutos: `(10 / 40) × 60 × 2.0 = 30` | Feliz / tráfico | RN-01. Comprueba que un factor mayor aumente el tiempo; 2.0 también es válido por RN-04. |
| RN-02 | `calcularMinutosEstimados_conVelocidadCeroYDistanciaCero_debeRetornarCero` | (0, 0, 1.0) | 0 minutos | Límite | RN-02. La distancia cero debe devolver 0 aunque la velocidad también sea cero; el factor 1.0 cumple RN-04. |
| RN-02 | `calcularMinutosEstimados_conVelocidadCeroYDistanciaMayorACero_debeRetornarNull` | (0, 10, 1.4) | `null` | Límite / bus detenido | RN-02. La distancia es mayor que cero y la velocidad es cero; el factor 1.4 es válido por RN-04. |
| RN-02 | `calcularMinutosEstimados_conDistanciaCeroYVelocidadPositiva_debeRetornarCero` | (40, 0, 1.0) | 0 minutos | Límite / paradero | RN-02. La distancia cero tiene prioridad y representa que el bus ya llegó; el factor 1.0 cumple RN-04. |
| RN-03 | `calcularMinutosEstimados_conDistanciaNegativa_debeLanzarRangeError` | (5, -10, 1.2) | `RangeError` | Error | RN-03. La distancia negativa es un error de sensor; el factor 1.2 es válido, así que no es la causa del error. |
| RN-03 | `calcularMinutosEstimados_conVelocidadNegativa_debeLanzarRangeError` | (-4, 8, 1.6) | `RangeError` | Error | RN-03. La velocidad negativa es un error de sensor; el factor 1.6 es válido. |
| RN-04 | `calcularMinutosEstimados_conFactorEnLimiteInferior_debeCalcular` | (60, 60, 1.0) | 60 minutos | Límite incluido | RN-04. 1.0 está permitido; la fórmula de RN-01 también produce el resultado numérico. |
| RN-04 | `calcularMinutosEstimados_conFactorEnLimiteSuperior_debeCalcular` | (60, 60, 3.0) | 180 minutos | Límite incluido | RN-04. 3.0 está permitido; la fórmula de RN-01 también debe multiplicar por ese factor. |
| RN-04 | `calcularMinutosEstimados_conFactorJustoBajo1_0_debeLanzarRangeError` | (60, 60, 0.99) | `RangeError` | Error / fuera de rango | RN-04. El valor está justo por debajo del mínimo 1.0. |
| RN-04 | `calcularMinutosEstimados_conFactorJustoSobre3_0_debeLanzarRangeError` | (60, 60, 3.01) | `RangeError` | Error / fuera de rango | RN-04. El valor está justo por encima del máximo 3.0. |

## Preguntas

Respondan cada pregunta con base en SUS pruebas (citen el nombre del `it` cuando aplique). Respuestas genéricas copiadas de internet no suman puntos.

**1.** Para `calcularMinutosEstimados`, ¿qué valores de entrada escogieron para el caso feliz y por qué esos y no otros? ¿Qué demuestra esa prueba y qué NO demuestra?

Tomamos como caso feliz la prueba `calcularMinutosEstimados_con50kmh60kmFactor1_4_debeRetornar101`, con velocidad de 50 km/h, distancia de 60 km y factor 1.4. Según RN-01, `(60 / 50) × 60 × 1.4 = 100.8`, por lo que el resultado esperado es 101 minutos después de redondear hacia arriba. Elegimos un factor mayor que 1.0 para comprobar que el tráfico aumente el tiempo. La prueba demuestra la fórmula y el redondeo con un factor realista, pero no demuestra por sí sola los casos de velocidad cero de RN-02, valores negativos de RN-03 ni factores fuera de rango de RN-04. En la ejecución actual obtiene 52 minutos, por lo que también evidencia el defecto documentado de RN-01.

**2.** Tomen su prueba de caso feliz de RN-01 y cambien únicamente el dato `factorTrafico` a `1.0` (ajustando el valor esperado según la fórmula). ¿Cambia el resultado de la prueba (pasa / falla)? ¿Qué les enseña esto sobre la selección de datos de prueba?

Si cambiamos únicamente el factor de 1.4 a 1.0 en `calcularMinutosEstimados_con50kmh60kmFactor1_4_debeRetornar101`, el esperado cambia de 101 a 72 minutos: `(60 / 50) × 60 × 1.0 = 72`. Con el defecto actual, dividir por 1.0 produce el mismo valor que multiplicar por 1.0, así que esa variante pasaría y no detectaría el error. La conclusión es que una prueba con factor mayor que 1, como `calcularMinutosEstimados_conFactorMayor_debeAumentarElTiempo`, es necesaria para distinguir las dos operaciones.

**3.** En RN-06 y RN-08, ¿por qué probaron exactamente los valores límite (90, -90, 5, 15, etc.) y no solo valores "del medio" como 45 o 10? Expliquen con el resultado que obtuvieron.

Los límites son parte explícita de las reglas: RN-06 incluye -90 y 90, y RN-08 incluye 5 minutos en `NINGUNA` y 15 en `LEVE`. Por eso usamos `validarCoordenadas_conLatitud90_debeRetornarTrue` y `validarCoordenadas_conLatitudMenos90_debeRetornarTrue`; ambas esperaban `true` y obtuvieron `false`. También usamos `determinarNivelAlerta_conRetraso15_debeRetornarLEVE`; esperaba `'LEVE'` y obtuvo `'GRAVE'`. Los valores del medio, como los de `validarCoordenadas_conValoresDelMedio_debeRetornarTrue` o `determinarNivelAlerta_conRetraso6_debeRetornarLEVE`, no habrían mostrado estos errores de límites.

**4.** Una prueba que pasa, ¿demuestra que la función es correcta? Argumenten usando un ejemplo real de su suite.

No. Una prueba que pasa demuestra únicamente que la función produjo el resultado esperado para esa combinación de entradas. Por ejemplo, `calcularMinutosEstimados_con45kmh10kmFactor1_0_debeRedondearHaciaArribaA14` pasa porque el factor es 1.0 y dividir por 1.0 equivale a multiplicar por 1.0. Sin embargo, `calcularMinutosEstimados_conFactorMayor_debeAumentarElTiempo` espera 30 minutos y obtiene 8, porque usa factor 2.0 y sí expone el defecto. Por eso una prueba exitosa no basta para concluir que toda la lógica es correcta.

**5.** En `NotificadorAcudientes`, ¿por qué usaron un mock en lugar del proveedor real de SMS? ¿Qué verifica `toHaveBeenCalledWith` que no verifica el valor de retorno de la función?

Usamos un mock porque las pruebas deben aislar `NotificadorAcudientes`: no deben enviar SMS reales ni depender de una red o de un proveedor externo. En `notificarProximidad_conAcudienteConNotificacionesDesactivadas_noDebeEnviarleSMS`, la entrada tiene dos acudientes, uno con las notificaciones desactivadas y otro activado; RN-11 espera una sola llamada y un solo envío exitoso. `toHaveBeenCalledWith` comprueba los argumentos exactos de una llamada, por ejemplo el teléfono y el texto verificados en `notificarProximidad_debeEnviarMensajeConPlacaYMinutos`. El valor retornado solo informa cuántos envíos fueron exitosos; por sí solo no dice a qué teléfono se llamó ni qué mensaje se envió.

**6.** ¿Qué porcentaje de cobertura obtuvieron? ¿Es posible tener 100 % de cobertura y aun así tener un defecto sin detectar? Muestren un ejemplo concreto con el código de RutaSegura.

Obtuvimos **100 % de cobertura de líneas**. Eso significa que las líneas se ejecutaron al menos una vez; no significa que las operaciones, condiciones y resultados sean correctos. La suite completa tiene **67 pruebas: 58 pasan y 9 fallan** por los defectos documentados. En `src/eta.ts`, la línea que calcula `minutosConTrafico` se ejecuta, pero divide por `factorTrafico` en vez de multiplicar. La prueba `calcularMinutosEstimados_conFactorMayor_debeAumentarElTiempo` demuestra que puede haber cobertura total de ejecución y, aun así, lógica incorrecta: espera 30 y obtiene 8.

**7.** Para cada defecto encontrado, describan la cadena **error → defecto → falla** (Unidad 3): ¿qué equivocación humana lo originó, dónde está en el código y qué le pasaría al acudiente o al colegio si llega a producción?

En cada caso se conserva la cadena **error humano → defecto en el código → consecuencia visible**:

- **RN-01 y cálculo dependiente de RN-05:** Error humano: se escribió `/` en vez de `*` en `src/eta.ts`, línea 38. Defecto en el código: el factor de tráfico reduce el tiempo en lugar de aumentarlo. Consecuencia visible: las cinco pruebas `calcularMinutosEstimados_con50kmh60kmFactor1_4_debeRetornar101`, `calcularMinutosEstimados_con60kmh20kmFactor1_2_debeRetornar24`, `calcularMinutosEstimados_conFactorMayor_debeAumentarElTiempo`, `calcularMinutosEstimados_conFactorEnLimiteSuperior_debeCalcular` y `calcularHoraEstimadaLlegada_conDatosNormales_debeSumarMinutosAHoraActual` fallan; en producción el acudiente podría ver una llegada demasiado rápida y organizarse mal.
- **RN-06:** Error humano: se usaron `<` y `>` en vez de `<=` y `>=` para la latitud en `src/validaciones.ts`, línea 14. Defecto en el código: se rechazan las latitudes límite 90 y -90. Consecuencia visible: un bus con una coordenada válida puede aparecer como inválido o dejar de mostrarse correctamente en el mapa.
- **RN-08:** Error humano: se usó `>= 15` en vez de `> 15` en `src/alertas.ts`, línea 18. Defecto en el código: 15 minutos se clasifica como `'GRAVE'`. Consecuencia visible: la coordinación recibe una alerta más severa de la que corresponde y puede reaccionar de forma innecesaria.
- **RN-11:** Error humano: se olvidó comprobar `notificacionesActivas` antes de llamar al servicio en `src/notificador.ts`, líneas 38-47. Defecto en el código: se envían SMS a todos los acudientes. Consecuencia visible: un acudiente que desactivó las notificaciones sigue recibiendo mensajes.

**8.** ¿Su suite cumple el principio **FIRST**? Den un ejemplo de una prueba suya que cumpla cada letra, y digan si alguna prueba lo viola (por ejemplo, depender de `new Date()` sin fijar la hora).

- **Fast:** `calcularMinutosEstimados_conResultadoExacto30_noDebeSubirA31` prueba una función pura y no depende de red, archivos ni servicios externos; por eso se ejecuta rápidamente.
- **Independent:** En `notificador.test.ts`, `beforeEach` crea un mock y un `NotificadorAcudientes` nuevos antes de cada prueba. Por ejemplo, `notificarProximidad_conMinutosNull_noDebeEnviarSMS` no reutiliza las llamadas de otra prueba.
- **Repeatable:** `calcularHoraEstimadaLlegada_conDatosNormales_debeSumarMinutosAHoraActual` usa `new Date('2026-01-15T06:30:00')` mediante `crearHora()`, en lugar de leer la hora real del sistema.
- **Self-validating:** `calcularMinutosEstimados_conFactorMayor_debeAumentarElTiempo` tiene un `expect` explícito de 30 minutos, y `notificarProximidad_debeEnviarMensajeConPlacaYMinutos` verifica los argumentos exactos con `toHaveBeenCalledWith`.
- **Timely:** Las pruebas se escribieron a partir de las reglas del README y antes de aceptar el comportamiento actual del código. Por eso `validarCoordenadas_conLatitud90_debeRetornarTrue` y `determinarNivelAlerta_conRetraso15_debeRetornarLEVE` detectan temprano errores de límites.

No se observa una violación evidente de FIRST: no se usa el reloj real sin fijarlo y el proveedor de SMS está simulado. Que algunas pruebas fallen refleja defectos del código bajo prueba, no una dependencia inestable de las pruebas.

**9.** Supongan que el equipo de desarrollo corrige todos los defectos mañana. ¿Qué valor tiene conservar sus pruebas en el repositorio? ¿Qué pasaría si dentro de seis meses alguien vuelve a introducir el error de RN-01?

Las pruebas quedan como una red de seguridad y como una descripción ejecutable del README. Si dentro de seis meses alguien vuelve a poner `/` en vez de `*` en `src/eta.ts`, `calcularMinutosEstimados_conFactorMayor_debeAumentarElTiempo` volverá a esperar 30 y detectará el resultado incorrecto de inmediato. También ayudarían `calcularMinutosEstimados_con50kmh60kmFactor1_4_debeRetornar101` y `calcularMinutosEstimados_con60kmh20kmFactor1_2_debeRetornar24`, porque prueban otros valores de factor mayor que 1.

**10.** Si por tiempo solo pudieran entregar **3 pruebas** de todo el repositorio, ¿cuáles escogerían y por qué? Justifiquen según el riesgo para los estudiantes y acudientes.

1. `calcularMinutosEstimados_conFactorMayor_debeAumentarElTiempo` — porque afecta directamente la hora de llegada que ven los acudientes.
2. `determinarNivelAlerta_conRetraso15_debeRetornarLEVE` — porque cambia la alerta que recibe la coordinación y puede causar una respuesta incorrecta.
3. `notificarProximidad_conAcudienteConNotificacionesDesactivadas_noDebeEnviarleSMS` — porque viola la preferencia del acudiente y puede generar quejas.

Estas tres cubren riesgos distintos y de alto impacto: información de llegada incorrecta para los acudientes, una decisión operativa equivocada del colegio y el envío de mensajes contra la preferencia de un acudiente.
