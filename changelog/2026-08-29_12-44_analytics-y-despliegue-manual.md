# Vercel Analytics y despliegues manuales

**Fecha:** ver nombre del archivo
**Tipo:** Configuración
**Requisitos:** Ninguno nuevo

## Qué se hizo

- **Vercel Web Analytics** conectado en el layout (`@vercel/analytics/next`). Sin cookies y sin
  banner de consentimiento, a diferencia de Google Analytics. Solo emite en despliegues de
  Vercel; en local no hace nada. Cubre lo que nuestras señales propias no ven: de dónde viene
  la gente. Límite del plan Hobby: 2.500 eventos al mes.
- **Despliegues automáticos desactivados** (`vercel.json` con `git.deploymentEnabled: false`),
  por decisión de Pol: quiere elegir el momento de cada publicación. Ni un push ni un merge a
  `main` publican; se despliega a mano con `pnpm dlx vercel --prod`, desde el panel o con un
  deploy hook. La configuración surte efecto **después del primer despliegue**.
- `docs/deploy.md` y `docs/architecture.md` corregidos: decían que "merge a main publica", que
  ya no es cierto.

Verificado: 99/99 unit, build y lint en verde. **Los e2e no se han ejecutado**: Docker no
estaba arrancado y el Supabase local no levanta sin él.

## Qué se modificó

- Nuevo: `vercel.json`
- Actualizado: `src/app/layout.tsx`, `package.json` (`@vercel/analytics`), `docs/deploy.md`,
  `docs/architecture.md`
