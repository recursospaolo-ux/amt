-- 0011_chat.sql
-- Chat interno tipo WhatsApp entre el personal (atiende, cajero, admin), con fotos.
-- Nada se borra. Tiempo real + push al destinatario. Idempotente.

create table if not exists public.mensajes_chat (
  id uuid primary key default gen_random_uuid(),
  de uuid not null,
  para uuid not null,
  texto text,
  imagen_url text,
  leido boolean not null default false,
  creado_en timestamptz not null default now()
);
alter table public.mensajes_chat enable row level security;

drop policy if exists "chat_leer" on public.mensajes_chat;
create policy "chat_leer" on public.mensajes_chat for select
  using (de = auth.uid() or para = auth.uid());

drop policy if exists "chat_enviar" on public.mensajes_chat;
create policy "chat_enviar" on public.mensajes_chat for insert
  with check (de = auth.uid());

drop policy if exists "chat_marcar" on public.mensajes_chat;
create policy "chat_marcar" on public.mensajes_chat for update
  using (para = auth.uid()) with check (para = auth.uid());

-- Tiempo real
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mensajes_chat'
  ) then
    alter publication supabase_realtime add table public.mensajes_chat;
  end if;
end $$;

-- ===== Contactos del chat (personal activo, con no leídos y último mensaje) =====
create or replace function public.chat_contactos()
returns table (id uuid, nombre text, rol text, no_leidos bigint, ultimo text, ultimo_en timestamptz)
language sql security definer stable set search_path = public as $$
  select u.id, coalesce(nullif(u.nombre, ''), u.correo) as nombre, u.rol::text,
    (select count(*) from public.mensajes_chat m
       where m.de = u.id and m.para = auth.uid() and m.leido = false) as no_leidos,
    (select coalesce(nullif(m.texto, ''), case when m.imagen_url is not null then '📷 Foto' else '' end)
       from public.mensajes_chat m
       where (m.de = u.id and m.para = auth.uid()) or (m.de = auth.uid() and m.para = u.id)
       order by m.creado_en desc limit 1) as ultimo,
    (select m.creado_en from public.mensajes_chat m
       where (m.de = u.id and m.para = auth.uid()) or (m.de = auth.uid() and m.para = u.id)
       order by m.creado_en desc limit 1) as ultimo_en
  from public.usuarios u
  where u.id <> auth.uid()
    and u.estado = 'activo'
    and coalesce(u.tipo, '') <> 'proveedor';
$$;
grant execute on function public.chat_contactos() to authenticated;

-- ===== Push al destinatario por cada mensaje =====
create or replace function public.push_chat()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_de text; v_prev text;
begin
  select coalesce(nullif(nombre, ''), correo) into v_de from public.usuarios where id = new.de;
  v_prev := coalesce(nullif(new.texto, ''),
    case when new.imagen_url is not null then '📷 Foto' else 'mensaje' end);
  perform net.http_post(
    url := 'https://amt-agroindustria.vercel.app/api/push/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', 'b054c0fe58c17d2fc319c8190664ab17ca16b48d5e16bdea'
    ),
    body := jsonb_build_object('mensaje', '💬 ' || coalesce(nullif(v_de, ''), 'Mensaje') || ': ' || v_prev, 'para', new.para)
  );
  return new;
end; $$;
drop trigger if exists al_push_chat on public.mensajes_chat;
create trigger al_push_chat after insert on public.mensajes_chat
  for each row execute function public.push_chat();

-- ===== Storage: bucket para fotos del chat =====
insert into storage.buckets (id, name, public)
values ('chat', 'chat', true)
on conflict (id) do nothing;

drop policy if exists "chat_subir" on storage.objects;
create policy "chat_subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat');

drop policy if exists "chat_ver" on storage.objects;
create policy "chat_ver" on storage.objects for select
  using (bucket_id = 'chat');
