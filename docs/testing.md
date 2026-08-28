# Estrategia de testing

<!-- Documento vivo. Actualizar cuando cambie el stack o las convenciones de testing.
     Los cambios deben registrarse también en changelog/. -->

---

## Filosofía

Priorizamos tests de integración sobre unitarios: el valor de Snapstack está en flujos
completos (onboarding → importación → ficha en el feed) y en reaccionar bien a eventos
externos (webhooks), no en funciones aisladas. Dos excepciones que sí merecen unitarios
exhaustivos: la generación determinista de fondos (mismo repo → misma semilla → mismo fondo,
siempre) y la lógica de límite de selección. Todo corre contra localhost — la API de GitHub y
Clerk se mockean, nunca se testea contra servicios reales.

---

## Cuándo se escriben los tests

**Después de implementar, en una pasada propia.** No durante la planificación, y no a la vez que
el código.

El compromiso de que un requisito se va a validar se adquiere antes: es la tercera columna de la
tabla de cobertura de `docs/features/`. Pero el test en sí se escribe cuando el código ya existe,
leyéndolo. Es una diferencia de calendario pequeña con una consecuencia grande: un test escrito
antes que el código apunta a selectores, rutas y respuestas *imaginados*. Cuando luego no
coinciden con la realidad, casi nadie reescribe el test — se le van quitando aserciones hasta que
pasa, y acaba siendo un test que no comprueba nada pero que da luz verde. Escrito después, apunta
a lo que hay.

Reglas que se derivan de eso:

- **Antes de escribir una aserción, verifica que el selector existe en el código.** No lo
  supongas por el nombre del componente.
- **Si un elemento no tiene selector estable, añádele uno.** Meter un `data-testid` en el código
  es un cambio mínimo aceptable y preferible a colgar el test de una clase de estilos o de un
  texto que cambiará con el próximo ajuste de copy.
- **Cada "entonces" del criterio de aceptación necesita al menos una aserción.** Si el criterio
  define caso negativo, va su propio test.
- **Un test que falla no se arregla quitándole aserciones.** Si falla, o el código está mal o el
  criterio estaba mal escrito. Ambas cosas se corrigen donde toca; degradar el test para forzar el
  verde convierte la suite en decoración.
- **Los datos que crea un test los borra ese test.** Prefija lo que insertes para poder
  identificarlo y limpia al terminar, aunque el test falle a mitad.

---

## Stack de testing

<!-- Herramientas utilizadas por tipo de test.
     Ejemplo:
     | Tipo | Herramienta |
     |------|-------------|
     | Unitario | Vitest |
     | Integración | Vitest + Testing Library |
     | E2E | Playwright | -->

| Tipo | Herramienta |
|------|-------------|
| Unitario | Vitest |
| Integración | Vitest + Testing Library |
| E2E | Playwright (contra `localhost`) |

---

## Qué testear

<!-- Distingue explícitamente qué merece test y qué no, para no perder tiempo.
     Ejemplo:
     SÍ → lógica de negocio, transformaciones de datos, componentes con estado complejo
     NO → componentes puramente visuales, integraciones con terceros (mockear en su lugar) -->

### Sí testear
- Semilla y paleta del fondo procedural: determinismo (mismo input → mismo output) y anclaje
  al color Linguist del lenguaje dominante
- Lógica de selección: límite de repos, no duplicados, quitar/añadir (M-02, M-03)
- Handlers de webhooks: verificación de firma, `push`/`watch`/`repository`, y en especial que
  borrado o paso a privado retira el contenido (M-08)
- Transformaciones GraphQL de GitHub → modelo propio (`languages` por bytes, topics)
- Paginación del feed y filtro por follows
- Registro de señales: tipo y payload correctos, y que un fallo no rompe la UI (M-09)
- Borrado de cuenta: cascada completa, sin restos visibles (M-11)

### No testear (o mockear)
- API de GitHub, Clerk, Inngest/Trigger.dev, Upstash: siempre mockeados
- El render visual de `@vercel/og` (se testea el input que recibe, no el píxel)
- Componentes puramente visuales sin estado

---

## Convenciones

- Archivos: `nombre.test.ts` junto al archivo que testan; E2E en `e2e/` con el ID del flujo
  en el nombre (`flow-01-onboarding.spec.ts`)
- El nombre del test cita el requisito que valida (`M-08: repo borrado desaparece del feed`),
  que es lo que referencia la tercera columna de la tabla de cobertura de `docs/features/`
- Describe en presente; selectores por `data-testid`, nunca por clases de estilos

---

## Cobertura objetivo

≥ 80 % en `lib/` (lógica de negocio: card-seed, github, signals) medido con
`pnpm test:coverage`. Ignorar configuración, tipos y componentes puramente visuales. La
cobertura que de verdad se vigila es la de la tabla de requisitos de cada ficha de feature
(`scripts/verificar-cobertura.mjs`), no el porcentaje global.

---

## Cómo correr los tests

```bash
# Todos los tests
pnpm test

# Modo watch
pnpm test:watch

# Con cobertura
pnpm test:coverage

# E2E
pnpm test:e2e
```

<!-- Ajusta los comandos al stack elegido una vez relleno architecture.md. -->
