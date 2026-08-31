# Product Requirements Document (PRD)

<!-- Fuente de verdad sobre qué construimos y por qué.
     Actualizar este archivo cuando cambie el alcance, las funcionalidades o el usuario objetivo.
     Si algo se mueve a "fuera de alcance", no borrar: mover a la sección correspondiente. -->

---

## Resumen ejecutivo

**Snapstack** (snapstack.sh) es una red social para desarrolladores construida sobre GitHub.
Cada dev conecta su cuenta y obtiene un perfil público con una **selección curada** de sus
repositorios (no un volcado automático de toda su cuenta). Cada repo se presenta como una
**ficha visual** generada proceduralmente, y el conjunto se navega en un **feed de scroll
infinito**: sin swipe, sin like/dislike.

La intención de uso es social y pasiva: seguir a un dev y ver qué construye, no buscar
activamente repos como en un directorio. Las apps existentes de descubrimiento de repos
(GitHubba, gitinder) usan el modelo tinder de tarjetas sueltas para deslizar; Snapstack usa el
modelo perfil + feed. El código de Snapstack es público desde el primer commit.

Es un proyecto independiente del directorio de repos en español con ranking de pago que Pol
tiene en marcha por separado: no comparten alcance ni base de código salvo decisión explícita.

---

## Problema que resuelve

Un desarrollador que quiere enseñar lo que construye solo tiene su perfil de GitHub, que mezcla
lo relevante con ejercicios de clase, forks y pruebas, y no está pensado para descubrir ni
seguir gente. Quien quiere ver qué están construyendo otros devs no tiene un sitio donde
hacerlo de forma pasiva y visual: o bucea en trending (proyectos, no personas) o depende de
que alguien comparta un enlace en otra red.

---

## Usuario objetivo

**El dev que publica:** desarrollador con proyectos públicos en GitHub que quiere un
escaparate curado de lo que construye, sin montarse un portfolio a mano ni mantener otra web.

**El dev que navega:** desarrollador que quiere descubrir proyectos y personas de forma
pasiva — abrir el feed, hacer scroll, seguir a quien le interese. No viene a buscar una
librería concreta; viene a ver qué se está construyendo.

En v1 son el mismo perfil de persona en dos momentos de uso distintos.

---

## Funcionalidades core (MoSCoW)

### MUST

- **[M-01] Login con GitHub** — Dado un visitante sin sesión, cuando completa el login con su
  cuenta de GitHub, entonces tiene sesión iniciada y un perfil creado (o recuperado) asociado a
  su usuario de GitHub.
  *Negativo:* dado un fallo o cancelación del OAuth, cuando vuelve a la app, entonces sigue sin
  sesión y no se crea ningún perfil a medias.

- **[M-02] Selección manual de repos** — Dado un usuario autenticado, cuando abre la pantalla
  de importación, entonces ve la lista de sus repos públicos (vía API de GitHub) y puede marcar
  cuáles importar, hasta el límite configurado (v1: 5).
  *Negativo:* dado que ya tiene el límite alcanzado, cuando intenta añadir otro, entonces ve el
  límite indicado y el repo no se importa. No existe importación automática masiva.

- **[M-03] Gestión de la selección después del onboarding** — Dado un usuario con repos ya
  importados, cuando añade o quita repos de su selección desde su perfil, entonces el cambio se
  refleja en su perfil y en el feed (los quitados dejan de aparecer).

- **[M-04] Ficha visual generada** — Dado un repo importado, cuando se genera su ficha, entonces
  la imagen (fondo + nombre + descripción corta) se renderiza con `@vercel/og` sobre un fondo
  procedural determinista: mismo repo → mismo fondo en cualquier recarga, con paleta anclada al
  color Linguist de su lenguaje dominante. En v1 la generación es 100 % automática, sin
  intervención del usuario.

- **[M-05] Perfil público** — Dado cualquier visitante (con o sin sesión), cuando abre la URL
  del perfil de un usuario, entonces ve su identidad de GitHub y las fichas de sus repos
  seleccionados.

- **[M-06] Feed de scroll infinito** — Dado un usuario en el feed, cuando hace scroll hasta el
  final del contenido cargado, entonces se carga la siguiente página de fichas sin recargar
  la página. El orden es aleatorio estable por visita (cada visita arranca en un punto
  distinto del feed y lo recorre entero sin repetir ni saltar fichas), para que los repos de
  un mismo autor no salgan en bloque — revisado el 2026-08-29, ficha
  `feed-orden-aleatorio.md`; el criterio original era orden cronológico de importación. No
  hay swipe ni botones de like/dislike.

- **[M-07] Follows** — Dado un usuario autenticado viendo un perfil o una ficha, cuando pulsa
  seguir, entonces el autor queda en su lista de seguidos y puede filtrar el feed a "solo
  seguidos".
  *Negativo:* dado que ya lo sigue, cuando pulsa de nuevo, entonces deja de seguirlo.

- **[M-08] Sincronización por webhooks** — Dado un repo importado, cuando en GitHub recibe un
  `push`, cambia sus stars (`watch`) o se borra / pasa a privado (`repository`), entonces
  Snapstack actualiza sus datos, y en el caso de borrado o paso a privado el repo desaparece
  del feed y del perfil — sin contenido fantasma. La suscripción a webhooks cubre solo los
  repos seleccionados, no toda la cuenta.

- **[M-09] Instrumentación de señales implícitas** — Dado un usuario navegando el feed, cuando
  permanece sobre una tarjeta, expande una ficha, hace click hacia el repo o sigue al autor,
  entonces el evento queda registrado con tipo, repo y timestamp. Solo registro: ningún ranking
  se construye sobre estas señales en v1.

- **[M-10] Semilla de contenido** — Dado el feed en el momento del lanzamiento, cuando hay pocos
  usuarios registrados, entonces contiene fichas de repos públicos trending importados sin
  requerir login de sus autores, distinguibles internamente de los repos reclamados por un
  usuario.

- **[M-11] Borrado de cuenta** — Dado un usuario que se da de baja, cuando confirma el borrado,
  entonces su perfil, sus repos importados y sus datos asociados se eliminan por completo (no
  desactivación) y dejan de aparecer en el feed.

### SHOULD

- **[S-01] Moderación ligera** — Dado que nombres y descripciones de repos son texto de terceros
  redistribuido, cuando una ficha entra al sistema pasa un filtro básico de contenido, y cuando
  un usuario pulsa reportar en una ficha, entonces el reporte queda registrado para revisión.
  No es un sistema completo de moderación.

### COULD

- **[C-01] Similitud entre repos por embeddings** — Dado un repo, cuando se consulta "repos de
  stack similar", entonces la similitud sale de embeddings de README/topics (pgvector), no de
  interacciones de usuarios.

- **[C-02] Control manual del fondo al importar** — Dado un usuario importando un repo, cuando
  la generación del fondo lo ofrezca, entonces puede regenerar o elegir entre variantes.
  Pendiente de decidir si entra algo de esto en v1 o queda 100 % automático.

- **[C-03] Perfil enriquecido** — Dado un usuario en Settings, cuando guarda un tagline
  (≤ 80), una bio (≤ 280) o enlaces a otras redes (lista blanca: X, LinkedIn, YouTube,
  Reddit, Substack, Twitch, Bluesky, Mastodon, web personal), entonces su perfil público los
  muestra — tagline bajo el nombre, bio bajo la cabecera, enlaces como fila de iconos — y
  cualquier URL fuera de la lista blanca o que no sea https se rechaza en servidor. Todo
  opcional; vaciar un campo lo elimina. Añadido el 2026-08-29 (ficha
  `perfil-enriquecido.md`); de momento solo visible en el perfil, no en tarjetas ni feed.

- **[C-04] Notificaciones in-app de nuevos seguidores** — Dado un usuario con sesión, cuando
  otro dev le sigue, entonces aparece una notificación en `/notifications` y un contador de no
  leídas en la navegación; abrir la página lo marca todo como leído. Volver a seguir tras
  dejar de seguir no notifica de nuevo. Sin emails ni push. Añadido el 2026-08-29 (ficha
  `notificaciones-follows.md`); la actividad de repos seguidos y el silenciado granular
  quedan para una feature posterior sobre esta base.

- **[C-05] Página de detalle del repo** — Dado cualquier repo activo del feed (con dueño o
  semilla), cuando se visita `/r/<owner>/<repo>` (o se pulsa el título de su tarjeta),
  entonces se ve la ficha en grande con stats, autor con Follow, enlace a GitHub (que emite
  `click_repo`) y el README renderizado de forma segura: sin HTML crudo interpretado, enlaces
  e imágenes relativos reescritos al repo en GitHub, esquemas peligrosos anulados y tope de
  tamaño. El README se cachea al importar o con `pnpm backfill:readmes`; un repo inexistente
  o retirado da 404. Añadido el 2026-08-29 (ficha `detalle-repo.md`; era MEJORA-03).

- **[C-06] Suscripción a los cambios de un repo** — Dado un usuario con sesión en la página
  de detalle, cuando pulsa "Subscribe to changes", entonces cada push a ese repo (con la
  GitHub App instalada) le genera una notificación con el número de commits y enlace directo
  al diff en GitHub; los pushes sobre una notificación no leída se acumulan en ella en vez de
  apilarse, y el mismo botón cancela la suscripción. Construido el 2026-08-29 (ficha
  `suscripcion-a-repos.md`).

- **[C-07] Estrella real desde snapstack** — Dado un usuario con sesión en la página de
  detalle, cuando pulsa la estrella, entonces se da (o quita) la estrella real en GitHub en
  su nombre, vía token user-to-server de la GitHub App limitado al permiso *Starring* (nunca
  scopes anchos); la primera vez se pide autorizar la App y se vuelve al repo. Los tokens se
  guardan cifrados (AES-256-GCM). Sin la App configurada en el entorno, el contador queda
  pasivo. En las tarjetas, la estrella enlaza al detalle. Construido el 2026-08-29 (ficha
  `estrella-real.md`; era MEJORA-02); su verificación de flujo exige configurar la App.

- **[C-08] Instalación guiada de la GitHub App** — Dado un usuario con la App sin instalar,
  cuando está en la selección de repos (onboarding o settings), entonces un aviso con botón
  le lleva a instalarla; la instalación queda registrada en su perfil (por el webhook
  `installation` y por el Setup URL, que además guarda los tokens de C-07 si la App pide
  autorización durante la instalación) y el aviso desaparece. Instalar no es obligatorio:
  sin App, los datos se quedan como en el import. Construido el 2026-08-29 (ficha
  `instalacion-guiada.md`).

- **[C-09] Notas ancladas a un repo** — Dado un usuario con sesión, cuando escribe una nota
  (texto ≤ 500) y elige obligatoriamente uno de sus repos activos, entonces la nota aparece en
  su perfil bajo ese repo, en la página de detalle del repo y en el feed, y genera notificación
  a quien esté suscrito a ese repo (misma vía que C-06). El autor puede borrar su nota. **No
  existe la nota sin repo**: el repo es el ancla que distingue snapstack de un microblog.
  Acordada el 2026-08-31 (ficha `notas-de-repo.md`).

- **[C-10] Imagen en una nota** — Dado un usuario escribiendo una nota, cuando adjunta una
  imagen (una sola, PNG/JPEG/WebP, ≤ 5 MB), entonces se almacena en Supabase Storage y se
  muestra dentro de la nota en perfil, detalle y feed. El tipo y el tamaño se validan en
  servidor, no solo en el navegador. Sin imagen la nota sigue siendo válida.
  Acordada el 2026-08-31 (ficha `notas-de-repo.md`).

- **[C-11] El feed como línea de tiempo mixta** — Dado cualquier visitante del feed, cuando
  carga, entonces ve fichas de repo y notas en la misma lista, ordenada por recencia de
  actividad en lugar de por el orden barajado actual, con paginación por cursor sobre ese
  orden. La selección de repos deja de ser un destino de la navegación principal y pasa a
  Settings. Absorbe MEJORA-01. Acordada el 2026-08-31 (ficha `notas-de-repo.md`).

### WON'T (esta versión)

- Swipe o señal explícita de like/dislike sobre tarjetas.
- Algoritmo de recomendación (sobre señales implícitas o cualquier otra base). Sin volumen de
  datos, cualquier ranking "inteligente" temprano es sobreingeniería.
- Importación automática masiva de todos los repos públicos del usuario.
- Fetch en vivo o capturas (screenshots) de las URLs de demo de los repos.
- Personalización de fichas vía servidor MCP (feature futura; evaluar solo con tracción de v1).

---

## Flujos de usuario principales

Descritos en detalle en `user-flows.md`. Narrativamente:

**Onboarding:** el visitante entra en snapstack.sh, hace login con GitHub, ve la lista de sus
repos públicos, selecciona hasta 5, y su perfil queda publicado con las fichas generadas.

**Navegación:** el usuario abre el feed, hace scroll infinito sobre fichas visuales en orden
aleatorio estable, expande las que le interesan, salta al repo en GitHub o sigue al autor, y puede
cambiar a la vista de "solo seguidos".

**Mantenimiento del perfil:** en cualquier momento el usuario añade o quita repos de su
selección; GitHub mantiene el resto al día vía webhooks.

**Baja:** el usuario borra su cuenta y todo su contenido desaparece del sistema.

---

## Requisitos no funcionales

- **Rendimiento del feed:** streaming con App Router; imágenes de ficha cacheables por CDN
  (generación en el edge, sin colas de captura).
- **Coste acotado:** el límite de repos por perfil acota la sincronización y la generación de
  fichas. El límite debe poder cambiarse por configuración sin rehacer el flujo de importación.
- **Términos de la API de GitHub:** revisar los GitHub API Terms antes de escalar — límites de
  tiempo de caché sin re-sincronizar y prohibición de aparentar respaldo de GitHub.
- **SEO:** los perfiles públicos deben ser indexables (server-rendered).
- **Privacidad del contenido:** un repo borrado o vuelto privado en GitHub desaparece de
  Snapstack vía webhook (ver M-08); el borrado de cuenta es destructivo real (ver M-11).

---

## Fuera de alcance (explícito)

- Todo lo listado en WON'T.
- Monetización: no hay modelo de negocio en v1 (por eso este proyecto no tiene `business.md`).
- Cualquier solapamiento con el directorio de repos en español de Pol: proyectos separados.
