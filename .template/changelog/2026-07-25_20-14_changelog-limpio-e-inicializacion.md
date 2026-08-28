# Changelog limpio de fábrica e inicialización del proyecto

**Fecha:** 2026-07-25 20:14
**Tipo:** Configuración

## Qué se hizo

Dos cambios que atacan el mismo problema: la plantilla se arrastraba a sí misma dentro de los
proyectos que la usan.

**1. `changelog/` llega vacío.** El historial de cambios de la propia plantilla se ha movido a
`.template/changelog/`. En la raíz, `changelog/` queda solo con un `README.md` que explica el
formato de entrada. Se elimina también la entrada placeholder `0000-00-00_...`, que obligaba al
usuario a renombrarla a mano y aparecía como una entrada falsa en un proyecto recién creado.

`.template/` es además el marcador de estado del repo: si existe, la plantilla no se ha
inicializado todavía.

**2. La inicialización es responsabilidad del agente.** Nueva sección "Inicialización del
proyecto (una sola vez)" en `CLAUDE.md` con un checklist de 8 puntos que se ejecuta en cuanto los
docs están rellenos: reescribir el README para el producto, rellenar los datos de `CLAUDE.md`,
sustituir los placeholders de `LICENSE`, podar `.env.example`, crear la primera entrada real de
changelog, limpiar el ejemplo del backlog, borrar `.template/` y verificar con grep que no quedan
referencias sueltas a la plantilla. Nuevo comando `/init-proyecto` para lanzarlo a demanda.

La regla de fondo queda escrita: después de la inicialización, ningún archivo del repo se describe
a sí mismo como plantilla.

## Qué se modificó

- `CLAUDE.md` — nueva sección "Inicialización del proyecto (una sola vez)"; el arranque comprueba
  `.template/` y detecta inicializaciones a medias; el protocolo de changelog distingue entre
  entradas de la plantilla y del proyecto; el punto de README recuerda mantenerlo sincronizado
  con el proyecto
- `README.md` — `.template/` documentado en "¿Qué hay dentro?"; el changelog se describe como
  vacío de fábrica; nuevo paso 4 en "¿Cómo empezar?"; "Adaptar para tu proyecto" pasa de ser una
  guía manual a una tabla de lo que hace el agente
- `.claude/commands/init-proyecto.md` — nuevo comando `/init-proyecto`
- `.claude/commands/changelog.md` — enruta las entradas a `.template/changelog/` mientras el repo
  siga siendo la plantilla
- `changelog/README.md` — nuevo, explica el formato de entrada
- `changelog/0000-00-00_00-00_inicializacion-repositorio.md` — eliminado
- `changelog/2026-05-14_*.md` (4 archivos) — movidos a `.template/changelog/`
- `.template/README.md` — nuevo, explica qué es la carpeta y cuándo se borra

## Por qué

Quien usaba la plantilla heredaba cinco entradas de changelog sobre la evolución del propio
andamiaje (pnpm, protocolo de PRs, reescritura del README de la plantilla…), ruido puro para su
proyecto. Y el README explicaba qué es la plantilla, algo correcto mientras vives en el repo de la
plantilla pero equivocado en cuanto arranca un proyecto real: la sección "Adaptar para tu
proyecto" dejaba ese trabajo en manos del usuario y en la práctica no se hacía nunca. Ahora la
limpieza forma parte del protocolo que el agente ya sigue.
