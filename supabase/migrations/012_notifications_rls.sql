-- Corrige la omisión de la migración 010: notifications sin RLS dejaba la
-- tabla legible y escribible con la clave anónima (que viaja en el cliente).
-- RLS sin políticas, como signals y reports: las notificaciones son privadas
-- y solo el service role (que se salta RLS) las toca, siempre desde servidor.
alter table public.notifications enable row level security;
