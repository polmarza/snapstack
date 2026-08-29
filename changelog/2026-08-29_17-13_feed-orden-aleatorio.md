# Feed en orden aleatorio estable

**Fecha:** ver nombre del archivo
**Tipo:** Feature
**Requisitos:** Revisa M-06 (orden cronológico → aleatorio estable por visita)

## Qué se hizo

- El feed deja el orden cronológico de importación (que mostraba los 5 repos del mismo autor
  en bloque) y pasa a keyset por `(card_seed, id)` descendente: el hash FNV-1a de cada repo es
  una permutación uniforme gratis, sin migraciones.
- Cada visita arranca en una semilla aleatoria y la paginación da la vuelta completa al feed
  hasta cerrar el círculo; dentro de una sesión no se repite ni se salta ninguna ficha.
- Cursor nuevo `{s, t, id, w}` con validación estricta (hex-8/uuid/flag); los cursores del
  formato cronológico anterior devuelven a la primera página.
- **Bug real destapado por el orden nuevo y arreglado:** las manchas del fondo procedural
  (`CardBackgroundLayer`) interceptaban los clicks cuando caían sobre el enlace "View on
  GitHub". Ahora la capa es `pointer-events-none`.
- E2E adaptados: los webhooks buscan en el feed completo (vuelta entera de cursores) y la
  tarjeta con dueño se valida en el perfil, donde siempre las hay.

## Documentación

- `docs/prd.md` (M-06 revisado con fecha), `docs/user-flows.md`, `docs/architecture.md`,
  `README.md`, ficha `docs/features/feed-orden-aleatorio.md` en **Verificada**.
- MEJORA-01 (orden por actividad real) sigue en el backlog como evolución futura.
