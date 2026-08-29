-- Endurece `increment_repo_clicks` (migración 007), por dos motivos:
--
-- 1. **search_path mutable** (aviso del linter de Supabase): sin fijarlo, la
--    resolución de nombres dentro de la función depende de quien la llama.
--    Aquí el cuerpo ya califica `public.repos`, así que el riesgo real era
--    bajo, pero dejarlo explícito cuesta una línea.
-- 2. **EXECUTE abierto a `anon` y `authenticated`** (herencia del default de
--    Postgres, que concede a PUBLIC): la función se llama solo desde el
--    servidor con el service role — el endpoint /api/signals — así que con la
--    clave pública cualquiera podía sumar clicks a cualquier repo, o restarlos
--    pasando un delta negativo. El contador es un dato del producto: se cierra.

alter function public.increment_repo_clicks(uuid, integer)
  set search_path = '';

revoke execute on function public.increment_repo_clicks(uuid, integer) from public;
revoke execute on function public.increment_repo_clicks(uuid, integer) from anon;
revoke execute on function public.increment_repo_clicks(uuid, integer) from authenticated;
