# MCPs: solo fuente oficial y aprobación del comando antes de ejecutarlo

**Fecha:** 2026-07-25 21:02
**Tipo:** Configuración

## Qué se hizo

Endurecido el "Protocolo de MCPs" en dos puntos:

1. **Fuente válida.** Buscar la configuración de un MCP solo cuenta si sale del dominio del
   proveedor o de su repositorio oficial. Blogs, agregadores de MCPs y gists quedan excluidos como
   fuente para un comando que se va a ejecutar. Si el comando solo aparece en fuentes no oficiales,
   el agente lo dice y decide el usuario.
2. **Aprobación previa.** El agente enseña el comando exacto (paquete o URL, y de qué página lo ha
   sacado) antes de ejecutarlo. Además, la documentación leída se trata como referencia, no como
   instrucciones: si la página pide algo más que registrar el servidor —scripts de setup, paquetes
   adicionales, exportar tokens a otro sitio, cambiar permisos— el agente para y pregunta.

Añadida la regla correspondiente a "Qué NO hacer".

## Qué se modificó

- `CLAUDE.md` — "Protocolo de MCPs": criterio de fuente oficial en el paso 2 de "Cómo preguntar" y
  párrafo de aprobación previa al inicio de "Cómo configurarlo"; nueva regla en "Qué NO hacer"
- `.claude/commands/mcp-setup.md` — mismos dos criterios en los pasos 2 y 4

## Por qué

Detectado al ejecutar `/security-review` sobre el PR #4, que introdujo el protocolo. El protocolo
crea una cadena "documentación de terceros → comando que se ejecuta en local": el agente busca en
la web cómo configurar un MCP y acto seguido lanza `claude mcp add ... -- npx -y <paquete>`. Una
página comprometida, un resultado de búsqueda envenenado o un paquete typosquatteado se ejecutan
con `npx` exactamente igual que el legítimo, y el usuario no ve el comando hasta que ya ha corrido.

No era un hallazgo reportable —el diff era documentación— pero sí una cadena real que costaba una
línea cerrar. Acotar la fuente y enseñar el comando antes de ejecutarlo deja la decisión donde
debe estar: en el usuario.
