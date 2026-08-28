# Semilla de contenido: import de repos trending

**Estado:** Verificada
**Requisitos que cierra:** M-10
**Fecha de acuerdo:** 2026-08-29

## Qué se construye

La primera fuente de contenido real: un import de repos públicos "trending" de GitHub que
llena la base de datos sin requerir login de sus autores, para que el feed no nazca vacío.
Con esta feature se materializa por primera vez la persistencia: el proyecto Supabase con la
tabla `repos` de `docs/data-model.md` (migración 001) y el cliente de base de datos en
`src/lib/db/`.

El import es un script ejecutable (`pnpm seed:trending`): consulta a GitHub los repos con más
stars creados recientemente, los mapea al modelo propio (nombre, descripción, lenguaje
dominante, topics, stars, `card_seed` determinista) y hace upsert por `github_repo_id` con
`is_seed = true` y `owner_profile_id = NULL` — distinguibles siempre de los repos reclamados
por un usuario. Ejecutarlo dos veces no duplica nada; re-ejecutarlo refresca stars y
descripción de los que ya estaban.

Para verlo con los ojos, una página de desarrollo (`/dev/seed`) lista lo importado desde la
base de datos con su ficha visual de M-04. No es el feed (M-06 queda fuera): es la
comprobación de que los datos reales atraviesan todo el camino hasta una ficha renderizada.

## Decisiones tomadas

- **Fuente de trending: la Search API oficial de GitHub** (`/search/repositories`,
  `q=created:>fecha`, `sort=stars`). GitHub no tiene API oficial de trending; scrapear
  github.com/trending es frágil y roza los términos de uso. La Search API es oficial, da
  descripción, lenguaje, topics y stars en una llamada, y para un script de semilla el rate
  limit sin autenticar basta (con `GITHUB_TOKEN` opcional por variable de entorno para subirlo).
- **El import es un script manual en v1, no un job programado.** La cadencia de la semilla la
  decide Pol lanzándolo; montar Inngest/Trigger.dev entra cuando lo exija la importación de
  usuarios reales (M-02), que sí corre en background dentro de una request.
- **Cliente de datos: `@supabase/supabase-js` con service role solo en servidor.** Sin ORM por
  ahora; las queries viven en `src/lib/db/`.
- **La migración crea solo la tabla `repos`** (con RLS: lectura pública solo de `status =
  'active'`, escritura solo service role). El resto de tablas de `docs/data-model.md` llegan
  con sus features.
- **Desarrollo y tests contra Supabase local** (`supabase start`, CLI oficial): los tests nunca
  tocan el proyecto remoto (ver "Límites de ejecución"). Aplicar la migración al proyecto
  remoto queda preparado y documentado; el botón lo pulsa Pol.
- Los repos sin descripción se importan igual (la ficha ya sabe renderizar sin descripción);
  los archivados o vacíos de stars no entran en la consulta.

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| M-10 | `src/jobs/seed-trending/`, `src/lib/db/`, migración `supabase/migrations/001_repos.sql` | `src/jobs/seed-trending/seed-trending.test.ts`, `e2e/seed-feed.spec.ts` |

Los tests unitarios cubren, con la API de GitHub mockeada: el mapeo respuesta → fila (incluido
`is_seed = true`, `owner_profile_id = NULL` y `card_seed` determinista), la idempotencia del
upsert (misma ejecución dos veces → mismas filas) y el manejo de errores de la API. El e2e
comprueba contra Supabase local que `/dev/seed` muestra fichas de repos importados.

## Fuera de esta feature

- El feed real con scroll infinito (M-06): `/dev/seed` es una página de desarrollo.
- La GitHub App, sus webhooks y la sincronización continua (M-08): la semilla no se suscribe a
  webhooks; se refresca re-ejecutando el script.
- La reclamación de un repo semilla por su autor al registrarse (candidata de Fase 2).
- Cualquier tabla que no sea `repos` (profiles, follows, signals, reports).
- Programar el import con Inngest/Trigger.dev.
