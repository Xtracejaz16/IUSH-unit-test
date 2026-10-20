# Respuestas del taller — RutaSegura (Integración)

Integrantes:
-
-

## Ejercicio 1 — Orden de integración

Dibujen (o describan) el orden en que integrarían los módulos de RutaSegura con cada estrategia, indicando en cada paso qué stubs o drivers se necesitan.

| Paso | Top-down: módulos reales | Stubs necesarios | Bottom-up: módulos reales | Drivers necesarios |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

## Preguntas

**1.** Con sus palabras y usando un archivo de este repositorio como ejemplo: ¿cuál es la diferencia entre un stub y un driver? ¿En qué dirección de la llamada está cada uno?

**2.** Todos los módulos de `src/` pasaron sus pruebas unitarias en el taller anterior. ¿Por qué aun así pueden aparecer defectos al integrarlos? Den un ejemplo que hayan encontrado.

**3.** En `monitorRuta.nivel1.test.ts` el notificador es un stub y en `monitorRuta.nivel2.test.ts` es el real. ¿Qué defecto podría pasar desapercibido en el nivel 1 pero detectarse en el nivel 2?

**4.** Un stub siempre responde lo que ustedes le configuran. ¿Qué riesgo hay si el stub no se comporta como el componente real (por ejemplo, si `ProveedorGPSStub` devolviera km/h en lugar de m/s)? ¿Cómo lo mitigarían?

**5.** Comparen `npm run driver` (driver de consola) con `tests/bottom-up/calculoLlegada.test.ts`. ¿Qué ventajas tiene el segundo? ¿Hay algún caso en que el driver de consola sea útil?

**6.** ¿Qué estrategia (top-down o bottom-up) les permitió encontrar primero cada defecto? ¿Por qué?

**7.** El servicio de tráfico "lo está construyendo otro equipo". ¿Cómo les permitió el stub avanzar sin esperarlo? ¿Qué pruebas tendrán que repetir cuando el servicio real esté listo?

**8.** ¿Por qué todas las pruebas usan `HORA_ACTUAL` fija en vez de `new Date()`? ¿Qué pasaría con la prueba de retraso a las 6:30 a. m. y a las 2:00 p. m.?

**9.** Si el proyecto hubiera usado integración **big bang**, ¿cómo habría sido el diagnóstico de los defectos que encontraron?

**10.** Para cada defecto encontrado, describan la cadena **error → defecto → falla**. ¿Es un defecto de una unidad o de la **interfaz** entre unidades? Justifiquen.
