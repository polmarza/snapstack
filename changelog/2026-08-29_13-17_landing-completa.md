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
- **Banner CTA final** con el segundo botón de entrar y el remate "Free · read-only · leave
  whenever you want".
- **El feed en vivo va al final** ("The feed, live"), y esto es deliberado: con scroll
  infinito, cualquier sección colocada debajo del feed sería inalcanzable. Encima de él, todo
  se puede leer; debajo, el feed sigue siendo infinito como siempre.

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
