# Despliegue a producción

Procedimiento de la primera salida a producción de Snapstack (`snapstack.sh`).

**Quién ejecuta qué.** Los pasos de dashboard y los que tocan servicios remotos los hace
**Pol**; el agente prepara, explica y deja listo, pero no publica ni ejecuta nada contra
máquinas que no sean la local (ver "Límites de ejecución" en `CLAUDE.md`). Cada comando de
esta guía se enseña antes de ejecutarse y se confirma en el momento.

El orden importa: cada bloque depende del anterior.

---

## 1. Supabase (producción)

El proyecto remoto ya existe; falta el esquema.

1. **Aplicar las migraciones** (6 archivos, `001` a `006`). Con `DATABASE_URL` en `.env.local`
   apuntando al proyecto remoto:

   ```bash
   supabase db push --db-url "$DATABASE_URL"
   ```

   Alternativa sin CLI, migración a migración con `psql`:

   ```bash
   for f in supabase/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
   ```

   > **Aplicadas el 2026-08-29 con el bucle de `psql`** (7 migraciones, `001` a `007`), no con
   > `supabase db push`: el CLI espera nombres con marca de tiempo y los nuestros son `001_…`.
   > Consecuencia: `supabase_migrations.schema_migrations` no las registra, así que las
   > siguientes migraciones se aplican por el mismo camino. Un `db push` a ciegas intentaría
   > recrearlo todo y fallaría (que es un fallo seguro, no destructivo).
   >
   > Nota de conexión: la cadena **directa** (`db.<ref>.supabase.co`) solo publica IPv6 y no
   > sirve desde redes sin IPv6. Hay que usar la del **Session pooler**
   > (`…pooler.supabase.com:5432`), que va por IPv4.

2. **Comprobar** que están las tablas y sus políticas:

   ```bash
   psql "$DATABASE_URL" -c "\dt public.*"
   psql "$DATABASE_URL" -c "select tablename, rowsecurity from pg_tables where schemaname='public'"
   ```

   Esperado: `repos`, `profiles`, `signals`, `reports`, `follows` con RLS activada.

3. **No copiar datos del local.** El perfil `test-demo-dev` y los repos semilla de desarrollo
   se quedan en local. Producción arranca vacía y se siembra en el paso 5.

---

## 2. Clerk (instancia de producción)

La instancia de desarrollo usa credenciales OAuth compartidas de Clerk; producción necesita
las tuyas.

1. En el dashboard de Clerk, crear la **instancia de producción** de la aplicación.
2. En su conector de GitHub, **usar credenciales propias**: hay que crear una *OAuth App* en
   GitHub (Settings → Developer settings → OAuth Apps) con el callback que indique Clerk, y
   pegar Client ID y Client Secret en Clerk.
3. Configurar el dominio `snapstack.sh` en Clerk y añadir los registros DNS que pida
   (Clerk los lista; van en el proveedor del dominio).
4. Anotar las claves de producción (`pk_live_…`, `sk_live_…`) para el paso 4.

> **Las claves de producción no van a `.env.local`.** Sólo funcionan desde el dominio de
> producción: en localhost Clerk las rechaza ("Production Keys are only allowed for domain
> …"). Su sitio es Vercel, y sólo en el entorno **Production**.
>
> Para tener las dos a la vez sin pisarse, se usan los entornos de Vercel: **Production** con
> las `pk_live_/sk_live_`, y **Preview** (y Development) con las mismas de desarrollo que hay
> en `.env.local`. Así cada rama desplegada de prueba entra con la instancia de dev y nadie
> crea usuarios reales sin querer.
>
> Si alguna vez hiciera falta probar producción desde la máquina local, la única vía es mapear
> un subdominio del dominio real al equipo y servir por HTTPS en el puerto 443; para el uso
> normal no compensa: se prueba sobre el sitio desplegado.

---

## 3. GitHub App (webhooks)

El endpoint `/api/webhooks/github` ya está hecho y probado; la App es quien le entrega los
eventos, y necesita una URL pública, por eso va después del primer deploy (paso 4). Checklist
completo en `architecture.md` → "GitHub App"; en resumen:

1. Crear la App: Settings → Developer settings → GitHub Apps → New.
   - Webhook URL: `https://snapstack.sh/api/webhooks/github`
   - Webhook secret: **generar uno nuevo** (`openssl rand -hex 24`), distinto del de dev.
   - Permisos: *Contents* read-only y *Metadata* read-only. Nada de escritura.
   - Eventos: `push`, `star`, `repository`.
2. Guardar el secret como `GITHUB_WEBHOOK_SECRET` en Vercel (paso 4).
3. La pantalla de selección enlaza la instalación (C-08, `InstallAppBanner`): cada usuario
   instala la App **solo en los repos que ha seleccionado**. Con "Request user authorization
   during installation" y el Setup URL (`/api/github/setup`), instalar deja también
   autorizada la estrella (C-07) en el mismo viaje.

> Con la App creada se desbloquea **MEJORA-02** (dar estrella desde Snapstack), que necesita
> el permiso fine-grained *Starring: write* y un token de usuario de la App.

---

## 4. Vercel

1. Importar el repositorio `polmarza/snapstack` en Vercel.
2. **Variables de entorno** (Production). `NEXT_PUBLIC_*` se inlinean en el build: tienen que
   estar puestas **antes** del primer deploy, o el build sale con los valores por defecto.

   | Variable | De dónde sale |
   |---|---|
   | `NEXT_PUBLIC_APP_URL` | `https://snapstack.sh` |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (secreta) |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk producción (`pk_live_…`) |
   | `CLERK_SECRET_KEY` | Clerk producción (`sk_live_…`) |
   | `GITHUB_WEBHOOK_SECRET` | El generado en el paso 3 |
   | `REPO_SELECTION_LIMIT` | `5` |

   `DATABASE_URL` **no** hace falta en Vercel: solo se usa para aplicar migraciones desde la
   máquina de Pol.

3. Añadir el dominio `snapstack.sh` y sus DNS.
4. Desplegar. **Los despliegues automáticos están desactivados**: `vercel.json` lleva
   `git.deploymentEnabled: false`, así que un push o un merge a `main` **no publica nada**.
   Se despliega a mano, de una de estas formas:

   ```bash
   pnpm dlx vercel --prod
   ```

   …o desde el panel de Vercel (Deployments → Redeploy), o con un Deploy Hook.

   Aviso: la configuración solo surte efecto **después del primer despliegue**, que sí puede
   dispararse solo. A partir de ahí, silencio.
5. Comprobar después del deploy:

   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://snapstack.sh/
   curl -s -o /dev/null -w "%{http_code}\n" https://snapstack.sh/dev/cards   # debe ser 404
   curl -s https://snapstack.sh/robots.txt
   ```

---

## 5. Sembrar contenido

Con el esquema aplicado y las variables del remoto en `.env.local`
(`SUPABASE_REMOTE_URL`, `SUPABASE_REMOTE_SERVICE_ROLE_KEY`):

```bash
pnpm seed:trending --remote
```

El flag `--remote` es obligatorio a propósito: sembrar producción es una decisión, no un
descuido. Cadencia: manual, cuando se quiera refrescar. Un repo ya curado por un usuario no
vuelve a semilla.

---

## 6. Comprobación final

- [ ] La home carga y muestra fichas
- [ ] Login con GitHub funciona (instancia de producción de Clerk)
- [ ] Importar un repo propio funciona; importar el de otro se rechaza
- [ ] El perfil público `/u/<tu-usuario>` carga y su og:image se ve al compartir el enlace
- [ ] `/dev/cards` y `/dev/seed` devuelven 404
- [ ] Dar una estrella a un repo importado actualiza el contador (webhook de la App)

---

## Notas

- **Rollback:** en Vercel, "Promote to Production" sobre el deployment anterior. Las
  migraciones no se revierten solas: si una migración rompe algo, se escribe la migración
  inversa.
- **Rate limiting (Upstash):** sigue pendiente. Los endpoints públicos que mutan estado
  (`/api/signals`, reportes, follows) aguantarán el tráfico inicial, pero es lo primero a
  añadir si el proyecto recibe atención.
- **Términos de la API de GitHub:** revisar antes de escalar (caché de datos, no aparentar
  respaldo de GitHub). Anotado también en el PRD.
