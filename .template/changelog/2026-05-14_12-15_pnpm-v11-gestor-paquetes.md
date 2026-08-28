# Establecido pnpm v11 como gestor de paquetes

**Fecha:** 2026-05-14 12:15
**Tipo:** Configuración

## Qué se hizo

Adoptada la convención de usar pnpm v11 como gestor de paquetes en todo el template, en lugar de npm o yarn. La regla queda fijada tanto en `CLAUDE.md` (sección "Convenciones de código" y "Qué NO hacer") como en `README.md` (comandos de instalación), `docs/testing.md` (comandos de test) y `.claude/settings.json` (permisos preautorizados).

## Qué se modificó

- `CLAUDE.md` — añadida `pnpm v11` a convenciones, prohibido npm/yarn en "Qué NO hacer"
- `README.md` — `npm install` / `npm run dev` → `pnpm install` / `pnpm dev`
- `docs/testing.md` — todos los comandos `npm run *` → `pnpm *`
- `.claude/settings.json` — eliminadas entradas de npm y yarn del allow list

## Por qué

pnpm es más rápido en instalación, más estricto con dependencias fantasma y usa menos espacio en disco al compartir paquetes entre proyectos. Fijar una única herramienta evita problemas de lockfiles cruzados y mantiene la coherencia del entorno.

## Nota

Esta entrada se añade de forma retroactiva al commit `44da9d4` ("chore: establecer pnpm v11 como gestor de paquetes"), donde el cambio se introdujo sin entrada de changelog. Detectado al revisar el checklist del PR #2.
