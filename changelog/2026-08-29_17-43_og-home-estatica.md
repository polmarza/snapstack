# La og:image de la home pasa a ser la captura real del hero

**Fecha:** ver nombre del archivo
**Tipo:** Fix
**Requisitos:** Ninguno

## Qué se hizo

- La portada al compartir snapstack.sh es ahora `public/og-home.png` (1200×630): la misma
  captura real del hero que encabeza el README, redimensionada.
- Se elimina `/api/og/home` (la composición procedural congelada): quedaba con las tarjetas
  recortadas y el texto pisándolas, y ya no tiene consumidores.

## Por qué

Feedback de Pol: la og:image seguía siendo la versión con el recorte raro. La captura real
del hero es más fiel y más vistosa. Si el hero cambia en el futuro, hay que regenerar la
captura (mismo procedimiento que la del README).
