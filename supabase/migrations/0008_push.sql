-- 0008_push.sql
-- Suscripciones de notificaciones push + disparador que llama al servicio de envío
-- cuando se crea una notificación (funciona con la app cerrada). Idempotente.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  creado_en timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
drop policy if exists "push_propio" on public.push_subscriptions;
create policy "push_propio" on public.push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Extensión para hacer llamadas HTTP desde la base
create extension if not exists pg_net;

-- Al crear una notificación, avisar al servicio de envío de push
create or replace function public.enviar_push()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://amt-agroindustria.vercel.app/api/push/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', 'b054c0fe58c17d2fc319c8190664ab17ca16b48d5e16bdea'
    ),
    body := jsonb_build_object('mensaje', new.mensaje)
  );
  return new;
end; $$;

drop trigger if exists al_enviar_push on public.notificaciones;
create trigger al_enviar_push after insert on public.notificaciones
  for each row execute function public.enviar_push();
