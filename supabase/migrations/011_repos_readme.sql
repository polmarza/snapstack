-- Detalle del repo (C-05): README cacheado en la fila del repo.
-- Se rellena al importar (token del usuario) o con pnpm backfill:readmes;
-- los webhooks no lo tocan (M-08 no lleva tokens). Tope aplicado en app.

alter table public.repos
  add column if not exists readme_md text,
  add column if not exists readme_fetched_at timestamptz;
