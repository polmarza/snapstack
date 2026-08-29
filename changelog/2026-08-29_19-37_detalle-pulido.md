# Pulido del detalle: acciones, stats del dueño y limpieza del README

**Fecha:** ver nombre del archivo
**Tipo:** UI / Fix
**Requisitos:** Extiende C-05, C-06 y C-07 (feedback de Pol tras el despliegue)

## Qué se hizo

- **Detalle reestructurado en dos secciones tipo markdown:** (1) el dueño con avatar,
  username y sus números (repos, estrellas totales, followers, following) y el botón Follow
  a la derecha; (2) el nombre del repo en grande con la botonera: **View on GitHub** en color
  primario, **Clone** (copia `git clone <url>.git` al portapapeles con confirmación) y la
  suscripción. Los clicks quedan de testigo a la derecha.
- **Follow visible también sin sesión** (salvo en tus propios repos): el click abre el modal
  de login de Clerk (`anonPrompt` en FollowButton).
- **El botón de suscripción dice lo que hará:** "Unsubscribe" cuando estás suscrito (antes
  repetía "Subscribed to changes" en gris y no invitaba a nada).
- **Limpieza estandarizada del README:** además de los nodos HTML, se eliminan los párrafos
  que quedan vacíos y las líneas divisorias (`---`) colgantes de cabecera — la raya huérfana
  que quedaba sobre el primer título cuando el banner original se eliminaba.
- **og:url** añadida a la home (aviso del validador de Meta). `fb:app_id` no aplica: no somos
  una app de Facebook; ese aviso puede ignorarse.

## Nota sobre la estrella "que no hace nada"

No es un bug del código: el botón solo se monta cuando el servidor ve
`GITHUB_APP_CLIENT_ID`/`SECRET` (interruptor de C-07). Vercel solo inyecta variables nuevas
en el siguiente deploy, y `.env.local` las carga al arrancar el dev server.
