# Design System

<!-- Fuente de verdad visual del proyecto.
     Consultar antes de crear cualquier componente nuevo.
     Actualizar cuando se añadan nuevos patrones, componentes o se modifique la identidad visual. -->

> **Estado: propuesta inicial.** La spec no fijaba identidad visual; esta es una primera
> dirección pendiente de validar con Pol antes de construir UI. Lo único no negociable viene
> del PRD: las fichas anclan su paleta al color Linguist del lenguaje dominante.

---

## Principio rector

Las **fichas son el color**; la interfaz es el marco. El chrome de la app (fondo, navegación,
tipografía de apoyo) se mantiene oscuro y neutro para que los fondos procedurales de las
tarjetas — cada uno con la paleta de su lenguaje — sean lo único que brilla en el feed.

---

## Paleta de colores

| Rol | Nombre | Hex |
|-----|--------|-----|
| Background | Fondo base (casi negro) | #0B0E14 |
| Surface | Fondo de cards/paneles de UI | #151A23 |
| Border | Bordes y separadores | #232B38 |
| Primary | Acento de acción (botones, links, follow) | #34D399 |
| Text primary | Texto principal | #E6EDF3 |
| Text secondary | Texto secundario | #8B98A9 |
| Success | Estados positivos | #34D399 |
| Error | Estados de error | #F87171 |
| Warning | Advertencias | #FBBF24 |

Los colores de acento de cada **ficha** no salen de esta tabla: salen del color oficial de
GitHub Linguist del lenguaje dominante del repo (ej. TypeScript #3178C6, Python #3572A5,
Rust #DEA584), aplicado al gradiente/formas del fondo procedural.

---

## Tipografía

- **Display / Headings / UI:** Geist Sans (o Inter como fallback)
- **Monospace:** JetBrains Mono — nombres de repos, chips de lenguaje, cifras de stars

| Nivel | Fuente | Tamaño | Peso |
|-------|--------|--------|------|
| H1 (nombre de repo en ficha) | JetBrains Mono | 32px | 700 |
| H2 (secciones, nombre en perfil) | Geist Sans | 24px | 600 |
| Body | Geist Sans | 16px | 400 |
| Chips / metadata | JetBrains Mono | 13px | 500 |
| Caption | Geist Sans | 12px | 400 |

---

## Espaciado y grid

- Escala: base 4px (4, 8, 12, 16, 24, 32, 48, 64, 96)
- Feed: columna única centrada, max-width 640px — una ficha por viewport aprox., ritmo de
  scroll tipo timeline, no grid de galería
- Perfil: grid de fichas 2 columnas en desktop, 1 en móvil; max-width 960px

---

## Estilo de componentes

- Border radius: 16px para fichas, 8px para botones e inputs, full para chips y avatares
- Sombras: ninguna decorativa; las fichas se separan del fondo por su propio color
- Iconos: Lucide, tamaño base 20px
- La ficha (imagen `@vercel/og`) es el componente central: fondo procedural + nombre +
  descripción corta. Relación de aspecto 1200×630 (OG estándar), reutilizable como og:image
  del repo y del perfil

---

## Tono visual

Oscuro, denso en contenido, tranquilo en el chrome. Debe sentirse como una herramienta de
developer (terminal, editor), no como una red social genérica. Nada de gamificación visual:
sin contadores llamativos, sin corazones. Lo que destaca en pantalla es siempre un repo,
nunca la interfaz.

Qué NO debe parecer: un clon de GitHub (usa sus colores de lenguaje, no su identidad), ni un
Pinterest de tarjetas, ni una app tinder-style.

---

## Componentes definidos

### RepoCard
Tarjeta del feed. Fondo procedural de M-04 pintado en **HTML/CSS** (misma data determinista
que `/api/og`; la imagen queda para og:image y embeds), con texto real: en móvil la tarjeta es
4:5 y en ≥640px, 1.9:1. Estado local de expansión (descripción completa + topics) y enlace al
repo. Props: `repo: FeedRepo`. Usar en feed y, más adelante, en perfiles.

### FeedList
Lista de scroll infinito: centinela con IntersectionObserver, fin de feed explícito, error con
reintento inline que conserva lo cargado. Props: `initialRepos`, `initialCursor`.

### CardBackgroundLayer
Capa de fondo procedural (gradiente + manchas) a partir de un `CardBackground`. La usan
`RepoCard` ahora y cualquier superficie futura que pinte la identidad visual de un repo.

Pendientes: `FollowButton`, `LanguageChip` (hoy es un dot + texto dentro de `RepoCard`).

---

## Referencias visuales

- Colores de lenguaje: GitHub Linguist (`languages.yml`)
- Ritmo de feed en columna única: Read.cv / posts de Bluesky
- Fondos procedurales deterministas: avatares de Vercel, gradientes de GitHub Next

---

## Modales

`<dialog>` nativo, sin librería: da Esc, foco atrapado y backdrop de serie. Patrón (ver
`InstallScopeDialog`): ancho `min(46rem, 92vw)`, `rounded-2xl`, borde `edge`, fondo
`background` y backdrop oscurecido con desenfoque; cabecera con título en mono, texto de
apoyo y cruz de cierre; cierra también al pulsar el fondo, comparando `event.target` con el
propio `<dialog>`.

Los diagramas explicativos van en SVG inline, con las variables de color del tema
(`var(--color-primary)`, `var(--color-content-secondary)`) en vez de valores fijos, y llevan
`role="img"` con `aria-label` — son contenido, no decoración.

---

## Estructura de la landing

El orden cuenta una historia y no debería reordenarse sin motivo. Cada sección lleva `id` y
`scroll-mt-20` para que la navegación pueda saltar a ella sin que la barra fija tape el
titular:

0. **Navegación** (`LandingNav`) — centrada y sin fondo dentro del hero (solo los enlaces:
   el hero ya trae su botón de entrar); al pasar el hero se vuelve fija arriba, con el fondo
   de la app, la marca a la izquierda y el botón de entrar a la derecha, donde ya no es
   redundante. El cambio lo dispara un IntersectionObserver sobre el propio hero.
1. **Hero** — marca, promesa y entrada, con las fichas reales del feed al fondo.
2. **Marquee de lenguajes** — señal de que dentro hay stacks de verdad.
3. **Por qué** (`WhySnapstack`) — el problema con el que el visitante ya convive, en tres
   puntos concretos, antes de hablar de funcionalidades.
4. **Qué hay** (`FeaturesGrid`) — seis fichas, cada una contando una decisión real del
   producto (el límite de cinco, el determinismo, el orden barajado), no una promesa.
5. **Cómo empezar** (`HowItWorks`) — los tres pasos con sus gráficos.
6. **Cómo está construido** (`BuiltWith`) — el stack con sus logos y el enlace al código. La
   landing habla a devs: enseñar de qué está hecho es información útil, y el repo público es
   argumento de confianza. Los logos salen de `simple-icons` (ya instalada), monocromos —
   varias marcas son negras y desaparecerían sobre el fondo oscuro.
7. **Preguntas** (`Faq`) — las dudas que frenan el registro (permisos, precio, borrado).
8. **Muestra del feed y CTA** — la prueba de que está vivo, y la puerta. El CTA cierra **a
   sangre**: ancho completo, fondo en el verde de marca, sin bordes ni esquinas redondeadas y
   pegado al footer (que solo ahí pierde su margen y su línea). Sobre el verde, el texto va en
   el color de fondo y el botón cambia de blanco a oscuro (`AuthControls tone="onPrimary"`).
