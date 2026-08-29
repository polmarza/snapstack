# README: una sola captura de cabecera

**Fecha:** ver nombre del archivo
**Tipo:** Documentación
**Requisitos:** Ninguno

## Qué se hizo

- La cabecera del README pasa a ser una captura real del hero de la landing (código actual,
  con el marquee de lenguajes cerrando el encuadre), en lugar de la og:image, que quedaba
  rara como banner (tarjetas cortadas y texto pisándose con ellas).
- Se elimina la segunda captura del hero que aparecía duplicada dentro de "¿Qué es
  snapstack?": una sola imagen de cabecera basta.
- Assets: `hero.png` regenerado (localhost, 1712×898 @1.5x), `og-home.png` retirado del
  repo (sigue viviendo donde debe: el endpoint `/api/og/home`).

## Por qué

Feedback de Pol sobre el PR #21: el banner og quedaba "medio raro" y el hero salía dos veces.
