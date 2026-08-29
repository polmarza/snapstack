# Roadmap

<!-- Planificación de fases de desarrollo. No es un calendario con fechas exactas,
     sino una guía de prioridades.
     Actualizar cuando algo pase de una fase a otra, o cuando se redefinan las prioridades. -->

---

## Fase 1 — MVP

Todo lo marcado MUST en `prd.md`:

- [x] M-01 Login con GitHub (Clerk)
- [x] M-02 Selección manual de repos con límite (v1: 5, configurable)
- [x] M-03 Gestión de la selección después del onboarding
- [x] M-04 Ficha visual generada (fondo procedural determinista + `@vercel/og`)
- [x] M-05 Perfil público
- [x] M-06 Feed de scroll infinito cronológico
- [x] M-07 Follows y filtro "solo seguidos" (follow nativo de Snapstack, no espejo de GitHub)
- [x] M-08 Sincronización por webhooks (endpoint hecho; la GitHub App se crea al desplegar)
- [x] M-09 Instrumentación de señales implícitas (sin ranking encima)
- [x] M-10 Semilla de contenido: import de repos trending
- [x] M-11 Borrado de cuenta completo
- [x] S-01 Moderación ligera (filtro básico + reporte)

**Objetivo de validación:** comprobar que el modelo perfil + feed genera uso pasivo recurrente
(gente que vuelve a hacer scroll y sigue a devs) y que los devs se molestan en curar su
selección. Las señales implícitas registradas dirán qué se mira y qué se ignora.

---

## Fase 2 — Mejora sobre validación

No planificar en detalle hasta terminar la Fase 1. Candidatos:

- [ ] C-02 Control manual del fondo al importar (elegir/regenerar variantes)
- [x] C-03 Perfil enriquecido: tagline, bio y enlaces sociales (2026-08-29)
- [x] C-04 Notificaciones in-app de nuevos seguidores (2026-08-29)
- [x] C-05 Página de detalle del repo con README (2026-08-29)
- [x] C-06 Suscripción a los cambios de un repo, con notificación por push (2026-08-29)
- [x] C-07 Estrella real desde snapstack vía GitHub App (2026-08-29; flujo pendiente de configurar la App)
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
