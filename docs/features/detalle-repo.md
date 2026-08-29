# Página de detalle del repo con README

**Estado:** Verificada
**Requisitos que cierra:** C-05 (nuevo, añadido al PRD con esta feature; era MEJORA-03)
**Fecha de acuerdo:** 2026-08-29 (acordada en conversación: punto 2 del feedback de Pol)

## Qué se construye

Cada repo del feed gana su página: `/r/<owner>/<repo>`. Arriba, la identidad visual de la
ficha (fondo procedural, lenguaje, nombre, descripción) con stats (stars, clicks, topics),
el autor con su botón Follow y el enlace a GitHub (que emite la señal `click_repo`, como en
la tarjeta). Debajo, el README renderizado. El título de la tarjeta del feed y del perfil
enlaza aquí. Pública e indexable, con og:image de la propia ficha y JSON-LD.

## Decisiones tomadas

- **El README se guarda en la base al importar** (`repos.readme_md`, migración 011), traído
  con el token del usuario vía REST `GET /repos/{owner}/{repo}/readme` (resuelve el nombre
  del archivo, sea README.md o readme.markdown). Tope de 200.000 caracteres. Los webhooks no
  lo refrescan: por decisión de M-08 no llevan tokens ni llaman a la API — el README se
  actualiza al re-guardar la selección o con el backfill.
- **`pnpm backfill:readmes [--remote]`**: job manual que rellena los READMEs que falten
  (semillas incluidas) con `GITHUB_TOKEN`, mismos flags y salvaguardas que el seed. Un solo
  mecanismo para semillas y rezagados, en vez de tocar también el pipeline del seed.
- **Render seguro:** react-markdown + remark-gfm **sin HTML crudo** (el HTML embebido en el
  README no se interpreta: fuera XSS por construcción, sin sanitizador que mantener). Los
  enlaces relativos se reescriben a `github.com/<repo>/blob/HEAD/…` y las imágenes a
  `raw.githubusercontent.com/<repo>/HEAD/…`; esquemas que no sean http(s)/mailto se anulan.
- **Moderación:** si `findBlockedTerm` (S-01) encuentra un término en el README, no se
  guarda (la página muestra el aviso de "README no importado"); el repo en sí no se bloquea —
  su nombre/descripción/topics ya pasaron el filtro al importar.
- **READMEs que no son Markdown** (rst, txt) se guardan y renderizan igual: react-markdown
  los pinta como texto plano con párrafos, tolerable en v1.
- Repos `removed` o inexistentes → 404. Los seeds tienen página igual que los repos con
  dueño (sin Follow si no hay perfil).
- Ir de la tarjeta al detalle **no** emite `click_repo`: esa señal sigue midiendo solo los
  saltos a GitHub.
- GitHub API Terms: el README cacheado es el mismo régimen que el resto de datos del repo ya
  cacheados; la revisión de límites a escala sigue anotada en "Notas adicionales" de
  CLAUDE.md y Fase 3 del roadmap.

## Qué queda fuera

- Seguir repos individuales (MEJORA-07): siguiente, sobre esta página.
- Resaltado de sintaxis en los bloques de código del README (dependencia extra; v2 si duele).
- Refresco automático del README vía webhooks (exigiría tokens en M-08).

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| C-05 | `src/app/r/[owner]/[name]/`, `src/lib/github/readme.ts`, `src/lib/repo-detail/readme-urls.ts`, `src/jobs/backfill-readmes/`, `supabase/migrations/011_repos_readme.sql` | `src/lib/repo-detail/readme-urls.test.ts`, `src/lib/github/readme.test.ts`, `e2e/repo-detail.spec.ts` |

Los unitarios cubren la reescritura de URLs relativas (y el bloqueo de esquemas raros) y el
parseo/tope/moderación del README traído. El e2e, contra la base local: la página de un repo
sembrado renderiza identidad y stats, el README sembrado se pinta como HTML de markdown (sin
HTML crudo interpretado), el título de la tarjeta navega al detalle y un repo inexistente da
404.
