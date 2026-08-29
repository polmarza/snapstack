# Botones de la cabecera: orden y color

**Fecha:** 2026-08-29 05:53
**Tipo:** Feature
**Requisitos:** Ninguno nuevo

## Qué se hizo

- **Orden intercambiado**: el botón de GitHub queda a la izquierda y el de donación a la
  derecha.
- **El botón de GitHub pasa a blanco** con contenido oscuro y **sin efecto hover**. Los dos
  botones comparten ahora la misma altura (36px), así que la cabecera queda alineada.
- **MEJORA-06 al backlog**: recuperar el contador de apoyos de Buy Me a Coffee, con lo que
  costaría (token personal en variable de entorno, llamada a su API autenticada y caché) y el
  criterio para retomarlo — cuando la cifra sume como prueba social.

Verificado: 99/99 unit, 21/21 e2e, build y lint en verde; comprobado en el navegador.

## Qué se modificó

- `src/components/auth/auth-controls.tsx`, `src/components/shell/app-shell.tsx`,
  `mejoras/backlog.md`
