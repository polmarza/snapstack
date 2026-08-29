# Backlog de mejoras

<!-- Ideas de mejora que no entran en el sprint actual pero que no queremos perder.
     No es un compromiso, es un repositorio de ideas.
     Añadir una entrada cada vez que surja una idea durante el desarrollo. -->

---

## Formato de entrada

```
### [MEJORA-XX] Título de la idea
**Área:** Frontend / Backend / UX / Infraestructura / Negocio
**Prioridad estimada:** Alta / Media / Baja
**Origen:** De dónde salió la idea (conversación, feedback de usuario, etc.)

Descripción breve de la mejora y por qué aportaría valor.
```

---

### [MEJORA-01] Orden del feed por última actividad del repo
**Área:** Backend / UX
**Prioridad estimada:** Media
**Origen:** Idea de Pol durante el acuerdo de M-06 (2026-08-29)

Que un `push` o un PR mergeado en un repo importado actualice un `last_activity_at` (vía los
webhooks de la GitHub App, M-08, añadiendo el evento `pull_request`) y el feed ordene por ese
campo: los repos vivos resurgen. Sigue siendo orden cronológico, no recomendación — compatible
con la decisión de v1. A resolver al implementarlo: cooldown para que un repo con commits
constantes no monopolice el inicio del feed (p. ej., resurgir máximo una vez al día), y qué
pasa con los repos semilla, que no tienen webhooks (¿refresco periódico del script de seed?).
Decidir al construir M-08. El cursor de paginación de M-06 ya queda parametrizado para que el
cambio de campo de orden sea barato.

### [MEJORA-06] Recuperar el contador de apoyos de Buy Me a Coffee
**Área:** Frontend / Backend
**Prioridad estimada:** Baja (revisar cuando haya bastantes apoyos)
**Origen:** Pol echó de menos el corazón con la cifra al pasar a botón propio (2026-08-29)

La imagen del button-api de Buy Me a Coffee traía un contador de apoyos; al hacer el botón
propio (para poder darle la identidad del sitio) se perdió, porque esa cifra la pinta su
servicio dentro de la imagen y no hay endpoint público para consultarla.

Para recuperarla haría falta: token personal de la cuenta de Buy Me a Coffee en variable de
entorno, llamada a su API autenticada y **caché** de la cifra (nada de pedirla en cada carga).
Es una integración pequeña pero real, con su mantenimiento.

Criterio para retomarlo: cuando el número sume como prueba social. Con pocos apoyos, enseñar
la cifra resta más de lo que aporta.

### [MEJORA-05] Filtro del feed por stack (lenguajes y topics)
**Área:** Frontend / Backend / UX
**Prioridad estimada:** Media (cuando haya volumen de repos)
**Origen:** Idea de Pol sobre el onboarding (2026-08-29); aplazada por él mismo

Pastillas de stack para acotar el feed: las del usuario arriba, otras comunes debajo. **Filtro
explícito, no ranking** — decisión de Pol, y así no toca el WON'T del PRD ("algoritmo de
recomendación sobre señales implícitas o cualquier otra base"): es el usuario quien elige, como
ya hace con la pestaña Following.

Materia prima: **GitHub no da frameworks**. Da lenguajes (Linguist, por bytes) y topics
declarados por el autor — que en la práctica ya contienen `react`, `nextjs`, `django`. Con eso
se arman las pastillas sin inventar un detector; leer `package.json`/`Cargo.toml` sería la
"heurística propia" que el PRD descartó.

Prerrequisito: **enriquecer el seed con el desglose de lenguajes**. Hoy los repos semilla
guardan `languages: {}` porque la Search API solo devuelve el dominante, y son la mayoría del
feed. Se arregla con una consulta GraphQL por lote al sembrar. Ese mismo dato habilita mostrar
los lenguajes secundarios en la ficha (otra idea de Pol de la misma conversación).

El onboarding se queda en dos pasos (login → elegir repos) hasta entonces.

### [MEJORA-02] Dar estrella a un repo desde Snapstack
**Área:** Backend / UX
**Prioridad estimada:** Alta
**Origen:** Idea de Pol tras mergear M-06 (2026-08-29)

Convertir el indicador de estrellas de la tarjeta (arriba a la derecha, contorno sin relleno)
en un botón que dé/quite la estrella real en GitHub. No es un like local (descartado en el
PRD): es la acción de GitHub, así que encaja con el modelo social. Requisitos: M-01 (login) y
un user token de la GitHub App con el permiso fine-grained **"Starring: write"** — no usar el
scope clásico `public_repo`, que es desproporcionado (incluye escritura de código). Reto: saber
el estado starred/no-starred por tarjeta sin batch endpoint (consulta lazy al expandir/hover, o
cache propio + webhook `watch` para reconciliar). Al priorizarla, promover a `docs/prd.md`
como S-02 con su criterio de aceptación.

### [MEJORA-04] Hacer cacheables el feed y los perfiles (rendimiento y SEO)
**Área:** Frontend / Infraestructura
**Prioridad estimada:** Media (sube en cuanto haya tráfico)
**Origen:** Intento fallido durante la preparación de producción (2026-08-29)

Hoy toda página va con `force-dynamic`: cada visita golpea la base de datos y el TTFB entra
directo en las Core Web Vitals. Se intentó ISR (`revalidate = 60`) en los perfiles y **no
funciona tal como está el código**: los componentes cliente de la tarjeta (`FollowButton`,
`ReportButton`) llaman a `useAuth()` durante el render, lo que obliga a Next a renderizar la
ruta bajo demanda; la respuesta sale con `Cache-Control: private, no-store` aunque se declare
`revalidate`. Comprobado con un build de producción real, y no lo arregla sacar la ruta del
matcher del middleware de Clerk.

Lo que haría falta: que esos botones no resuelvan sesión durante el render del servidor —
renderizarlos solo tras montar, o que la página no los incluya y se hidraten aparte
consultando su estado (haría falta un `GET /api/follows?profileId=`). Se descartó hacerlo
ahora por ser cirugía sin beneficio medible antes del lanzamiento. Al retomarlo, medir antes
y después con el build de producción (`curl -D-` sobre `/u/<usuario>`).

### [MEJORA-07] Seguir repos individuales
**Área:** Producto / Backend
**Prioridad estimada:** Media
**Origen:** Idea de Pol al planificar la página de detalle (2026-08-29)

Además de seguir a un dev, poder seguir un repo concreto desde su página de detalle (C-05): un botón "Follow repo" que suscribe solo a la actividad de ese repo. Encaja con
las notificaciones de actividad (punto 6 del feedback) y con su silenciado granular: seguir
un repo y mutear un repo son las dos caras del mismo control fino. A resolver al construirlo:
tabla propia (`repo_follows`) o generalizar `follows` con un tipo; qué emite notificación
(push, release, stars…); y cómo se refleja en el filtro Following del feed (¿los repos
seguidos aparecen aunque no sigas al autor?). La página de detalle ya existe (C-05): construible cuando se quiera.

### [MEJORA-08] Apartado de actividad (commits y PRs) en el detalle
**Área:** Producto / Backend
**Prioridad estimada:** Media
**Origen:** Idea de Pol al pedir las suscripciones a repos (2026-08-29)

Bajo el README del detalle, una lista de la actividad reciente del repo: commits (del payload
del webhook `push`) y PRs (exige añadir el evento `pull_request` y el permiso *Pull requests:
read* a la GitHub App). Necesita tabla propia (`repo_events`) porque hoy no se almacena
ningún evento, solo se actualiza el estado del repo. Con la ficha `suscripcion-a-repos.md`
hecha, la notificación podría enlazar aquí en vez de a GitHub.
