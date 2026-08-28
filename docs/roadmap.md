# Roadmap

<!-- Planificación de fases de desarrollo. No es un calendario con fechas exactas,
     sino una guía de prioridades.
     Actualizar cuando algo pase de una fase a otra, o cuando se redefinan las prioridades. -->

---

## Fase 1 — MVP

Todo lo marcado MUST en `prd.md`:

- [ ] M-01 Login con GitHub (Clerk)
- [ ] M-02 Selección manual de repos con límite (v1: 5, configurable)
- [ ] M-03 Gestión de la selección después del onboarding
- [ ] M-04 Ficha visual generada (fondo procedural determinista + `@vercel/og`)
- [ ] M-05 Perfil público
- [ ] M-06 Feed de scroll infinito cronológico
- [ ] M-07 Follows y filtro "solo seguidos"
- [ ] M-08 Sincronización por webhooks (GitHub App: `push`, `watch`, `repository`)
- [ ] M-09 Instrumentación de señales implícitas (sin ranking encima)
- [ ] M-10 Semilla de contenido: import de repos trending
- [ ] M-11 Borrado de cuenta completo
- [ ] S-01 Moderación ligera (filtro básico + reporte) — entra en Fase 1 si no retrasa el
      lanzamiento; si no, primera cosa de Fase 2

**Objetivo de validación:** comprobar que el modelo perfil + feed genera uso pasivo recurrente
(gente que vuelve a hacer scroll y sigue a devs) y que los devs se molestan en curar su
selección. Las señales implícitas registradas dirán qué se mira y qué se ignora.

---

## Fase 2 — Mejora sobre validación

No planificar en detalle hasta terminar la Fase 1. Candidatos:

- [ ] C-02 Control manual del fondo al importar (elegir/regenerar variantes)
- [ ] C-01 Similitud entre repos por embeddings (pgvector sobre README/topics)
- [ ] Reclamación de repos semilla por sus autores al registrarse
- [ ] Mejoras de feed guiadas por las señales implícitas acumuladas (qué mostrar, no ranking
      algorítmico todavía)

---

## Fase 3 — Escalado

Solo si la v1 tiene tracción:

- [ ] Servidor MCP de personalización de fichas (`regenerate_background`, `set_palette`,
      `preview_card`) con OAuth por usuario y escritura limitada al propio perfil. Doble
      valor: producto + contenido demo para newsletter/canal
- [ ] Revisión de GitHub API Terms y estrategia de re-sincronización a escala
- [ ] Ranking del feed basado en señales, si el volumen de datos lo justifica

---

## Descartado (con motivo)

| Funcionalidad | Motivo del descarte |
|---------------|---------------------|
| Swipe / like-dislike tinder-style | Es el modelo de GitHubba/gitinder; Snapstack es perfil + feed, intención social pasiva |
| Importación automática masiva de repos | Los repos de relleno (ejercicios, forks) bajan la calidad percibida del perfil |
| Screenshots / fetch en vivo de demos | Sobreingeniería: cola de jobs, riesgo SSRF, coste de headless, y solo cubre repos con demo desplegada |
| Algoritmo de recomendación en v1 | Sin señal explícita ni volumen de datos, cualquier ranking temprano es sobreingeniería |
