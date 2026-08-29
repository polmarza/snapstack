# Móvil: Settings sale de la barra inferior y entra en el perfil

**Fecha:** ver nombre del archivo
**Tipo:** UI
**Requisitos:** Ninguno

## Qué se hizo

- La barra inferior de móvil deja de mostrar "Settings" (quedaba con 6 items y va a seguir
  creciendo). En desktop, la barra lateral no cambia.
- El perfil propio muestra un botón "Edit profile" (icono de engranaje) donde los demás ven
  el botón Follow, enlazando a `/settings/account`. En móvil es ahora la puerta a Settings;
  en desktop convive con la barra lateral.
- De paso, MEJORA-07 nueva en el backlog: seguir repos individuales desde la futura página de
  detalle (idea de Pol).

## Por qué

Feedback de Pol: la navbar móvil se veía llena. El patrón "Settings desde tu perfil" es el
estándar de las apps sociales.
