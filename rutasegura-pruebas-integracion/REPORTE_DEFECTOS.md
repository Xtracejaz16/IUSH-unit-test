# Reporte de defectos de integración — RutaSegura v1.1

Integrantes:
- Sebastian Estrada Bustamante
- Yair Santiago Cetre Diaz

## Resumen de la ejecución

La suite tiene **25 pruebas**: **18 pasan y 7 fallan**. Las 7 pruebas fallidas **no son 7 defectos**: tienen **2 causas raíz**, ambas en `src/monitorRuta.ts` (el módulo que integra a los demás).

| Defecto raíz | Regla incumplida | Interfaz que falla | Pruebas que lo detectan |
|---|---|---|---:|
| DEF-INT-01 | RN-18 | `ProveedorGPS` (m/s) → `MonitorRuta` → `eta` (km/h) | 6 |
| DEF-INT-02 | RN-20 | `MonitorRuta` → `alertas` (`determinarNivelAlerta`) | 1 |
| **Total** | **2 causas raíz** | | **7 pruebas fallidas** |

**Cómo se comprobó que son 2 y solo 2 (y que las pruebas están bien):** se hizo una **copia** del proyecto fuera del repositorio (`src/` del repositorio **no se modificó**, como exige la regla del taller) y se corrigió una línea por defecto:

| Copia con… | Resultado |
|---|---|
| Ninguna corrección (repositorio tal cual) | 7 fallan, 18 pasan |
| Solo DEF-INT-01 corregido | 1 falla (la de DEF-INT-02) |
| Solo DEF-INT-02 corregido | 6 fallan (las de DEF-INT-01) |
| Ambos corregidos | **25 pasan, 0 fallan** |

Es decir, los valores esperados de las pruebas salen de la especificación y son coherentes entre sí: lo que falla es el código.

Los módulos de bajo nivel (`geo`, `eta`, `alertas`, `notificador`, `validaciones`) **no tienen defectos**: ninguna de las 9 pruebas ascendentes falló.

---

### DEF-INT-01

| Campo | Detalle |
|---|---|
| Regla incumplida (RN-XX) | **RN-18**: «El GPS entrega la velocidad en m/s: se debe convertir a km/h (× 3.6) antes de calcular el ETA». |
| Módulos involucrados (¿qué interfaz falla?) | `ProveedorGPS.obtenerPosicion` (entrega `velocidadMs`, en m/s) → `MonitorRuta` → `calcularMinutosEstimados` / `calcularHoraEstimadaLlegada` de `eta.ts` (esperan `velocidadKmh`, en km/h). Ambos valores son un `number`, así que TypeScript no detecta la confusión. Falla la **interfaz** entre `MonitorRuta` y `eta`. |
| Estrategia y nivel que lo detectó (top-down N1/N2, bottom-up) | **Top-down N1** (la primera en fallar) y también **top-down N2**. Bottom-up **no** lo detectó (ver más abajo). |
| Prueba que lo detecta (nombre exacto del `it`) | Principal: `monitorear_conVelocidadEnMetrosPorSegundo_debeConvertirlaAKmhAntesDeCalcularETA` (N1). Las otras 5 que fallan por la misma causa: `monitorear_conBusMuyRetrasado_debeReportarAlertaGrave` (N1), `monitorear_debeEntregarAlNotificadorLaPlacaLosMinutosYLosAcudientesDeLaRuta` (N1), `monitorear_debeEnviarSMSConLosMinutosCalculadosPorEtaYNoOtros` (N2), `monitorear_conBusLejosAMasDeDiezMinutos_noDebeEnviarNingunSMS` (N2) y `monitorear_conBusLejosA8MetrosPorSegundo_debeNotificarPorqueEstaA7Minutos` (N2, extra). |
| Stubs / drivers usados y cómo se configuraron | `ProveedorGPSStub({ ...BUS_CERCA, velocidadMs: 10 })`, `ServicioTraficoStub(1.0)`, `RepositorioRutasStub` con `crearRuta()` (programada 06:30) y `NotificadorStub`. En N2 el notificador es el real (`NotificadorAcudientes`) con `MensajeriaStub`. |
| Resultado esperado (según README) | 10 m/s × 3.6 = **36 km/h** → 1.322 / 36 × 60 = 2.2 → **3 minutos**; llegada 06:33; SMS: «…llegará en aproximadamente **3** minutos.» |
| Resultado obtenido | **8 minutos** (trata 10 m/s como 10 km/h: 1.322 / 10 × 60 = 7.9 → 8). Con `BUS_LEJOS` a 5 m/s y tráfico 1.5 se esperaba 17 y se obtuvo **60**. |
| ¿Lo habrían detectado las pruebas unitarias? ¿Por qué? | **No.** `eta.ts` es correcto: si le dan km/h calcula bien. `MonitorRuta` no existía en el taller unitario. Cada pieza cumple *su* contrato; el error está en cómo se conectan (nadie convirtió las unidades). Solo aparece al ejecutar las piezas juntas. |
| Severidad (Alta / Media / Baja) y por qué | **Alta.** Afecta a **todos** los buses en **todas** las lecturas: el ETA queda inflado 3.6 veces. Los acudientes reciben un tiempo equivocado y, peor, **dejan de recibir el aviso** cuando deberían (bus a 7 min, el sistema cree que son 25 y calla). Es el propósito central de RutaSegura. |
| Falla que vería el usuario final (acudiente, conductor o coordinación) | **Acudiente:** SMS «llegará en aproximadamente 8 minutos» cuando faltan 3, o ningún SMS cuando el bus está a 7 minutos (prueba extra). **Coordinación:** alertas de retraso exageradas (todo bus lento aparece como GRAVE). |
| Causa probable en el código (línea / condición) | `src/monitorRuta.ts`, línea 84: `const velocidadKmh = posicion.velocidadMs;`. Debe ser `posicion.velocidadMs * 3.6`. |

**Por qué bottom-up no lo detectó:** `driverCalculoLlegada` recibe `velocidadKmh` ya en km/h. El driver (código nuestro) reemplaza a `MonitorRuta` y por eso **nunca ejecuta la línea defectuosa**. Un driver solo prueba lo que el driver hace; el defecto vive justo en lo que el driver «se salta».

---

### DEF-INT-02

| Campo | Detalle |
|---|---|
| Regla incumplida (RN-XX) | **RN-20**: «Si el bus va adelantado, el retraso es 0 (nunca negativo)». Se relaciona con RN-08 (`determinarNivelAlerta` lanza `RangeError` con retraso negativo, y así **debe** ser). |
| Módulos involucrados (¿qué interfaz falla?) | `MonitorRuta` → `determinarNivelAlerta` (`alertas.ts`). `alertas` exige retraso ≥ 0 y `MonitorRuta` le puede pasar un valor negativo porque no lo limita. Falla la **interfaz** (precondición no respetada por quien llama). |
| Estrategia y nivel que lo detectó (top-down N1/N2, bottom-up) | **Top-down N1**. Bottom-up no lo detectó (el driver ya tiene `Math.max(0, …)` escrito por quien armó el taller). |
| Prueba que lo detecta (nombre exacto del `it`) | `monitorear_conBusQueLlegaAntesDeLaHoraProgramada_debeReportarRetrasoCeroYAlertaNinguna` |
| Stubs / drivers usados y cómo se configuraron | GPS stub por defecto (BUS_CERCA, 10 m/s), tráfico 1.0, `NotificadorStub`, y una ruta con `horaProgramadaLlegada = 06:45` (el bus llegaría ~06:33, adelantado). |
| Resultado esperado (según README) | `estado = 'EN_RUTA'`, `minutosRetraso = 0`, `nivelAlerta = 'NINGUNA'`. |
| Resultado obtenido | La promesa de `monitorear` se **rechaza** con `RangeError: El retraso no puede ser negativo`. No hay reporte. (Con el defecto DEF-INT-01 el retraso era −7; corrigiendo DEF-INT-01 sería −12; en ambos casos truena). |
| ¿Lo habrían detectado las pruebas unitarias? ¿Por qué? | **No.** `determinarNivelAlerta(-1)` lanzando `RangeError` es **lo correcto** según RN-08 y su prueba unitaria pasa. El defecto es que `MonitorRuta` no cumple RN-20 antes de llamarla. |
| Severidad (Alta / Media / Baja) y por qué | **Alta.** Un bus que va adelantado no es un caso raro, es el caso feliz. Cuando ocurre, el monitoreo completo falla y además el flujo se corta **antes** de RN-21: no se notifica a nadie. |
| Falla que vería el usuario final (acudiente, conductor o coordinación) | **Coordinación:** el panel de seguimiento de ese bus se rompe (error en vez de «sin alerta»). **Acudiente:** no recibe el SMS de proximidad justo cuando el bus va bien y está cerca. |
| Causa probable en el código (línea / condición) | `src/monitorRuta.ts`, líneas 104-107: `minutosRetraso` se calcula como diferencia y se pasa directo a `determinarNivelAlerta`. Falta `Math.max(0, …)` alrededor de `Math.ceil(...)`. |

---

## Observaciones (NO son defectos: la especificación no las define)

Se anotan por honestidad, pero **no** se reportan como defecto porque el README no dice qué debe pasar:

1. **Placa con guion** (`ABC-123`): `esPlacaValida` la acepta (RN-07), pero `MonitorRuta` solo hace `trim().toUpperCase()` y consulta el repositorio con `ABC-123`. Si la base guarda `ABC123`, no la encontraría. RN-15 dice «sin espacios y en mayúsculas», no habla del guion.
2. **Servicio de tráfico que responde con un valor inválido** (por ejemplo 5.0, fuera de 1.0-3.0): RN-17 solo cubre cuando el servicio **falla**. Hoy `eta` lanzaría `RangeError` y `monitorear` se rechazaría.
3. **GPS con velocidad negativa:** `eta` lanza `RangeError` (RN-03) y se propaga sin controlar.

Convendría pedirle al equipo de producto que aclare estos tres puntos.
