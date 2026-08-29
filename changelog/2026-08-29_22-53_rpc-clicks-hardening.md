# Seguridad: `increment_repo_clicks` con search_path fijo y sin acceso anónimo

**Fecha:** ver nombre del archivo
**Tipo:** Migración (fix de seguridad)
**Requisitos:** Endurece M-09 / la migración 007

## Qué se hizo

El linter de Supabase avisó del `search_path` mutable en `public.increment_repo_clicks`. Al
revisarlo apareció algo más serio: la función tenía **EXECUTE concedido a `anon` y
`authenticated`** — herencia del `GRANT ... TO PUBLIC` que Postgres aplica por defecto a las
funciones nuevas. Como el esquema `public` se expone por PostgREST, cualquiera con la clave
pública podía llamar `rpc/increment_repo_clicks` y sumar clicks a cualquier repo, o restarlos
con un delta negativo. El contador es un dato del producto (se pinta en cada ficha), así que
se cierra.

La migración 016:

- Fija `search_path = ''` (el cuerpo ya calificaba `public.repos`, así que el riesgo era bajo,
  pero el aviso desaparece y la resolución deja de depender de quien llama).
- Revoca EXECUTE de `public`, `anon` y `authenticated`. La app la llama **solo desde el
  servidor** con el service role (`/api/signals`), que la conserva.

## Verificación

- Con la clave anónima: `42501 permission denied for function increment_repo_clicks`, y el
  contador sin tocar.
- Por la vía legítima (`POST /api/signals`): 202 y el contador sube (0 → 1).
- Auditadas el resto de funciones del esquema `public`: no hay ninguna otra.
- Aplicada en local y en producción.
