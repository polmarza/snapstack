# Notas ancladas a un repo

**Estado:** Acordada
**Requisitos que cierra:** C-09, C-11
**Fecha de acuerdo:** 2026-08-31

## Qué se construye

Un usuario con sesión puede escribir una **nota**: un texto corto (≤ 500) que cuelga
obligatoriamente de uno de sus repos activos. La escribe desde el feed
—un compositor arriba de la lista— y lo primero que le pide es sobre cuál de sus cinco repos
está escribiendo. Ejemplos reales del uso que la motiva: *"estoy trabajando en esta
funcionalidad"* con la captura, o *"me he encontrado este bug que no esperaba"*.

La nota aparece en tres sitios: en el **feed**, mezclada con las fichas de repo; en la **página
de detalle** de su repo; y en el **perfil** de su autor, bajo el repo correspondiente. Quien
esté suscrito a ese repo recibe notificación, por la misma vía que ya avisa de los pushes
(C-06). El autor puede borrar su nota.

Para que las notas quepan en el feed, el feed deja de estar barajado y pasa a ordenarse por
recencia de actividad. Y la navegación se reordena en consecuencia: "Repos" —que hoy apunta a
la selección propia y se lee como si fuera el feed— se va dentro de Settings.

## Decisiones tomadas

- **No existe la nota sin repo.** Es la regla que sostiene toda la feature: una nota es una nota
  *sobre algo que estás construyendo*. Sin el ancla, el producto se convierte en un microblog
  donde los repos son un adorno — que ya existe y no es esto. Acordado con Pol el 2026-08-31.
- **Se escribe desde el feed, no desde el repo.** El repo sigue siendo el ancla, pero pedirle al
  usuario que navegue a `/r/owner/repo` para escribir mata el gesto. El compositor pregunta por
  el repo; no obliga a ir a buscarlo.
- **El feed pasa a orden cronológico y esto absorbe MEJORA-01.** Es la consecuencia menos obvia
  y la más cara: hoy el feed va barajado por `card_seed` con cursor de keyset y vuelta al
  principio, precisamente para que ningún autor se quede con la cabecera. Una nota es una
  novedad, y una novedad de hace una semana arriba del todo está mal puesta. Las dos cosas no
  conviven: gana la recencia, y se pierde la propiedad de reparto que daba el barajado. Habrá
  que vigilar que un autor prolífico no monopolice el feed — si pasa, se limita por autor por
  página, no volviendo al barajado.
- **La unidad del feed deja de ser el repo.** Necesita un tipo de ítem con `kind`. Afecta a
  `docs/data-model.md` y a `docs/architecture.md`, que se actualizan en la misma sesión en que
  se construya.
- **La nota es texto plano, no Markdown.** Renderizar Markdown de usuario abre la misma
  superficie que ya costó cerrar en el README del detalle (C-05). Si algún día hace falta, se
  reutiliza aquel pipeline, no se improvisa otro.
- **Sin comentarios en las notas.** Es MEJORA-11, va después y con moderación delante.

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| C-09 | `supabase/migrations/017_notes.sql`, `src/lib/db/notes.ts`, `src/components/notes/`, `src/lib/db/notifications.ts` | `src/lib/db/notes.test.ts`, `src/lib/db/notifications.test.ts`, `e2e/notes.spec.ts` |
| C-11 | `src/lib/db/feed-page.ts`, `src/app/(feed)/page.tsx`, `src/components/shell/app-nav.tsx`, `src/app/settings/` | `src/lib/db/feed-page.test.ts`, `e2e/notes.spec.ts` |

Qué cubre cada cosa, y qué se queda fuera de los tests:

- **C-09** — los unitarios cubren el anclaje obligatorio (una nota sin repo propio y activo se
  rechaza en servidor), el tope de 500, que solo el autor borra la suya, y el caso `note` nuevo
  en las notificaciones sobre la base de C-06. El e2e comprueba que la nota publicada aparece en
  los tres sitios: feed, detalle del repo y perfil.
- **C-11** — `feed-page.test.ts` se reescribe: el orden barajado y su cursor de vuelta al
  principio desaparecen, y entran los casos del orden por recencia con ítems de los dos tipos.
  El e2e comprueba que la barra principal ya no lleva "Repos" y que la selección sigue
  alcanzable desde Settings.

## Fuera de esta feature

- **La imagen en la nota (C-10).** Sacada de aquí el 2026-08-31 por decisión de Pol: es la
  parte que más alarga la feature (bucket de Storage, validación en servidor, políticas) y las
  notas de texto ya cierran el bucle de "tengo dónde contar lo que estoy haciendo". Queda
  declarada en el PRD sin ficha, como C-01 y C-02, y el compositor se construye de forma que
  añadirla después no lo rehaga.
- **Comentarios en las notas** (MEJORA-11). Va después, y con moderación delante.
- **Encuestas y otros tipos de ítem.** La tabla queda preparada con `kind`, pero solo se
  implementan `repo` y `note`.
- **Cosechar releases y PRs como borradores** (MEJORA-10) y la **bandeja de publicación**
  (MEJORA-12). Esta feature construye la nota escrita a mano; la nota automática que espera
  aprobación es el paso siguiente y se apoya en esto.
- **Editar una nota publicada.** Se puede borrar y volver a escribir. Editar exige historial o
  aceptar que lo que otro leyó cambie sin rastro, y eso merece su propia decisión.
- **Notas sobre repos ajenos.** Escribes sobre lo tuyo. Comentar lo de otro es MEJORA-11.
- **Emails o push.** Las notificaciones siguen siendo solo in-app, como en C-04.
