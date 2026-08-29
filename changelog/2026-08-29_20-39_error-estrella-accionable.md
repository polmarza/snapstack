# El error de la estrella lleva botón, no una URL escrita

**Fecha:** ver nombre del archivo
**Tipo:** UI
**Requisitos:** Extiende C-07

## Qué se hizo

- `StarResult` gana `fixUrl`/`fixLabel`: cuando un error tiene arreglo conocido, el aviso
  pinta un **botón** ("Review on GitHub ↗") en vez de escribir la dirección en el texto. En
  móvil una URL escrita obliga a copiarla a mano — feedback de Pol al toparse con el 403.
- El texto del 403 se acorta a lo que importa: "GitHub blocked this: the app's Starring
  permission is waiting for your approval."

## Nota: por qué la línea "GitHub App connected" no aparecía

No es un fallo del banner: en producción `profiles.github_installation_id` está a NULL porque
la App se instaló **antes** de que existieran la migración 015 y el handler del evento
`installation`. GitHub emitió aquel evento contra un servidor que aún no lo entendía. Se
corrige solo con el siguiente evento de esa instalación — aceptar el permiso pendiente emite
`installation.new_permissions_accepted`, que el handler ya desplegado sí registra.
