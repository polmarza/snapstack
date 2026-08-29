# Feed de scroll infinito

**Estado:** Verificada
**Requisitos que cierra:** M-06
**Fecha de acuerdo:** 2026-08-29

## Qué se construye

La home deja de ser un placeholder y pasa a ser el producto: un feed público (sin necesidad de
sesión) con las fichas visuales de los repos activos en orden cronológico de importación. Al
acercarse al final del contenido cargado, se carga la siguiente página sin recargar — sin
swipe, sin like/dislike. El final del feed se marca de forma explícita (nada de spinner
infinito), y un fallo de carga muestra un reintento inline conservando lo ya cargado
(casos de error de FLOW-02).

Cada tarjeta muestra la ficha de M-04, el nombre del repo con su autor, lenguaje y stars, y
puede expandirse para ver descripción completa y topics, con enlace al repo en GitHub. La
primera página llega renderizada desde el servidor (streaming/SEO); las siguientes las pide el
cliente a un endpoint paginado.

**La tarjeta del feed se pinta en HTML/CSS, no con la imagen de `/api/og`.** El fondo
procedural es data (`cardBackground()`: gradiente, ángulo, manchas) y se renderiza idéntico
con CSS, con el texto como texto real: legible en móvil a cualquier ancho (la imagen 1200×630
escalada a 375px deja la descripción en ~9px), accesible y indexable. La imagen de `/api/og`
queda para `og:image` al compartir y para embeds.

## Decisiones tomadas

- **Paginación por cursor keyset (`imported_at`, `id`), no por offset.** Con inserts continuos
  (seed, importaciones futuras), el offset duplica o salta fichas; el keyset es estable. El
  cursor viaja como token opaco en `/api/feed?cursor=`. El campo de orden queda parametrizado
  en un solo sitio: hay una idea en `mejoras/` de ordenar por última actividad vía webhooks
  (M-08), y el cambio debe ser trivial.
- **Página de 10 fichas**, constante en un solo sitio para poder ajustarla.
- **La detección de scroll usa IntersectionObserver** sobre un centinela al final de la lista,
  no listeners de scroll.
- **La home es el feed** (no una ruta aparte): es el modelo de producto perfil + feed.
- **Expandir es un estado local de la tarjeta** (detalles debajo de la imagen), sin ruta
  propia. La instrumentación de ese gesto es de M-09, no de aquí.
- `/dev/seed` y `/dev/cards` se quedan como herramientas de desarrollo.

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| M-06 | `src/app/page.tsx`, `src/app/api/feed/`, `src/components/feed/`, `src/lib/db/repos.ts` | `src/lib/db/feed-page.test.ts`, `e2e/feed.spec.ts` |

Los unitarios cubren la paginación keyset con db mockeada: orden cronológico, codificación y
decodificación del cursor, página parcial final y cursor nulo al agotarse. El e2e, contra
Supabase local sembrado: la home muestra la primera página, el scroll carga la siguiente sin
recarga, y el final del feed aparece cuando no queda contenido.

## Fuera de esta feature

- Follows y filtro "solo seguidos" (M-07).
- Registro de señales implícitas al hacer scroll/expandir/click (M-09).
- Perfiles públicos enlazados desde la tarjeta (M-05): el autor se muestra como texto hasta
  que existan.
- Cualquier ranking u orden que no sea cronológico.
