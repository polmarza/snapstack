# La og:image vuelve a existir (y se recaptura)

**Fecha:** ver nombre del archivo
**Tipo:** Fix
**Requisitos:** Ninguno

## El fallo

`https://snapstack.sh/og-home.png` devolvía **404**: un commit del 2026-08-29 renombró
`public/og-home.png` a `public/og-home-new.png`, y el metadato de la home sigue apuntando a
`/og-home.png`. Con la portada rota, snapstack.sh se pegaba en Slack, X o LinkedIn como un
enlace pelado.

## Qué se hizo

- Recaptura del hero con el estado actual de la landing (1712×898, recortada al borde del
  marquee) para `.github/assets/hero.png` — la cabecera del README — y su versión 1200×630
  en `public/og-home.png`, que es la que el metadato busca.
- Queda pendiente decidir qué hacer con `public/og-home-new.png`: es la captura anterior, ya
  sin referencias.
