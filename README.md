<h1 align="center">Snapstack</h1>

<p align="center">
  Red social para desarrolladores: conecta tu GitHub, cura una selección de tus repos<br>
  y compártelos como fichas visuales en un feed de scroll infinito.
</p>

<p align="center">
  <a href="./LICENSE"><img alt="Licencia MIT" src="https://img.shields.io/badge/licencia-MIT-blue"></a>
  <img alt="pnpm v11" src="https://img.shields.io/badge/pnpm-v11-f69220">
  <img alt="Estado: en desarrollo" src="https://img.shields.io/badge/estado-en%20desarrollo-yellow">
</p>

---

## ¿Qué es Snapstack?

Cada dev que conecta su cuenta de GitHub obtiene un perfil público con una **selección curada**
de sus repositorios — elige manualmente cuáles enseñar (hasta 5), nada de volcados automáticos.
Cada repo se presenta como una **ficha visual** con fondo generado proceduralmente, anclado a
los colores de su lenguaje dominante. Todo se navega en un **feed de scroll infinito**: sin
swipe, sin like/dislike.

La intención es social y pasiva: seguir a un dev y ver qué construye. A diferencia de las apps
de descubrimiento tinder-style (tarjetas sueltas para deslizar), Snapstack es perfil + feed.

El detalle completo está en [`docs/prd.md`](docs/prd.md).

## ¿Qué problema resuelve?

El perfil de GitHub mezcla lo relevante con ejercicios, forks y pruebas, y no está pensado para
descubrir ni seguir gente. Snapstack da al dev un escaparate curado sin mantener un portfolio, y
a quien navega un sitio donde ver de forma visual qué se está construyendo.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework + hosting | Next.js (App Router) + Vercel |
| Base de datos | Supabase Postgres + pgvector |
| Autenticación | Clerk (provider de GitHub) |
| Sincronización GitHub | GitHub App + webhooks |
| Jobs en background | Inngest o Trigger.dev |
| Fichas visuales | `@vercel/og` (Satori) |
| Cache / rate limiting | Upstash Redis |
| Estilos | Tailwind CSS |

Justificaciones y decisiones técnicas en [`docs/architecture.md`](docs/architecture.md).

## Requisitos previos

- Node.js 20+
- pnpm v11 (`corepack enable`)
- Cuentas: Supabase, Clerk, Vercel, y una GitHub App propia (ver `docs/architecture.md`)

## Variables de entorno

Copia `.env.example` como `.env.local` y rellena los valores. Nunca comitees `.env.local`.

## Instalación y desarrollo

```bash
pnpm install
pnpm dev
```

Tests (siempre contra localhost):

```bash
pnpm test
pnpm test:e2e
```

## Estructura de carpetas

```
docs/            → Documentación viva del proyecto (leer antes de trabajar)
docs/features/   → Una ficha por unidad de trabajo acordada, con su tabla de cobertura
changelog/       → Registro estructurado de cada cambio importante
mejoras/         → Backlog de ideas fuera del sprint actual
scripts/         → verificar-cobertura.mjs: ningún requisito sin validación (corre en CI)
src/             → Código de la app (estructura detallada en docs/architecture.md)
```

## Cómo contribuir

El proyecto sigue el protocolo definido en [`CLAUDE.md`](CLAUDE.md): toda sesión de trabajo
empieza leyendo `docs/`, cada feature se acuerda en una ficha antes de construirse, cada cambio
importante deja entrada en `changelog/`, y los PRs llevan la salida real de los comandos como
evidencia, no casillas marcadas.

## Estado del proyecto

**En desarrollo** — hechas: fichas visuales procedurales (M-04), semilla de repos trending
(M-10) y feed de scroll infinito (M-06). Fase 1 (MVP) definida en
[`docs/roadmap.md`](docs/roadmap.md); el estado de cada feature, en
[`docs/features/`](docs/features/).

## Licencia

MIT © 2026 Pol Marzà. Ver [`LICENSE`](./LICENSE).
