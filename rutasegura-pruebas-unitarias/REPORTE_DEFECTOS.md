# Reporte de defectos — RutaSegura

Integrantes:
- Sebastian Estrada Bustamante
- Yair Santiago Cetre Diaz

Reporten aquí cada prueba que falla porque el código no cumple la especificación. Copien el bloque por cada defecto.

---

### DEF-01

| Campo | Detalle |
|---|---|
| Regla incumplida (RN-XX) | RN-01 |
| Función | `calcularMinutosEstimados` |
| Prueba que lo detecta (nombre exacto del `it`) | `calcularMinutosEstimados_conFactorMayor_debeAumentarElTiempo` |
| Datos de entrada | velocidadKmh = 40, distanciaRestanteKm = 10, factorTrafico = 2.0 |
| Resultado esperado (según README) | 30 minutos ((10/40)*60*2.0 = 30) |
| Resultado obtenido | 8 minutos |
| Severidad (Alta / Media / Baja) y por qué | Alta, porque el acudiente ve un tiempo de llegada mucho menor cuando hay más tráfico. |
| Falla que vería el usuario final (acudiente, conductor o coordinación) | El acudiente sale de la casa tarde porque la app dice que el bus llega en 8 minutos, pero en realidad tarda 30. |
| Causa probable en el código (línea / condición) | `src/eta.ts` línea 38: divide por `factorTrafico` en vez de multiplicar. Debería ser `minutosSinTrafico * factorTrafico`. |

---

### DEF-02

| Campo | Detalle |
|---|---|
| Regla incumplida (RN-XX) | RN-06 |
| Función | `validarCoordenadas` |
| Prueba que lo detecta (nombre exacto del `it`) | `validarCoordenadas_conLatitud90_debeRetornarTrue` y `validarCoordenadas_conLatitudMenos90_debeRetornarTrue` |
| Datos de entrada | (90, 0) y (-90, 0) |
| Resultado esperado (según README) | `true` (límites incluidos) |
| Resultado obtenido | `false` |
| Severidad (Alta / Media / Baja) y por qué | Media, porque afecta coordenadas justo en los polos, que son poco comunes pero válidas. |
| Falla que vería el usuario final (acudiente, conductor o coordinación) | Un bus que reporta latitud 90 o -90 aparece como si tuviera coordenadas inválidas y no se muestra en el mapa. |
| Causa probable en el código (línea / condición) | `src/validaciones.ts` línea 14: usa `latitud > -90 && latitud < 90` en vez de `latitud >= -90 && latitud <= 90`. |

---

### DEF-03

| Campo | Detalle |
|---|---|
| Regla incumplida (RN-XX) | RN-08 |
| Función | `determinarNivelAlerta` |
| Prueba que lo detecta (nombre exacto del `it`) | `determinarNivelAlerta_conRetraso15_debeRetornarLEVE` |
| Datos de entrada | minutosRetraso = 15 |
| Resultado esperado (según README) | `'LEVE'` (hasta 15 minutos incluido) |
| Resultado obtenido | `'GRAVE'` |
| Severidad (Alta / Media / Baja) y por qué | Media, porque genera una alerta de mayor severidad de la que corresponde. |
| Falla que vería el usuario final (acudiente, conductor o coordinación) | La coordinación del colegio recibe una alerta roja (GRAVE) por un retraso que debería ser amarilla (LEVE). |
| Causa probable en el código (línea / condición) | `src/alertas.ts` línea 18: usa `minutosRetraso >= 15` en vez de `minutosRetraso > 15`. |

---

### DEF-04

| Campo | Detalle |
|---|---|
| Regla incumplida (RN-XX) | RN-11 |
| Función | `NotificadorAcudientes.notificarProximidad` |
| Prueba que lo detecta (nombre exacto del `it`) | `notificarProximidad_conAcudienteConNotificacionesDesactivadas_noDebeEnviarleSMS` |
| Datos de entrada | Un acudiente con `notificacionesActivas = false` y otro con `true` |
| Resultado esperado (según README) | Solo se envía 1 SMS al acudiente que tiene activadas las notificaciones. |
| Resultado obtenido | Se envían 2 SMS, también al acudiente que desactivó las notificaciones. |
| Severidad (Alta / Media / Baja) y por qué | Alta, porque viola la preferencia del usuario y puede generar quejas. |
| Falla que vería el usuario final (acudiente, conductor o coordinación) | Un acudiente que desactivó los avisos sigue recibiendo mensajes de texto. |
| Causa probable en el código (línea / condición) | `src/notificador.ts` líneas 38-47: el `for` recorre todos los acudientes sin verificar `notificacionesActivas` antes de llamar `enviarSMS`. |

---
