# Donación y favicon con la identidad de marca

**Fecha:** 2026-08-29 05:48
**Tipo:** Feature
**Requisitos:** Ninguno nuevo

## Qué se hizo

- **El botón de donación adopta la identidad del sitio**: fondo verde de marca (`#34D399`, el
  mismo del favicon) con icono y texto oscuros encima. Taza y texto a la izquierda y flecha a
  la derecha, que en la barra lateral (ancho completo) queda pegada al borde.
- **El favicon pasa a ser el icono `layers` de lucide**, recreado como SVG dentro del
  `ImageResponse` para no meter binarios en el repo: capas apiladas oscuras sobre el verde de
  marca. Sustituye a las tres barras dibujadas a mano.

Verificado: 99/99 unit, 21/21 e2e, build y lint en verde; botón y favicon comprobados en el
navegador (el favicon se renderiza como PNG 32×32).

## El contador de apoyos: por qué no vuelve

El corazón con el número real que traía la imagen de Buy Me a Coffee **no se puede recuperar
en un botón propio**: esa cifra la pinta su button-api dentro de la imagen, y consultarla por
separado exige su API autenticada (token personal de la cuenta) más una caché para no pedirla
en cada carga. Es viable, pero es una integración de verdad para mostrar un número; queda como
decisión de Pol si algún día compensa. Mientras tanto, la flecha ocupa ese lugar.

## Qué se modificó

- `src/components/shell/donate-button.tsx`, `src/app/icon.tsx`
