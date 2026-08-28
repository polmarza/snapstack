# Añadido protocolo de pull requests a CLAUDE.md

**Fecha:** 2026-05-14 13:00
**Tipo:** Documentación

## Qué se hizo

Formalizado en `CLAUDE.md` el protocolo de pull requests: rellenar `¿Qué se hizo?` y `Motivación`, marcar el tipo de cambio, repasar el checklist marcando solo lo verificado de verdad, y explicar en la descripción los puntos que no apliquen en lugar de dejarlos en silencio.

Alineadas las categorías de "Tipo de cambio" entre el formato del changelog (en `CLAUDE.md`) y la plantilla de PR (en `.github/pull_request_template.md`). Ambos usan ahora la misma lista: Feature / Fix / Refactor / Migración / Documentación / Configuración.

## Qué se modificó

- `CLAUDE.md` — nueva sección "Protocolo de pull requests" tras "Protocolo de cambios"; añadida "Documentación" al listado de tipos del changelog
- `.github/pull_request_template.md` — categorías de "Tipo de cambio" alineadas con el changelog

## Por qué

El template de PR existía como archivo en `.github/`, pero `CLAUDE.md` no decía nada sobre verificar el checklist al cerrar trabajo. Esto significaba que el checklist se renderizaba en GitHub vacío y se quedaba sin marcar incluso cuando los puntos sí se habían cumplido. Ahora el protocolo lo cubre explícitamente.
