# Selección manual de repos e importación

**Estado:** Verificada
**Requisitos que cierra:** M-02, M-03
**Fecha de acuerdo:** 2026-08-29

## Qué se construye

Tras el login, el usuario pasa por `/onboarding`: la lista de sus repos públicos de GitHub
(nombre, descripción, lenguaje, stars) con selección por checkbox y contador `n / 5`. Al
confirmar, los seleccionados se importan a su perfil: datos frescos vía GraphQL de GitHub
(`languages` por bytes, `repositoryTopics`, descripción, stars) y ficha visual inmediata en el
feed, con `owner_profile_id` apuntando a su perfil e `is_seed = false`.

La misma pantalla de selección vive en `/settings/repos` para después del onboarding (M-03):
añadir hasta el límite y quitar (el repo pasa a `status = 'removed'` y desaparece de feed y
perfil). El límite (v1: 5) sale de `REPO_SELECTION_LIMIT` y se valida en servidor — la UI solo
lo refleja.

Si un repo que el usuario importa ya existía como semilla del trending, se **reclama**: misma
fila (`github_repo_id`), ahora con dueño.

## Decisiones tomadas

- **La importación usa el token OAuth del propio usuario, obtenido vía Clerk** — no la GitHub
  App. Motivo: para listar e importar bajo demanda, el token del usuario da 5.000 req/h *por
  usuario* (escala sola) y evita montar la App y su instalación ahora. La GitHub App llega con
  M-08, donde es imprescindible (webhooks). El razonamiento del PRD contra OAuth (rate limit
  agregado) aplica a sync continua, no a un import puntual de ≤5 repos.
  *Riesgo conocido:* si la instancia dev de Clerk con credenciales compartidas no expone el
  access token, el plan B es configurar credenciales OAuth propias en Clerk (una OAuth App de
  GitHub, paso de dashboard de Pol). Se comprueba al empezar.
- **Importación inline en una server action, sin Inngest/Trigger.dev.** Con el límite en 5
  repos son ≤6 llamadas GraphQL: segundos, no minutos. El job runner entra cuando haya un
  import que de verdad no quepa en una request.
- **Solo repos públicos y sin forks propios en la lista** (el fork sin cambios era el ejemplo
  canónico de ruido en el PRD). Si algún día se quieren forks, se discute entonces.
- **Quitar no borra la fila**: `status = 'removed'` (la ficha ya no sale en feed/perfil, y
  volver a añadirlo lo reactiva sin perder historial). El borrado real llega con M-11.
- **Rutas protegidas**: `/onboarding` y `/settings/repos` exigen sesión (redirigen a login).

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| M-02 | `src/lib/github/`, `src/app/onboarding/`, server action de importación, `src/lib/db/repos.ts` | `src/lib/github/user-repos.test.ts`, `src/lib/db/selection.test.ts`, `e2e/onboarding.spec.ts` |
| M-03 | `src/app/settings/repos/`, misma lógica de selección | `src/lib/db/selection.test.ts`, `e2e/onboarding.spec.ts` |

Unitarios (GitHub y db mockeados): mapeo GraphQL → fila (`languages` por bytes, topics,
`is_seed = false`, dueño), límite de 5 en servidor (el sexto se rechaza — negativo de M-02),
no duplicar por `github_repo_id`, reclamar una semilla existente, quitar → `removed` y
re-añadir → reactivar. E2e contra localhost: sin sesión, `/onboarding` y `/settings/repos`
redirigen al login. El flujo autenticado completo (listar los repos reales de Pol, importar,
verlos en el feed, quitar uno) se valida manualmente y queda anotado en el PR — automatizar
sesión de Clerk en e2e (`@clerk/testing`) queda para cuando haya más flujos con sesión.

## Fuera de esta feature

- GitHub App, webhooks y sincronización continua (M-08): lo importado se queda como está hasta
  entonces (o hasta re-importar).
- Página de perfil público (M-05): los repos importados se ven en el feed; el perfil llega
  después.
- El paso automático del onboarding tras el primer login (redirigir al usuario nuevo a
  `/onboarding` nada más entrar): se hace aquí solo el enlace desde la cabecera; la
  redirección forzosa se decide con M-05.
- Borrado de cuenta (M-11) y señales (M-09).
