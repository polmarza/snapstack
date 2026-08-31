# Releases y PRs como borradores de nota

**Estado:** Acordada
**Requisitos que cierra:** C-12, C-13
**Fecha de acuerdo:** 2026-08-31

## Qué se construye

Escribir una nota cuesta pensar qué contar. Pero un dev que publica una release **ya escribió el
texto**, y ya decidió que aquello merecía anunciarse. Esta feature recoge eso y lo pone donde va.

Al abrir el compositor, si hay candidatos, aparecen como sugerencias bajo la línea de siempre:
"snapstack v0.4.0", "Add notes anchored to a repo". Pulsas una y el compositor se llena con el
repo ya elegido y el cuerpo del borrador **editable**, recortado a 500. Corriges lo que quieras y
publicas — y lo que sale es una nota normal, con una etiqueta pequeña que dice de dónde viene
(`from release v0.4.0`). Descartar retira esa sugerencia para siempre.

Las sugerencias no llevan contador ni aviso. Un "+3 more" abre la lista completa, con dos acciones
por fila: escribir o descartar.

## Decisiones tomadas

- **Va en el compositor, no en una pantalla nueva.** El compositor ya es el sitio donde dices algo
  sobre un repo, y una release es exactamente eso: una nota que no has tenido que escribir. Además
  acabamos de sacar "Repos" de la navegación (C-11) porque lo que se hace cada muchas semanas no
  merece sitio permanente; meter un "Inbox" dos días después sería contradecirlo.
- **Sin badge y sin contador.** Un buzón que dice "12 cosas por publicar" convierte la app en una
  lista de tareas, y los deberes matan los proyectos paralelos. Las sugerencias están cuando ya has
  decidido escribir; no te persiguen.
- **El borrador es editable, y ese es el punto.** Si solo se pudiera aprobar, esto sería un RSS.
  Poder recortarlo es lo que lo convierte en criterio.
- **Descartar es obligatorio.** Sin ese estado, el mismo PR pregunta para siempre.
- **Lo que se publica es una nota normal**, no un tipo de ítem nuevo. El feed sigue teniendo dos
  cosas y no tres; el origen es una etiqueta, no un formato.
- **Los candidatos se piden a la API al abrir el compositor, con caché corta. No se guardan.**
  Guardar borradores es guardar cosas que su autor todavía no eligió enseñar, y eso es una decisión
  de privacidad que no hace falta tomar. Lo único que se persiste es **lo descartado** — que es una
  preferencia del usuario, no contenido suyo.
- **No hace falta ningún permiso nuevo de la GitHub App.** Los repos de snapstack son públicos por
  definición, así que sus releases y PRs se leen con el cliente que ya existe (`src/lib/github/`).
  Esto importa: añadir un permiso obliga a re-aprobar a todos los que ya instalaron la App, y esa
  fricción ya la sufrimos con el *Starring* de C-07.
- **Releases primero, PRs con etiqueta después.** Una release ya es un acto deliberado: poco
  volumen, mucha señal. El flujo de PRs mergeados es mucho y casi todo irrelevante para quien mira
  desde fuera. Por eso C-13 filtra por la etiqueta `snapstack` — la convención de coste cero de la
  que salió esta idea (MEJORA-10/12).

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| C-12 | `src/lib/github/candidates.ts`, `src/lib/db/note-candidates.ts`, `supabase/migrations/018_note_candidates.sql`, `src/components/notes/note-composer.tsx`, `src/components/notes/candidate-list.tsx` | `src/lib/github/candidates.test.ts`, `src/lib/db/note-candidates.test.ts`, `e2e/notes.spec.ts` |
| C-13 | `src/lib/github/candidates.ts` (filtro por etiqueta) | `src/lib/github/candidates.test.ts` |

Qué cubre cada cosa, y qué se queda fuera de los tests:

- **C-12** — los unitarios cubren el recorte a 500 con el cuerpo de una release larga, que una
  sugerencia publicada o descartada no vuelve a aparecer, y que descartar de otro usuario no toca
  lo tuyo. El e2e monta el compositor con candidatos de mentira en `/dev/notes`: que aparecen, que
  al pulsar uno el cuerpo llega **editable** y con el repo puesto, y que descartar lo quita.
- **C-13** — el unitario cubre que un PR mergeado sin la etiqueta `snapstack` no entra, que con
  ella sí, y que uno cerrado sin mergear tampoco.

**Lo que ninguno cubre, y no puede:** traer candidatos de verdad exige sesión y llamar a la API de
GitHub, y el proyecto no testea contra la API real (`docs/testing.md`). El cliente va mockeado en
los unitarios, y que la lista real se llene es **pasada manual con sesión**, con la evidencia en el
PR — mismo trato que C-07 y C-09.

## Fuera de esta feature

- **Publicar automáticamente.** Nada sale sin que su dueño lo elija. Es la regla de la que nació
  todo esto (decisión de Pol, 2026-08-30).
- **Commits sueltos como candidatos.** Un commit no es una noticia; una release sí.
- **Issues** (MEJORA-13 y MEJORA-14). Además esas sí piden permisos nuevos de la App.
- **Programar una nota para más tarde.** Publicar es ahora o no es.
- **Editar una nota ya publicada.** Sigue valiendo lo de C-09: se borra y se reescribe.
