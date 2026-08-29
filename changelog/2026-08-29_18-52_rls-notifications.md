# Seguridad: RLS activado en notifications

**Fecha:** ver nombre del archivo
**Tipo:** Migración (fix de seguridad)
**Requisitos:** Corrige una omisión de C-04

## Qué se hizo

La migración 010 creó `notifications` sin activar RLS — todas las demás tablas lo activan en
su propia migración. Sin RLS, la clave anónima (pública por diseño en el cliente) permitía
leer y escribir la tabla entera vía PostgREST. La migración 012 lo activa sin políticas,
como `signals` y `reports`: las notificaciones son privadas y solo las toca el service role
desde el servidor. Detectado por el linter de Supabase ("RLS Disabled in Public"), avisado
por Pol. Aplicada en local y en producción; verificado `relrowsecurity = true`.

## Ventana de exposición

Desde el deploy de C-04 hasta hoy (mismo día). En ese tramo la tabla solo contenía
notificaciones de prueba; no hay indicios de acceso, pero el dato expuesto habría sido
"quién sigue a quién", que ya es público en los perfiles.
