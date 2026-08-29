# Perfil: jerarquía en la cabecera y fichas a una columna

**Fecha:** ver nombre del archivo
**Tipo:** UI
**Requisitos:** Extiende M-05 / C-03

## Qué se hizo

- **Fichas a una sola columna**, con el ancho del feed (`max-w-2xl`). A dos columnas la
  tarjeta medía menos que los tamaños de texto para los que está diseñada: la descripción
  desbordaba y el menú de la esquina quedaba fuera. Es el mismo componente que el feed, así
  que debe medir lo mismo.
- **Cabecera en tres niveles** en vez de una línea con todo:
  1. Identidad: avatar mayor (80px en desktop), nombre grande, y debajo `@usuario` con el
     enlace a GitHub; el tagline cierra el bloque, ya legible a 16px.
  2. La bio, en su propio párrafo.
  3. Los números (repos, followers, following) tras una línea divisoria, con la **cifra en
     negrita** y la etiqueta en secundario, y los iconos sociales alineados a la derecha.
- El botón (Follow o Edit profile) se alinea arriba con el nombre; en móvil, "Edit profile"
  se queda en el icono para no comerse el ancho.

## Adenda (feedback de Pol)

- La bio sube a 16px: es texto para leer, no un metadato.
- El enlace a GitHub deja la línea de identidad y pasa a la fila de iconos sociales, como una
  red más — `SocialIconLinks` acepta `githubUsername` y lo pinta primero. Bajo el nombre queda
  solo `@usuario`.
