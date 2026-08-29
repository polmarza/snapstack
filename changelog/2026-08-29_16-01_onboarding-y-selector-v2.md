# Onboarding automático y selector de repos rediseñado

**Fecha:** ver nombre del archivo
**Tipo:** Feature
**Requisitos:** Cierra el punto abierto de la ficha de M-02 (redirección al onboarding)

## Qué se hizo

Del estreno de Pol como primer usuario de producción salieron cuatro mejoras:

- **El usuario nuevo aterriza en `/onboarding`** en vez de en el feed. La ficha de M-02 lo
  dejó como "pendiente de decidir"; decidido. Mecánica: `profiles.onboarded_at` (migración
  008, con relleno para quien ya tenía repos) — NULL → la home redirige; guardar la selección
  o pulsar **"Skip for now"** la fija. Sin la marca no se podía distinguir "acaba de llegar"
  de "eligió no importar nada", y sin el skip habría bucle. El redirect vive fuera del
  try/catch (la trampa de Next de siempre).
- **Selector rediseñado**: el degradado procedural ocupa **toda la tarjeta** (más opaco al
  elegirla), el check pasa a un círculo limpio en la esquina, y la tarjeta entera es clicable.
- **Avisos con jerarquía**: el texto largo de "sin descripción" aparece **una vez**, en un
  banner arriba (solo si algún repo lo necesita); cada tarjeta muestra solo `⚠ No description`.
- **Lenguaje manual para repos sin detección** (una skill en Markdown, p. ej.): campo con
  autocompletado sobre el catálogo Linguist completo (`<datalist>`, 692 entradas). El servidor
  solo acepta lenguajes del catálogo y **solo cuando GitHub no detectó ninguno** — la
  detección real nunca se pisa. Funciona al importar y también sobre repos ya importados. El
  campo vive fuera del `<label>` para que escribir no alterne la selección. Nota: la elección
  colorea la ficha al instante (el fondo depende del lenguaje).

Además, tres remates visuales del mismo repaso: la marca del hero **vuelve a blanco**; se
añade el **logo en la cabecera y en la barra lateral** — el cuadrado verde del favicon con las
capas *recortadas por máscara SVG*: el trazo es un agujero real y por la silueta se ve lo que
haya detrás; y las **tarjetas del hero suben de presencia** (opacidad 30→50 y velo más ligero),
que en móvil apenas se veían.

Y la **og:image de la home replica el hero, congelado** (`/api/og/home`): la misma retícula
de mini-fichas procedurales con desfases verticales que imitan la deriva, velo y marca
centrada. Semillas fijas → determinista → cacheable por CDN. Lección de Satori por el camino:
no soporta el atajo `inset`, los cuatro offsets van explícitos o el velo colapsa.

Verificado: 99/99 unit, 21/21 e2e, build y lint en verde. El flujo con sesión (redirección,
skip, lenguaje manual) queda para el repaso de Pol — requiere sus credenciales.

## ⚠️ Despliegue

**La migración 008 debe aplicarse en producción ANTES de redesplegar este código**: sin la
columna, todos los usuarios quedarían redirigidos al onboarding en bucle y guardar fallaría.
Aplicada en local; la de producción se lanza con el OK de Pol.

## Qué se modificó

- Nuevo: `supabase/migrations/008_profiles_onboarded.sql`, `src/app/onboarding/actions.ts`
- Actualizado: `src/app/(feed)/page.tsx` (redirección), `src/app/settings/repos/actions.ts`
  (onboarded_at + overrides de lenguaje), `src/components/selection/` (selector y skip),
  `src/lib/db/profiles.ts` (tipo), `docs/data-model.md`
