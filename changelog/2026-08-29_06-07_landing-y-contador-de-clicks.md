# Landing para visitantes y contador de clicks en la tarjeta

**Fecha:** 2026-08-29 06:07
**Tipo:** Feature
**Requisitos:** Ninguno nuevo (usa las señales de M-09)

## Qué se hizo

### Contador de clicks visible (migración 007)

La tarjeta muestra los clicks reales que ha recibido el repo, a la izquierda de "View on
GitHub". El dato ya se recogía desde M-09 (señal `click_repo`); lo que faltaba era enseñarlo.

Decisión: **contador desnormalizado en `repos.click_count`**, no un recuento sobre `signals`
en cada lectura. El feed pinta el número en todas las tarjetas de cada página, y agregar una
tabla que crece sin techo en cada carga es el camino corto al problema de rendimiento. El
incremento va por función SQL (`increment_repo_clicks`) para que la suma ocurra dentro de la
base: leer-sumar-escribir desde el servidor perdería clicks simultáneos. La migración rellena
el contador con las señales ya registradas, así que no se pierde el histórico.

Si el incremento fallara, la señal ya está guardada y el contador se puede recalcular desde
`signals`: la fuente de verdad sigue siendo la tabla de señales.

### Landing para visitantes sin sesión

La home cambia según quién mire; el feed no:

- **Marca grande y centrada** con dos líneas de texto aspiracional ("Your best work, worth
  showing off") y el botón de entrar debajo, en tamaño grande.
- **La donación desaparece para visitantes**: a quien todavía no conoce el producto solo le
  distrae. Se mantiene con sesión, donde tiene sentido.
- La cabecera de visitante (marca + entrar) se oculta **solo en la home**, porque allí lo
  cubre el héroe; en un perfil, por ejemplo, sigue estando.

Verificado: 99/99 unit, 21/21 e2e, build y lint en verde. En vivo: el contador de
`project-template` pasó de 4 a 5 al ejecutar los e2e, y el valor coincide exactamente con las
filas `click_repo` de la base — es decir, el incremento funciona, no es un recuento al vuelo.

## Qué se modificó

- Nuevo: `supabase/migrations/007_repo_click_count.sql`,
  `src/components/shell/hide-on-home.tsx`
- Actualizado: `src/lib/db/signals.ts` (incremento por RPC), `src/lib/db/repos.ts` (tipo),
  `src/components/feed/repo-card.tsx` (contador), `src/components/shell/app-shell.tsx`
  (cabecera según sesión), `src/components/auth/auth-controls.tsx` (tamaño grande),
  `src/app/(feed)/page.tsx` (héroe), `e2e/smoke.spec.ts`, `docs/data-model.md`

## Por qué

Enseñar los clicks le da al dev un motivo para volver: ver si su trabajo interesa. Y la landing
separa dos públicos que hasta ahora veían lo mismo — quien llega de nuevas necesita entender
para qué sirve esto antes que un botón de donar.
