# Mejoras al template base

**Fecha:** 2026-05-14 12:00
**Tipo:** Configuración

## Qué se hizo

Revisión y mejora de la estructura del template para hacerlo más robusto y consistente.

## Qué se modificó

- `CLAUDE.md` — Corregidas dos inconsistencias: (1) unificado el orden de lectura de docs
  en todas las secciones, (2) eliminada la lista hardcoded de archivos en favor de
  "lee todo lo que haya en docs/". Añadido `user-flows.md` al orden de bootstrap.
  Añadido paso 4 en el protocolo de cambios: `/security-review` antes de producción.
  Referencias a `/changelog` y `/mejora` en los puntos del protocolo.
- `docs/testing.md` — Nuevo documento plantilla para estrategia de testing.
- `.gitignore` — Creado con reglas para dependencias, builds, entorno, IDE y OS.
- `.env.example` — Creado como plantilla de variables de entorno (referenciado en README).
- `LICENSE` — Licencia MIT añadida (placeholders [YEAR] y [AUTHOR] pendientes de rellenar).
- `.claude/settings.json` — Permisos preautorizados para comandos de desarrollo habituales.
- `.claude/commands/changelog.md` — Slash command `/changelog` para crear entradas de changelog.
- `.claude/commands/mejora.md` — Slash command `/mejora` para añadir ideas al backlog.
- `.github/pull_request_template.md` — Template de PR con checklist del protocolo.
- `.github/ISSUE_TEMPLATE/bug_report.md` — Template de issue para bugs.
- `.github/ISSUE_TEMPLATE/feature_request.md` — Template de issue para features.
- `changelog/0000-00-00_...` — Añadida nota que indica al usuario que renombre el archivo
  con la fecha real al usar el template.

## Por qué

El template tenía inconsistencias internas en el orden de lectura de docs y le faltaban
piezas de infraestructura básica (.gitignore, .env.example, LICENSE) y de integración
con Claude Code (.claude/) y GitHub (.github/).
