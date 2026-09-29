# Reporte de defectos — RutaSegura

Integrantes:
- Sebastian Estrada Bustamante
- Yair Santiago Cetre Diaz

## Resumen de la ejecución

La suite completa tiene **67 pruebas**: **58 pasan y 9 fallan**. Las 9 pruebas fallidas no representan 9 defectos independientes: están causadas por **4 causas raíz**, correspondientes a RN-01, RN-06, RN-08 y RN-11.

| Defecto raíz | Regla incumplida | Pruebas afectadas |
|---|---|---:|
| DEF-01 | RN-01 | 5 |
| DEF-02 | RN-06 | 2 |
| DEF-03 | RN-08 | 1 |
| DEF-04 | RN-11 | 1 |
| **Total** | **4 causas raíz** | **9 pruebas fallidas** |

---

### DEF-01

| Campo | Detalle |
|---|---|
| Regla incumplida (RN-XX) | RN-01. La misma causa también afecta la prueba de límite superior de RN-04 y el cálculo de hora de RN-05. |
| Función | `calcularMinutosEstimados` y, de forma indirecta, `calcularHoraEstimadaLlegada` |
| Cantidad de pruebas afectadas | 5 |
| Severidad (Alta / Media / Baja) y por qué | Alta, porque el acudiente ve un tiempo de llegada mucho menor cuando hay más tráfico. |
| Causa probable en el código (línea / condición) | `src/eta.ts`, línea 38: divide por `factorTrafico` en vez de multiplicar. Debería ser `minutosSinTrafico * factorTrafico`. |

Las cinco pruebas fallidas de este defecto son:

| Prueba (nombre exacto del `it`) | Datos de entrada | Resultado esperado según README | Resultado obtenido |
|---|---|---|---|
| `calcularMinutosEstimados_con50kmh60kmFactor1_4_debeRetornar101` | `velocidadKmh = 50`, `distanciaRestanteKm = 60`, `factorTrafico = 1.4` | **101 minutos**: `(60 / 50) × 60 × 1.4 = 100.8`, redondeado hacia arriba | **52 minutos** |
| `calcularMinutosEstimados_con60kmh20kmFactor1_2_debeRetornar24` | `velocidadKmh = 60`, `distanciaRestanteKm = 20`, `factorTrafico = 1.2` | **24 minutos**: `(20 / 60) × 60 × 1.2 = 24` | **17 minutos** |
| `calcularMinutosEstimados_conFactorMayor_debeAumentarElTiempo` | `velocidadKmh = 40`, `distanciaRestanteKm = 10`, `factorTrafico = 2.0` | **30 minutos**: `(10 / 40) × 60 × 2.0 = 30` | **8 minutos** |
| `calcularMinutosEstimados_conFactorEnLimiteSuperior_debeCalcular` | `velocidadKmh = 60`, `distanciaRestanteKm = 60`, `factorTrafico = 3.0` | **180 minutos**: `(60 / 60) × 60 × 3.0 = 180` | **20 minutos** |
| `calcularHoraEstimadaLlegada_conDatosNormales_debeSumarMinutosAHoraActual` | `velocidadKmh = 40`, `distanciaRestanteKm = 10`, `factorTrafico = 1.5`, `horaActual = 06:30` | **06:53**: RN-01 produce 23 minutos y se suman a la hora actual | **06:40** |

La falla visible es que el sistema estima menos tiempo cuando aumenta el tráfico. Por ejemplo, el acudiente puede salir tarde porque la aplicación muestra 8 minutos en lugar de 30. En RN-05, la hora de llegada también queda adelantada porque reutiliza el cálculo incorrecto.

---

### DEF-02

| Campo | Detalle |
|---|---|
| Regla incumplida (RN-XX) | RN-06 |
| Función | `validarCoordenadas` |
| Cantidad de pruebas afectadas | 2 |
| Severidad (Alta / Media / Baja) y por qué | Media, porque afecta coordenadas justo en los polos, que son poco comunes pero válidas. |
| Causa probable en el código (línea / condición) | `src/validaciones.ts`, línea 14: usa `latitud > -90 && latitud < 90` en vez de `latitud >= -90 && latitud <= 90`. |

Las dos pruebas fallidas son:

| Prueba (nombre exacto del `it`) | Datos de entrada | Resultado esperado según README | Resultado obtenido |
|---|---|---|---|
| `validarCoordenadas_conLatitud90_debeRetornarTrue` | `latitud = 90`, `longitud = 0` | `true`, porque 90 es un límite incluido | `false` |
| `validarCoordenadas_conLatitudMenos90_debeRetornarTrue` | `latitud = -90`, `longitud = 0` | `true`, porque -90 es un límite incluido | `false` |

La falla visible es que un bus que reporte una latitud límite válida puede ser tratado como inválido y dejar de mostrarse correctamente en el mapa.

---

### DEF-03

| Campo | Detalle |
|---|---|
| Regla incumplida (RN-XX) | RN-08 |
| Función | `determinarNivelAlerta` |
| Cantidad de pruebas afectadas | 1 |
| Severidad (Alta / Media / Baja) y por qué | Media, porque genera una alerta de mayor severidad de la que corresponde. |
| Causa probable en el código (línea / condición) | `src/alertas.ts`, línea 18: usa `minutosRetraso >= 15` en vez de `minutosRetraso > 15`. |

| Prueba (nombre exacto del `it`) | Datos de entrada | Resultado esperado según README | Resultado obtenido |
|---|---|---|---|
| `determinarNivelAlerta_conRetraso15_debeRetornarLEVE` | `minutosRetraso = 15` | `'LEVE'`, porque el rango de RN-08 incluye 15 | `'GRAVE'` |

La falla visible es que la coordinación recibe una alerta de mayor severidad para un retraso que todavía debe clasificarse como leve.

---

### DEF-04

| Campo | Detalle |
|---|---|
| Regla incumplida (RN-XX) | RN-11 |
| Función | `NotificadorAcudientes.notificarProximidad` |
| Cantidad de pruebas afectadas | 1 |
| Severidad (Alta / Media / Baja) y por qué | Alta, porque viola la preferencia del usuario y puede generar quejas. |
| Causa probable en el código (líneas / condición) | `src/notificador.ts`, líneas 38-47: el `for` recorre todos los acudientes sin verificar `notificacionesActivas` antes de llamar `enviarSMS`. |

| Prueba (nombre exacto del `it`) | Datos de entrada | Resultado esperado según README | Resultado obtenido |
|---|---|---|---|
| `notificarProximidad_conAcudienteConNotificacionesDesactivadas_noDebeEnviarleSMS` | `minutosEstimados = 5`; un acudiente con `notificacionesActivas = false` y otro con `true` | **1 envío**, únicamente al acudiente que tiene activadas las notificaciones | **2 envíos**, incluido el acudiente que las desactivó |

La falla visible es que un acudiente que desactivó los avisos continúa recibiendo mensajes de texto.

---

## Conclusión

El reporte conserva cuatro defectos raíz y deja trazabilidad de las nueve pruebas fallidas: cinco por el cálculo de ETA y una causa para cada uno de los otros tres casos. Las pruebas se mantienen fallando porque, según el README, el código fuente no debe modificarse; el fallo es el hallazgo que debe corregirse en el producto.
