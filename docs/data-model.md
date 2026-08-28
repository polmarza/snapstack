# Modelo de datos

<!-- Actualizar este archivo cada vez que se añada, modifique o elimine una tabla o relación.
     El agente de codificación debe consultar este archivo antes de hacer cualquier migración. -->

---

## Entidades principales

### profiles
Usuario de Snapstack, vinculado a su identidad de Clerk/GitHub.
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid (PK) | Identificador interno |
| clerk_id | text (único) | ID del usuario en Clerk |
| github_id | bigint (único) | ID numérico del usuario en GitHub |
| username | text (único) | Login de GitHub, usado en la URL del perfil |
| display_name | text | Nombre visible |
| avatar_url | text | Avatar de GitHub |
| created_at | timestamptz | Alta |

### repos
Repositorio importado al feed. `owner_profile_id` es NULL en los repos semilla (trending
importados sin login del autor); si el autor se registra después, el repo puede reclamarse.
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid (PK) | Identificador interno |
| github_repo_id | bigint (único) | ID del repo en GitHub (estable ante renombrados) |
| owner_profile_id | uuid (FK → profiles, nullable) | Quién lo tiene en su selección; NULL = semilla |
| full_name | text | `owner/nombre` en GitHub |
| description | text | Descripción corta |
| url | text | URL del repo en GitHub |
| primary_language | text | Lenguaje dominante (por bytes) |
| languages | jsonb | Desglose de lenguajes por bytes (GraphQL `languages`) |
| topics | text[] | `repositoryTopics` declarados por el autor |
| stars | integer | Contador de stars, actualizado por webhook `watch` |
| card_seed | text | Semilla determinista del fondo (hash de github_repo_id) |
| status | text | `active` / `removed` (borrado o privado en GitHub, ver webhook `repository`) |
| is_seed | boolean | true si entró por el import de trending |
| imported_at | timestamptz | Cuándo entró a la selección |
| last_synced_at | timestamptz | Última sincronización con GitHub |

El límite de repos activos por perfil (v1: 5) vive en configuración, no en el esquema, para
poder ajustarlo sin migración. Se valida en la capa de aplicación al importar.

### follows
| Campo | Tipo | Descripción |
|-------|------|-------------|
| follower_id | uuid (FK → profiles) | Quién sigue |
| followed_id | uuid (FK → profiles) | A quién |
| created_at | timestamptz | Cuándo |

PK compuesta (`follower_id`, `followed_id`). Un usuario no puede seguirse a sí mismo (check).

### signals
Señales implícitas del feed. Solo instrumentación en v1: ningún ranking las consume.
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid (PK) | — |
| profile_id | uuid (FK → profiles, nullable) | NULL si el visitante no tiene sesión |
| repo_id | uuid (FK → repos) | Ficha sobre la que ocurre |
| type | text | `dwell` / `expand` / `click_repo` / `follow_author` |
| value | integer (nullable) | ms de permanencia en `dwell`; NULL en el resto |
| created_at | timestamptz | — |

### reports
Reportes de moderación ligera (S-01).
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid (PK) | — |
| reporter_id | uuid (FK → profiles) | Quién reporta |
| repo_id | uuid (FK → repos) | Ficha reportada |
| reason | text | Motivo libre |
| status | text | `open` / `resolved` / `dismissed` |
| created_at | timestamptz | — |

### repo_embeddings (futura, C-01)
Embeddings de README/topics por repo (pgvector) para similitud de stack. No se crea en v1;
queda documentada para que el diseño del resto del esquema no la impida.

---

## Relaciones entre entidades

```mermaid
erDiagram
  profiles ||--o{ repos : "selecciona (owner_profile_id)"
  profiles ||--o{ follows : "sigue"
  profiles ||--o{ follows : "es seguido"
  profiles ||--o{ signals : "emite"
  repos ||--o{ signals : "recibe"
  profiles ||--o{ reports : "reporta"
  repos ||--o{ reports : "es reportado"
```

---

## Políticas de acceso (RLS)

El acceso a datos pasa por el servidor Next.js (service role); RLS actúa como segunda línea.

### profiles
- SELECT: público (los perfiles son públicos).
- UPDATE / DELETE: solo el propio usuario. El borrado de cuenta (M-11) elimina en cascada
  repos, follows, signals y reports del usuario.

### repos
- SELECT: público solo si `status = 'active'`.
- INSERT / UPDATE / DELETE: solo el dueño (o el sistema para semillas y webhooks).

### follows
- SELECT: público. INSERT / DELETE: solo como `follower_id` el propio usuario.

### signals
- INSERT: cualquier sesión (o anónimo vía servidor). SELECT: solo sistema — no se exponen.

### reports
- INSERT: usuarios autenticados. SELECT: solo sistema.

---

## Migraciones

| Fecha | Archivo | Descripción |
|-------|---------|-------------|
| — | — | Ninguna aplicada todavía |

---

## Datos seed

Import de repos públicos trending (M-10) para que el feed no arranque vacío: job en
Inngest/Trigger.dev que crea filas en `repos` con `is_seed = true` y `owner_profile_id = NULL`.
El script y su cadencia se documentarán aquí al implementarlo.
