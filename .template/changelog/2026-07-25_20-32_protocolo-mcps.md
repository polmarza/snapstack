# Protocolo de MCPs: preguntar alcance al definir el stack

**Fecha:** 2026-07-25 20:32
**Tipo:** Configuración

## Qué se hizo

Nueva sección "Protocolo de MCPs" en `CLAUDE.md`. Con el stack ya decidido (al terminar
`docs/architecture.md`, o cuando entra una integración nueva), el agente pregunta qué servidores
MCP quiere el usuario y con qué alcance. Fuera de esos dos momentos no saca el tema, y en ningún
caso instala servidores por su cuenta.

El flujo, en orden:

1. `claude mcp list` primero, para no proponer lo que ya está configurado.
2. Si no sabe con certeza si un servicio tiene MCP, cómo se llama el paquete, qué transporte usa o
   qué credenciales pide, lo busca en la documentación oficial antes de proponerlo. La regla está
   escrita explícitamente porque un `claude mcp add` inventado deja un servidor que no arranca.
3. Pregunta el alcance por servicio, con una tabla que explica los tres reales de Claude Code:
   `user` (global, `~/.claude.json`), `project` (`.mcp.json`, commiteado, lo hereda el equipo) y
   `local` (privado y solo en este proyecto). Avisa de la precedencia local → proyecto → usuario
   por si pisa algo que el usuario ya tenía.
4. Pide las credenciales por su nombre exacto de variable, una a una. Si el servidor usa OAuth no
   pide nada: lo añade y remite a `/mcp` para autenticar.
5. Configura con `claude mcp add`, dejando la credencial como `${VARIABLE}` en `.mcp.json` y el
   valor real en `.env.local`.
6. Verifica que arranca, documenta en `docs/architecture.md` y registra en `changelog/`.

Comando `/mcp-setup` para lanzarlo a demanda. Se llama así, y no `/mcp`, porque `/mcp` es un
comando nativo de Claude Code (autenticación de servidores remotos) y una skill con ese nombre lo
taparía.

## Qué se modificó

- `CLAUDE.md` — nueva sección "Protocolo de MCPs"; paso 5 del checklist de inicialización; dos
  reglas nuevas en "Qué NO hacer" (no meter claves reales en `.mcp.json`, no instalar MCPs sin
  preguntar); nuevo ejemplo en el protocolo de actualización de docs
- `.claude/commands/mcp-setup.md` — nuevo comando `/mcp-setup`
- `.claude/commands/init-proyecto.md` — paso de MCPs; aclarado que el Protocolo de MCPs sobrevive
  a la inicialización; numeración corregida
- `docs/architecture.md` — nueva sección "MCPs del proyecto" (servidor, alcance, uso, variables)
- `.env.example` — nuevo bloque para credenciales de servidores MCP
- `.gitignore` — `.claude/settings.local.json` ignorado, con nota de que `.mcp.json` sí se commitea
- `README.md` — el protocolo pasa de 5 a 6 pasos con el de MCPs

## Por qué

El stack define qué servicios va a tocar el proyecto, y casi todos (Supabase, Resend, Stripe,
Vercel, Sentry…) publican servidor MCP. Ese es el momento natural para decidirlo, pero hasta ahora
la plantilla no decía nada: o el usuario se acordaba, o el agente trabajaba a ciegas contra
servicios que podría estar consultando directamente.

La parte del alcance no es un detalle: configurar un MCP a nivel global mezcla credenciales de
todos los proyectos, mientras que `.mcp.json` deja la configuración versionada y el equipo la
hereda sin repetir el setup. La plantilla ahora hace la pregunta explícita y, sobre todo, fija que
las claves nunca se escriben en el archivo que se commitea.

## Verificado

Los tres alcances, la precedencia, la sintaxis de `claude mcp add` y la expansión `${VAR}` /
`${VAR:-default}` en `command`, `args`, `env`, `url` y `headers` se contrastaron con la
documentación oficial de Claude Code (https://code.claude.com/docs/en/mcp) al escribir esta
entrada, en lugar de darlos por sabidos.
