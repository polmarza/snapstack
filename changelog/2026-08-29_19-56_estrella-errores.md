# Estrella real: errores visibles, 403 con nombre y auto-star tras autorizar

**Fecha:** ver nombre del archivo
**Tipo:** Fix / UX
**Requisitos:** Extiende C-07 (estreno de Pol: "carga pero no hace nada")

## Qué se hizo

- **El botón de estrella enseña los errores** en un aviso bajo el botón (antes los tragaba:
  el fallo del estreno era invisible).
- **El 403 de GitHub tiene nombre y mensaje accionable:** "the app's Starring permission is
  missing or pending approval (github.com/settings/installations)". Es el caso real del
  estreno: añadir un permiso a una App exige que la instalación lo apruebe.
- **Auto-star al volver del OAuth:** la conexión vuelve con `?star=1` y la estrella pendiente
  se da sola — ya no hace falta el segundo click que confundió en el estreno. El parámetro
  se limpia de la URL para que recargar no repita el gesto.
