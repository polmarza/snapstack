# Esqueleto del proyecto y ficha visual procedural

**Fecha:** 2026-08-29 00:49
**Tipo:** Feature
**Requisitos:** M-04

## Qué se hizo

Primera feature del proyecto (ficha: `docs/features/esqueleto-y-ficha-visual.md`, Verificada):

- **Esqueleto:** app Next.js 16 (App Router) con TypeScript estricto, Tailwind 4 con los
  tokens del design system, Vitest (+ coverage), Playwright configurado (browsers pendientes
  de `pnpm exec playwright install chromium`), ESLint con eslint-config-next y
  `.claude/launch.json` para levantar el dev server.
- **M-04 — ficha visual generada:** `src/lib/card-seed/` produce un fondo procedural
  determinista por repo (hash FNV-1a del ID como semilla, gradiente y manchas derivados con
  mulberry32) anclado al color oficial de GitHub Linguist del lenguaje dominante (692 colores
  vendorizados desde languages.yml; regenerables con `pnpm regen:linguist`). El endpoint
  `/api/og` renderiza la ficha 1200×630 con `next/og` (Satori) y cabeceras de cache CDN.
  Demo local en `/dev/cards` con fixtures.

Verificado: build en verde, 22/22 tests unitarios, lint limpio, `verificar-cobertura.mjs` sin
fallos, y determinismo comprobado byte a byte (dos peticiones al mismo URL → mismo hash SHA-1
de imagen).

## Qué se modificó

- Nuevo: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`,
  `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.mts`,
  `playwright.config.ts`, `.claude/launch.json`
- Nuevo: `src/app/` (layout, home, `dev/cards`, `api/og`), `src/lib/card-seed/` (hash, color,
  linguist-colors, card-seed, card-input + tests), `e2e/smoke.spec.ts`,
  `scripts/regen-linguist-colors.mjs`
- Actualizado: `docs/architecture.md` (estructura real), `README.md` (estado), `.gitignore`

## Por qué

Base para todas las features siguientes, más la pieza más autocontenida del PRD (M-04) para
que el primer cambio deje algo visible y testeado. Notas de versiones: TypeScript fijado a 6.x
(typescript-eslint aún no soporta TS 7.0) y ESLint a 9.x (eslint-plugin-react no es compatible
con ESLint 10).
