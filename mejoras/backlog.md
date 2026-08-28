# Backlog de mejoras

<!-- Ideas de mejora que no entran en el sprint actual pero que no queremos perder.
     No es un compromiso, es un repositorio de ideas.
     Añadir una entrada cada vez que surja una idea durante el desarrollo. -->

---

## Formato de entrada

```
### [MEJORA-XX] Título de la idea
**Área:** Frontend / Backend / UX / Infraestructura / Negocio
**Prioridad estimada:** Alta / Media / Baja
**Origen:** De dónde salió la idea (conversación, feedback de usuario, etc.)

Descripción breve de la mejora y por qué aportaría valor.
```

---

### [MEJORA-01] Orden del feed por última actividad del repo
**Área:** Backend / UX
**Prioridad estimada:** Media
**Origen:** Idea de Pol durante el acuerdo de M-06 (2026-08-29)

Que un `push` o un PR mergeado en un repo importado actualice un `last_activity_at` (vía los
webhooks de la GitHub App, M-08, añadiendo el evento `pull_request`) y el feed ordene por ese
campo: los repos vivos resurgen. Sigue siendo orden cronológico, no recomendación — compatible
con la decisión de v1. A resolver al implementarlo: cooldown para que un repo con commits
constantes no monopolice el inicio del feed (p. ej., resurgir máximo una vez al día), y qué
pasa con los repos semilla, que no tienen webhooks (¿refresco periódico del script de seed?).
Decidir al construir M-08. El cursor de paginación de M-06 ya queda parametrizado para que el
cambio de campo de orden sea barato.
