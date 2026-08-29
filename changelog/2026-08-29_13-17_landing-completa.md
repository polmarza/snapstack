# Landing completa para visitantes

**Fecha:** ver nombre del archivo
**Tipo:** Feature
**Requisitos:** Ninguno nuevo (la home anónima; el feed no cambia)

## Qué se hizo

La home para visitantes pasa de "héroe + feed" a una landing entera, construida sobre el
activo visual propio del producto — las tarjetas procedurales — en vez de sobre un gradiente
genérico:

- **Hero** a pantalla casi completa: el texto (más grande, `text-8xl` en desktop) entra
  escalonado por encima de un fondo hecho con **las tarjetas reales del feed** en 5 columnas
  que derivan en vertical con direcciones y velocidades alternas. Puro CSS (contenido
  duplicado + keyframe a mitad de recorrido = bucle sin costura), con velo de gradiente para
  que el texto mande. 3 columnas en móvil.
- **Marquee de lenguajes**: tira horizontal en bucle con 24 lenguajes, texto apagado y el
  punto en su color oficial de Linguist, desvanecida en los bordes con `mask-image`.
- **How it works** con gráficos, no numeritos: la marca de GitHub, una selección con límite
  dibujada (2/5 marcados), y una ficha generada por el mismo motor procedural de verdad.
- **FAQ** con `<details>` nativo (6 preguntas que cuentan las decisiones reales: solo lectura,
  límite de 5, borrado real, sync por webhooks).
- **Muestra del feed** ("The feed, live"): 3 fichas reales y una cuarta desvaneciéndose en
  degradado — "hay más". Decisión de Pol: el feed completo es para quien entra; la landing
  solo enseña que está vivo. Consecuencia: el visitante anónimo ya no navega el feed infinito
  (la garantía de M-06 —paginación keyset sin duplicar ni saltar— pasó a verificarse por API
  en el e2e, porque la UI infinita es ahora de sesión).
- **Banner CTA final** justo debajo de la muestra, donde el interés está caliente, con el
  segundo botón de entrar y el remate "Free · read-only · leave whenever you want".

Tras el primer repaso de Pol sobre la rama: columnas del hero **de borde a borde** y con
tarjetas de sobra para no dejar huecos; **bucle sin tirón** en columnas y marquee (el hueco va
como margen de cada pieza, no como `gap` del contenedor — con `gap`, el punto de reinicio del
bucle quedaba descuadrado por medio hueco y se notaba el salto); nombres de las mini-tarjetas
alineados a la izquierda; "How it works" con el botón real + cursor, dos repos con descripción
y el contador de pastillas de la app, y estrellas en la ficha del paso 3; y **mínimo `text-lg`
en todo el texto legible de la landing** (FAQ incluida).

Toda animación respeta `prefers-reduced-motion`. Con sesión, la home no cambia.

Verificado: 99/99 unit, 21/21 e2e, build y lint en verde; recorrido completo comprobado en
navegador (5 secciones presentes, 6 FAQs, feed 10→20 tarjetas al hacer scroll) y viewport
móvil revisado. Cuatro e2e se ajustaron a `.first()`: ahora hay dos botones de entrar en la
home (hero y CTA) y los localizadores en singular fallaban por strict mode.

## Qué se modificó

- Nuevo: `src/components/landing/` (hero-cards-background, language-marquee, how-it-works,
  faq, landing-cta)
- Actualizado: `src/app/(feed)/page.tsx` (ensamblado; el contenedor estrecho pasa a envolver
  solo el feed), `src/app/globals.css` (keyframes), `e2e/auth|onboarding|account.spec.ts`
