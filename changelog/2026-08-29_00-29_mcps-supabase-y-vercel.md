# Configuración de los MCPs de Supabase y Vercel

**Fecha:** 2026-08-29 00:29
**Tipo:** Configuración
**Requisitos:** Ninguno (tooling del agente, no funcionalidad del producto)

## Qué se hizo

Se registraron los servidores MCP oficiales de Supabase y Vercel con alcance de proyecto
(`.mcp.json`, commiteado). Ambos son remotos HTTP con autenticación OAuth (`/mcp`), así que no
hay ninguna credencial en el repo ni en variables de entorno.

- supabase → `https://mcp.supabase.com/mcp` (fuente: supabase.com/docs/guides/getting-started/mcp)
- vercel → `https://mcp.vercel.com` (fuente: vercel.com/docs/agent-resources/vercel-mcp)

## Qué se modificó

- `.mcp.json` — creado con los dos servidores
- `docs/architecture.md` — tabla "MCPs del proyecto" rellenada
- `.env.example` — nota de la sección MCP actualizada (OAuth, sin claves)

## Por qué

Elegidos por Pol tras la inicialización, según el "Protocolo de MCPs": operar la base de datos
y los despliegues del stack directamente desde el agente en lugar de trabajar a ciegas. Alcance
de proyecto para que cualquier clon del repo los herede; la primera apertura del repo pedirá
aprobarlos y autenticarse con `/mcp`.
