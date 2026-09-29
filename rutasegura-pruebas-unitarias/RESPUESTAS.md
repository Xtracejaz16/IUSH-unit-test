# Respuestas del taller — RutaSegura

Integrantes:
- Sebastian Estrada Bustamante
- Yair Santiago Cetre Diaz

## Ejercicio 1 — Diseño de casos (RN-01 a RN-04)

| Regla | Entradas (velocidad, distancia, factor) | Resultado esperado (calculado a mano) | Tipo (feliz / límite / error) |
|---|---|---|---|
| RN-01 | (40, 10, 1.5) | 23 minutos | feliz |
| RN-01 | (60, 60, 1.0) | 60 minutos | límite (factor mínimo) |
| RN-01 | (45, 10, 1.0) | 14 minutos | límite (redondeo hacia arriba) |
| RN-01 | (60, 60, 0.99) | RangeError | error (factor inválido, pasa a RN-04) |
| RN-02 | (0, 0, 1.0) | 0 | feliz |
| RN-02 | (0, 1, 1.0) | null | límite (bus detenido cerca) |
| RN-02 | (0, 0.001, 1.0) | null | límite (distancia muy pequeña pero > 0) |
| RN-02 | (-1, 0, 1.0) | RangeError | error (velocidad negativa, pasa a RN-03) |
| RN-03 | (-1, 10, 1.0) | RangeError | error (velocidad negativa) |
| RN-03 | (10, -1, 1.0) | RangeError | error (distancia negativa) |
| RN-03 | (-1, -1, 1.0) | RangeError | error (ambos negativos) |
| RN-03 | (10, 10, 1.0) | 60 minutos | feliz (no lanza error) |
| RN-04 | (60, 60, 1.0) | 60 minutos | feliz (límite inferior) |
| RN-04 | (60, 60, 3.0) | 180 minutos | feliz (límite superior) |
| RN-04 | (60, 60, 0.99) | RangeError | error (justo bajo el mínimo) |
| RN-04 | (60, 60, 3.01) | RangeError | error (justo sobre el máximo) |

## Preguntas

Respondan cada pregunta con base en SUS pruebas (citen el nombre del `it` cuando aplique). Respuestas genéricas copiadas de internet no suman puntos.

**1.** Para `calcularMinutosEstimados`, ¿qué valores de entrada escogieron para el caso feliz y por qué esos y no otros? ¿Qué demuestra esa prueba y qué NO demuestra?

Escogimos 40 km/h, 10 km y factor 1.5, que según el README da 23 minutos. Elegimos esos valores porque usan factor de tráfico mayor a 1.0, así la prueba demuestra que el tráfico aumenta el tiempo. No demuestra que funcione con factor 1.0 ni con los casos de error (velocidad negativa, factor fuera de rango, etc...)

**2.** Tomen su prueba de caso feliz de RN-01 y cambien únicamente el dato `factorTrafico` a `1.0` (ajustando el valor esperado según la fórmula). ¿Cambia el resultado de la prueba (pasa / falla)? ¿Qué les enseña esto sobre la selección de datos de prueba?

Sí cambia el resultado: con factor 1.0 la respuesta sería 15 minutos, no 23. La prueba pasa si se actualiza el esperado, pero ya no detectaría que el código divide en vez de multiplicar. Esto enseña que hay que elegir datos que prueben realmente la regla: con factor 1.0 no se nota el error, pero con factor 2.0 sí.

**3.** En RN-06 y RN-08, ¿por qué probaron exactamente los valores límite (90, -90, 5, 15, etc.) y no solo valores "del medio" como 45 o 10? Expliquen con el resultado que obtuvieron.

Porque los errores suelen estar justo en los límites. Si solo probáramos 45 y 10, las pruebas pasarían todas y no detectaríamos que el código rechaza latitud 90 (RN-06) ni que marca 15 minutos como GRAVE (RN-08). Los valores del medio no alcanzan para encontrar esos defectos.

**4.** Una prueba que pasa, ¿demuestra que la función es correcta? Argumenten usando un ejemplo real de su suite.

No. Una prueba que pasa solo demuestra que funciona para esos datos específicos. Por ejemplo, nuestra prueba `calcularMinutosEstimados_con45kmh10kmFactor1_0_debeRedondearHaciaArribaA14` pasa aunque el código esté dividiendo por el factor de tráfico, porque dividir por 1.0 da lo mismo que multiplicar por 1.0. Esa prueba sola no detecta el defecto de RN-01.

**5.** En `NotificadorAcudientes`, ¿por qué usaron un mock en lugar del proveedor real de SMS? ¿Qué verifica `toHaveBeenCalledWith` que no verifica el valor de retorno de la función?

Usamos un mock para no enviar mensajes de texto reales y para no depender de que el servicio de SMS esté funcionando. `toHaveBeenCalledWith` verifica que se llamó con el teléfono y el mensaje correctos. El valor de retorno solo dice cuántos mensajes se enviaron, pero no dice a quién ni con qué texto.

**6.** ¿Qué porcentaje de cobertura obtuvieron? ¿Es posible tener 100 % de cobertura y aun así tener un defecto sin detectar? Muestren un ejemplo concreto con el código de RutaSegura.

Obtuvimos 100 % de cobertura. Sí es posible tener 100 % y defectos sin detectar. En `src/eta.ts` la línea que calcula `minutosConTrafico` se ejecuta, pero en vez de multiplicar divide. Como todas las líneas se ejecutan, la cobertura es 100 %, pero la lógica está mal. Eso lo demuestra la prueba `calcularMinutosEstimados_conFactorMayor_debeAumentarElTiempo`.

**7.** Para cada defecto encontrado, describan la cadena **error → defecto → falla** (Unidad 3): ¿qué equivocación humana lo originó, dónde está en el código y qué le pasaría al acudiente o al colegio si llega a producción?

- **RN-01 (eta.ts):** Error humano = el programador puso `/` en vez de `*`. Defecto = la función divide por el factor de tráfico. Falla = el acudiente ve que el bus llega más rápido cuando hay más tráfico.
- **RN-06 (validaciones.ts):** Error humano = usó `<` y `>` en vez de `<=` y `>=`. Defecto = rechaza latitudes 90 y -90. Falla = un bus en el polo no aparece en el mapa.
- **RN-08 (alertas.ts):** Error humano = usó `>= 15` en vez de `> 15`. Defecto = 15 minutos se clasifica como GRAVE. Falla = la coordinación recibe una alerta roja que debería ser amarilla.
- **RN-11 (notificador.ts):** Error humano = olvidó preguntar por `notificacionesActivas`. Defecto = envía SMS a todos los acudientes. Falla = padres que desactivaron notificaciones siguen recibiendo mensajes.

**8.** ¿Su suite cumple el principio **FIRST**? Den un ejemplo de una prueba suya que cumpla cada letra, y digan si alguna prueba lo viola (por ejemplo, depender de `new Date()` sin fijar la hora).

- **Fast:** Las pruebas corren en pocos segundos con `npm test`.
- **Independent:** En `notificador.test.ts` usamos `beforeEach` para crear un mock nuevo en cada prueba.
- **Repeatable:** En `eta.test.ts` usamos `new Date('2026-01-15T06:30:00')` en vez de `new Date()` sin argumentos.
- **Self-validating:** Cada prueba tiene un `expect` claro que dice si pasó o falló.
- **Timely:** Las pruebas se escribieron siguiendo el README antes de confiar en el código.

Ninguna prueba viola FIRST de forma evidente.

**9.** Supongan que el equipo de desarrollo corrige todos los defectos mañana. ¿Qué valor tiene conservar sus pruebas en el repositorio? ¿Qué pasaría si dentro de seis meses alguien vuelve a introducir el error de RN-01?

Sirven como red de seguridad. Si dentro de seis meses alguien vuelve a poner `/` en vez de `*` en `eta.ts`, la prueba `calcularMinutosEstimados_conFactorMayor_debeAumentarElTiempo` fallaría de inmediato y avisaría del error antes de que llegue a producción.

**10.** Si por tiempo solo pudieran entregar **3 pruebas** de todo el repositorio, ¿cuáles escogerían y por qué? Justifiquen según el riesgo para los estudiantes y acudientes.

1. `calcularMinutosEstimados_conFactorMayor_debeAumentarElTiempo` — porque afecta directamente la hora de llegada que ven los acudientes.
2. `determinarNivelAlerta_conRetraso15_debeRetornarLEVE` — porque cambia la alerta que recibe la coordinación y puede causar una respuesta incorrecta.
3. `notificarProximidad_conAcudienteConNotificacionesDesactivadas_noDebeEnviarleSMS` — porque viola la preferencia del acudiente y puede generar quejas.

Estas tres cubren los riesgos más grandes para acudientes y colegio.
