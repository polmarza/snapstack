# Apoyo al proyecto: GitHub Sponsors dentro de la app y un botón para colaborar

**Fecha:** ver nombre del archivo
**Tipo:** UI
**Requisitos:** Ninguno

## Qué se hizo

- Los tres enlaces de apoyo pasan a vivir juntos en `support-links.tsx`, con la misma forma
  (icono, etiqueta y flecha) y dos pesos visuales: sólido para lo principal, contorno para lo
  secundario.
- **Dentro de la app** (barra lateral de desktop y cabecera de móvil), el botón de donación deja
  de ir a Buy Me a Coffee y va a **GitHub Sponsors**.
- **En la barra lateral**, encima del de patrocinio, entra **"Contribute"**: enlaza al repo de
  snapstack.
- **En el footer** —que es sobre todo lo que se lee en la landing— conviven las dos vías:
  "Sponsor on GitHub" con color y "Buy me a coffee" en contorno.
- `.github/FUNDING.yml` nuevo, con las dos mismas vías, para que el repo enseñe su propio botón
  de patrocinio.
- La respuesta del FAQ sobre el precio ya no habla de "un botón de donar": menciona patrocinar y
  contribuir.

## Qué se modificó

- `src/components/shell/support-links.tsx` (nuevo, sustituye a `donate-button.tsx`)
- `src/components/shell/app-nav.tsx`, `app-shell.tsx`, `site-footer.tsx`
- `src/components/landing/faq.tsx`
- `e2e/smoke.spec.ts` (el test del footer comprueba ahora las dos vías)
- `.github/FUNDING.yml` (nuevo)

## Por qué

Decisión de Pol. A quien ya está dentro de la app se le ha pedido entrar con GitHub: para esa
persona Sponsors es la vía sin fricción —no hay que registrarse en nada nuevo— y además el dinero
queda asociado al perfil desde el que se publica. En la landing, en cambio, entra gente sin cuenta
de GitHub, así que ahí se ofrecen las dos.

"Contribute" responde a la otra mitad: snapstack es público desde el primer commit, y hasta ahora
la única petición que hacía la app era de dinero. Para un dev, abrir el repo es una petición más
fácil de aceptar que la cartera — por eso va encima.
