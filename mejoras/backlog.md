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

## Plan de "que la app esté viva" (acordado el 2026-08-30)

El feed es contemplativo: funciona con la novedad, no sostiene la vuelta. Estas entradas no
son ideas sueltas, son **una secuencia** — cada paso quita el riesgo del anterior:

1. **[MEJORA-09] Notas por repo**, como eventos con fecha. Es la pieza que las demás necesitan.
2. **[MEJORA-10] Cosechar releases y PRs** + **[MEJORA-12] bandeja de publicación**, que son
   las dos mitades del mismo paso: una recoge candidatos, la otra es donde su dueño decide
   qué sale. Quita el riesgo de que MEJORA-09 nazca con la línea de tiempo vacía, sin
   publicar nada que no se haya elegido.
3. **[MEJORA-01] Orden del feed por última nota** (revisada: por nota, no por commit). Cierra
   el bucle — publican, te avisan, vuelves, hay algo distinto.
4. **C-01 del PRD** (similitud por embeddings): "repos parecidos a este". Ya no es descubrir
   qué hay, es encontrar a quien está en tu mismo problema. La materia prima —los READMEs
   cacheados— llegó con C-05.
5. **[MEJORA-11] Comentarios en las notas.** El último a propósito, y con moderación antes.

Fuera de la secuencia, dos ideas sobre issues que salieron el mismo día: **[MEJORA-13]** los
`help wanted` como invitación (no publicar el flujo de issues, que es una lista de lo roto) y
**[MEJORA-14]** abrir un issue desde snapstack. Ambas dependen de permisos nuevos de la App,
así que conviene decidirlas a la vez que los demás permisos y pedirlos de una tacada.

**Antes que todo esto está la distribución.** Con 6 usuarios (2026-08-30) y la publicación en
LinkedIn prevista para la semana siguiente, mirar qué hace la gente que entre dará más
información que cualquiera de estos pasos. El plan asume ese orden: primero gente, luego bucle.

**Qué mirar para saber si funcionó:** cuántos vuelven en los 7 días siguientes a recibir una
notificación, y qué porcentaje de avisos acaba en clic. Con la tabla `signals` y Vercel
Analytics se responde sin instrumentar nada nuevo.

### [MEJORA-01] Orden del feed por última nota publicada
**Área:** Backend / UX
**Prioridad estimada:** Alta — paso 3 del plan
**Origen:** Idea de Pol durante el acuerdo de M-06 (2026-08-29); revisada el 2026-08-30

**Revisión (2026-08-30):** ordenar por *última nota*, no por último commit. Una nota es una
decisión editorial de su autor; un commit es ruido — un push de "fix typo" no merece la
portada. Sigue sin ser ranking: es cronología de lo publicado, compatible con la decisión de
v1. El cursor de M-06 ya tiene el campo de orden parametrizado en un solo sitio, así que el
cambio es barato. Mantener el cooldown para que un repo muy activo no monopolice el inicio.

Descripción original:

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

### [MEJORA-08] Apartado de actividad (commits y PRs) en el detalle
**Área:** Producto / Backend
**Prioridad estimada:** Baja — revisar tras MEJORA-10, que se come buena parte de su valor
(una línea de tiempo de notas dice más que una lista de commits)
**Origen:** Idea de Pol al pedir las suscripciones a repos (2026-08-29)

Bajo el README del detalle, una lista de la actividad reciente del repo: commits (del payload
del webhook `push`) y PRs (exige añadir el evento `pull_request` y el permiso *Pull requests:
read* a la GitHub App). Necesita tabla propia (`repo_events`) porque hoy no se almacena
ningún evento, solo se actualiza el estado del repo. Con la ficha `suscripcion-a-repos.md`
hecha, la notificación podría enlazar aquí en vez de a GitHub.

### [MEJORA-09] Notas por repo: la ficha gana una línea de tiempo
**Área:** Producto / Backend / Frontend
**Prioridad estimada:** Alta — paso 1 del plan
**Origen:** Idea de Pol, conversación del 2026-08-30 sobre retención

Cada repo puede acumular **notas cortas con fecha**: *"esto es lo que he montado esta semana
y por qué"*. Tabla propia (`repo_notes`), **no un campo del repo**: la diferencia es que un
campo se sobrescribe y un evento acumula historia. Cuerpo breve (¿500 caracteres?), fecha y
enlace opcional a un commit, PR o release.

Qué desbloquea:
- La página de detalle pasa de card + README a card + **línea de tiempo** + README.
- Una nota es un aviso que merece la pena para los suscriptores de C-06 — hoy reciben
  "3 commits", que es peor contenido. Reutiliza el tipo genérico de `notifications` (C-04).
- El feed puede mostrar "repo + su última nota", que es lo que permite que un repo reaparezca
  legítimamente sin inventar un algoritmo (ver MEJORA-01).

No rompe nada de lo decidido: siguen siendo 5 repos y sigue sin haber rachas ni likes. La
curaduría se mantiene; solo se le añade tiempo.

**El riesgo, anotado:** una línea de tiempo vacía comunica peor que no tenerla. Escribir es la
conducta de una minoría (ver MEJORA-10, que existe justo para eso). A decidir al construirlo:
si las notas son públicas siempre, si admiten edición o borrado, y si una nota sin repo
—una nota "de perfil"— tiene sentido o confunde el modelo.

### [MEJORA-10] Cosechar releases y PRs como borradores de nota
**Área:** Backend
**Prioridad estimada:** Alta — paso 2 del plan, junto con MEJORA-12
**Origen:** Conversación del 2026-08-30: cómo evitar que MEJORA-09 nazca vacía

**No pedir que escriban más: recoger lo que ya escriben a propósito.** Las release notes son
una publicación deliberada, redactada para lectores; la descripción de un PR mergeado, casi.

**Importante (decisión de Pol, 2026-08-30): esto cosecha candidatos, no publica.** Lo único
que se importa solo es el repo con sus datos; todo lo demás espera a que su dueño diga que
sí, en la bandeja de MEJORA-12. Dos vías de cosecha:

- **Repos con la App instalada**: el evento `release` (hay que suscribirlo en la GitHub App,
  hoy solo tenemos `push`, `star`, `repository`, `installation`).
- **Semillas**: un job manual tipo `pnpm backfill:readmes`, con `GITHUB_TOKEN`, que recoja las
  releases de los repos semilla. Es lo que permite que **el feed esté vivo sin un solo usuario
  escribiendo** — las ~30 semillas de trending publican constantemente.

A decidir: si la nota se publica sola o queda como borrador que el dueño aprueba (para el
dueño, aprobar es una conducta mucho más común que redactar); qué pasa con las releases sin
texto; y cómo se marca visualmente que una nota es automática y no escrita a mano.

### [MEJORA-11] Comentarios en las notas (no en los repos)
**Área:** Producto / Backend / Moderación
**Prioridad estimada:** Media — paso 5 del plan, el último a propósito
**Origen:** Idea de Pol, conversación del 2026-08-30

Comentar **la nota**, no el repo. La nota es una publicación y las publicaciones tienen
respuestas; el repo es el artefacto. Así:

- No competimos con issues y discussions de GitHub, que es donde viven las propuestas
  técnicas. Un "¿has pensado en X?" colgado de nuestra ficha es un issue en el sitio
  equivocado, y le añade ruido al mantenedor sin que lo haya pedido.
- El comentario nace con contexto y fecha, no colgando de un repo entero.

**El coste real, anotado antes de empezar:** los comentarios convierten a Pol en moderador
para siempre. Antes de abrirlos hacen falta bloqueo de usuarios, límite de frecuencia y
tiempo semanal reservado — el filtro de S-01 y la tabla `reports` no bastan para texto libre
de terceros. Y el problema de la sala vacía: una caja de comentarios en silencio comunica
peor que no tenerla, así que solo tiene sentido cuando ya haya notas y gente.

### [MEJORA-12] Bandeja de publicación: ver de un vistazo qué se puede publicar
**Área:** Producto / Frontend / Backend
**Prioridad estimada:** Alta — paso 2 del plan, es la cara visible de MEJORA-10
**Origen:** Idea de Pol, conversación del 2026-08-30

Una pantalla propia donde el usuario ve **todo lo suyo que es susceptible de publicarse** —
releases, PRs mergeados, quizá issues— y decide, uno a uno, qué va a su perfil y qué no. La
regla que la gobierna, dicha por Pol: **nada se publica solo salvo el repo con su
información**; el resto es siempre un acto explícito.

Diseño a resolver al construirla:

- **Tres estados por candidato**: pendiente, publicado, descartado. El descarte importa tanto
  como el publicar: sin él, el mismo PR pregunta para siempre.
- **Editable antes de publicar.** Si el borrador se puede recortar o reescribir, la bandeja
  deja de ser sindicación y pasa a ser trabajo editorial — que es justo lo que hace que las
  notas tengan valor.
- **Control de volumen.** Un repo con cuarenta PRs a la semana inunda la bandeja. Por defecto:
  releases sí, prereleases y borradores no, PRs solo con descripción de cierta longitud.
- **De dónde salen los candidatos**: por webhook para repos con la App instalada (permite el
  aviso "tienes 3 cosas por publicar") o pidiéndolos a la API al abrir la pantalla (nada que
  guardar de lo que aún no se ha decidido publicar). Probablemente lo primero con lo segundo
  de reserva; decidir con la privacidad en mente, porque guardar borradores es guardar cosas
  que su autor todavía no ha elegido enseñar.
- **Es un motivo para volver, del bueno**: "3 cosas listas para publicar" habla de tu propio
  trabajo, no de rachas ni de puntos.

**Sobre el "botoncito en GitHub"** que Pol planteaba: GitHub no deja añadir botones propios a
su interfaz, así que nativo no existe. Las alternativas, de peor a mejor:

1. *Extensión de navegador* que lo inyecte: mantener una por navegador y pedir que la
   instalen, para llegar a poquísima gente. No compensa.
2. *GitHub Action* que el dev añade a su repo y llama a snapstack al publicar una release. Es
   idiomático para devs, pero exige un YAML y un secreto en su repo.
3. **El botón ya existe y es "Publish release".** Con el webhook, el gesto que el dev ya hace
   en GitHub deja el borrador esperando en la bandeja. No hace falta inventar nada.
4. Y si se quiere marcar desde GitHub qué publicar sin entrar aquí: una **convención**, como
   una etiqueta `snapstack` en el PR o una línea en el cuerpo de la release. Cero fricción,
   usa costumbres que los devs ya tienen (etiquetas, trailers) y no depende de extensiones.

### [MEJORA-13] Issues con `help wanted` como invitación, no como quejas
**Área:** Producto / Backend
**Prioridad estimada:** Media
**Origen:** Conversación del 2026-08-30 sobre qué contenido de GitHub merece publicarse

Publicar el flujo de issues de alguien sería un error: para el de fuera casi todo es ruido,
es una lista de lo que está roto —justo lo contrario de "tu mejor trabajo, digno de presumir"—
y además suele ser *lo que otros dicen* sobre su trabajo, no lo que su autor eligió enseñar.

Pero los issues etiquetados **`help wanted` / `good first issue` son otra cosa: son
invitaciones, y las puso el propio mantenedor.** El consentimiento viene incorporado en la
etiqueta. En la ficha podrían aparecer como *"busca ayuda con 3 cosas"*, y el feed dejaría de
ser solo para mirar: sería para engancharse a algo.

Coste a tener en cuenta: exige el permiso *Issues: read* en la GitHub App, y **añadir un
permiso obliga a re-aprobar a todos los que ya la instalaron** (lección de C-07).

### [MEJORA-14] "Propón una mejora": abrir un issue desde snapstack
**Área:** Producto / Backend
**Prioridad estimada:** Media
**Origen:** Idea de Pol (feedback y propuestas de mejora), conversación del 2026-08-30

Un botón en la ficha que abre un issue **en GitHub**, con la cuenta del visitante. Es la mejor
versión de "poder aportar feedback":

- La conversación técnica se queda donde el mantenedor trabaja: no fragmentamos ni le añadimos
  un buzón que no pidió, y no competimos con issues ni discussions.
- snapstack pasa de escaparate a **rampa de entrada a la contribución**: descubres el proyecto
  y en un clic ya has aportado.
- Reutiliza la infraestructura del starring (C-07): token de usuario de la App, autorización
  una sola vez.

A resolver: permiso *Issues: write* (con el mismo coste de re-aprobación que MEJORA-13);
plantilla mínima para que no se convierta en un canal de mensajes vagos; y qué pasa con los
repos semilla, que no tienen dueño aquí.

### [MEJORA-15] Notas de otros en vivo, sin recargar
**Área:** Frontend
**Prioridad estimada:** Baja
**Origen:** Pol, 2026-08-31, al probar C-09 ("o bien una actualización tipo realtime")

Al publicar **tu** nota ya no hace falta recargar: el compositor refresca el servidor y la lista
se resincroniza. Lo que sigue exigiendo recarga es enterarte de la nota de **otro** mientras
tienes el feed abierto.

Supabase Realtime lo daría suscribiéndose a los `INSERT` de `notes`. Lo que hay que decidir antes
de construirlo no es técnico: **un feed que se mueve solo es un feed que no puedes leer**. Lo
sensato es no inyectar nada y mostrar un aviso discreto arriba ("3 new notes") que el lector pulsa
cuando quiere — que es lo que hacen los que funcionan.

Baja prioridad a propósito: con el volumen actual, nadie tiene el feed abierto a la vez que otro
publica. Cuando eso pase, será señal de que el producto va bien y toca hacerlo.
