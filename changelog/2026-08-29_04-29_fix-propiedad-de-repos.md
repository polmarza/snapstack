# Fix de seguridad: la propiedad de un repo se verifica en servidor

**Fecha:** 2026-08-29 04:29
**Tipo:** Fix
**Requisitos:** Ninguno nuevo (corrige M-02/M-03, ya entregados)

## Qué se hizo

Arreglo del fallo HIGH que encontró `/security-review` antes del despliegue, más dos cosas
que salieron con él.

**El fallo.** `saveSelectionAction` se fiaba de la lista de `full_name` que manda el cliente y
no comprobaba que los repos fueran del usuario. Como la consulta de detalle
(`repository(owner, name)`) resuelve cualquier repo público y el upsert por `github_repo_id`
sobreescribía la fila entera —`owner_profile_id` incluido—, un usuario registrado podía
llamar la server action con argumentos a mano y (a) colgarse repos ajenos en su perfil, o (b)
quedarse el repo que otro usuario ya había importado, que desaparecía del perfil de su dueño.
La pantalla solo lista tus repos, pero eso es código de cliente: las server actions se pueden
invocar con lo que sea.

**El arreglo, en dos capas:**
- En `saveSelectionAction`: el `owner.login` que devuelve GitHub tiene que coincidir con el
  username del perfil que importa.
- En `importOwnedRepos`: rechaza (`RepoOwnedByAnotherProfileError`) cualquier fila que ya
  pertenezca a otro perfil, y el UPDATE lleva `owner_profile_id.is.null,owner_profile_id.eq.<id>`
  en su propio filtro, así que la condición la aplica Postgres y no depende de la comprobación
  previa. Las semillas sin dueño se siguen reclamando, que es lo que queremos.

**Integridad del seed** (no lo vio la revisión porque no es atacable, pero destruía datos):
`upsertRepos` devolvía a semilla cualquier repo curado por un usuario que siguiera en
trending, quitándoselo de su perfil. Ahora los salta y los cuenta como `skipped`.

**Validación del cursor del feed** (endurecimiento; la revisión lo descartó como no
explotable): `decodeCursor` exige fecha ISO y uuid antes de que esos valores entren en el
filtro `or=(...)` de PostgREST. De paso evita 500 por cursores corruptos.

Verificado: 99/99 unit (tres de regresión: robo rechazado, lote entero sin escribir, seed que
respeta al dueño), 21/21 e2e, build y lint en verde. Y el ataque probado contra la base local:
`polmarza` intentando quedarse `MiniMax-AI/MiniMax-H3` de `test-demo-dev` →
`RepoOwnedByAnotherProfileError`, fila intacta.

## Qué se modificó

- `src/app/settings/repos/actions.ts` (verificación de dueño), `src/lib/db/selection.ts`
  (guardia + error nuevo), `src/lib/db/repos.ts` (seed no pisa dueños),
  `src/jobs/seed-trending/` (contador `skipped`), `src/lib/db/feed-page.ts` (validación del
  cursor)
- Tests: `selection.test.ts`, `seed-trending.test.ts`, `feed-page.test.ts`
- `docs/architecture.md` (decisión técnica registrada)

## Por qué

Es el único hallazgo HIGH de la revisión de seguridad y bloqueaba el despliegue: cualquier
usuario registrado podía manipular el contenido de otro. El resto de la revisión salió limpio
(webhooks, señales, borrado de cuenta, reportes, follows, RLS).
