# Tarjeta sin desplegable y botón de donación propio

**Fecha:** 2026-08-29 05:42
**Tipo:** Feature
**Requisitos:** Ninguno nuevo

## Qué se hizo

Cuarto repaso de UI de Pol, sobre lo recién añadido:

- **Botón de donación propio** en lugar de la imagen del button-api de Buy Me a Coffee. El
  contador de apoyos venía con un fondo de otro tono y ese detalle no se puede configurar por
  parámetro, así que la única forma de que case con la interfaz era dejar de usar la imagen.
  Se conserva su azul (`#5F7FFF`) para que la marca se reconozca, con icono de taza de lucide.
  De regalo: una petición externa menos en cada carga.
- **La tarjeta pierde el desplegable.** Lo que había dentro se reparte:
  - **Follow** pasa a estar junto al autor, en el pie: es a la persona a quien se sigue.
  - **Topics** se muestran como pastillas (máximo 5) solo si los hay. Sin topics no se pinta
    nada — ni fila ni texto.
  - **Reportar** se va a un menú de tres puntos arriba a la derecha, junto al contador de
    estrellas, con cierre por Escape y por click fuera. Sin sesión el menú no existe.

Verificado: 99/99 unit, 21/21 e2e, build y lint en verde; comprobado en navegador sin sesión.

## Consecuencia a tener en cuenta

**La señal `expand` de M-09 deja de emitirse**, porque ya no hay gesto de expandir. El tipo
sigue en el esquema (y las 65 filas registradas hasta ahora se conservan) para cuando exista un
gesto equivalente. Las otras tres señales siguen igual: `dwell`, `click_repo` y `follow_author`.

El e2e de señales, que probaba `expand`, se reescribió sobre `click_repo` — y de paso quedó
comprobado de punta a punta: tras la ejecución hay una fila `click_repo` real en la base local.

## Qué se modificó

- Nuevo: `src/components/feed/card-menu.tsx`
- Borrado: `src/components/feed/report-button.tsx` (su contenido vive ahora en el menú)
- Actualizado: `src/components/feed/repo-card.tsx` (reestructurada, sin estado de expansión),
  `src/components/shell/donate-button.tsx` y `app-nav.tsx`, `e2e/feed.spec.ts`,
  `e2e/signals.spec.ts`, `e2e/report.spec.ts`

## Por qué

Un desplegable para tres cosas que caben a la vista era un clic de más, y escondía justo lo
social (el follow). Ahora la tarjeta se lee entera de un vistazo.
