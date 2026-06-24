-- 0014_mi_cuenta.sql
-- Perfil personal: foto, fecha de nacimiento, teléfono. Cada quien edita SOLO lo suyo
-- (sin poder cambiar rol/estado/permisos). Idempotente.

alter table public.usuarios add column if not exists avatar_url text;
alter table public.usuarios add column if not exists fecha_nacimiento date;
alter table public.usuarios add column if not exists telefono text;

-- Editar el propio perfil: solo campos permitidos.
create or replace function public.actualizar_mi_perfil(
  p_nombre text, p_avatar text, p_nacimiento date, p_telefono text
) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.usuarios set
    nombre = coalesce(nullif(p_nombre, ''), nombre),
    avatar_url = p_avatar,
    fecha_nacimiento = p_nacimiento,
    telefono = p_telefono
  where id = auth.uid();
end; $$;
grant execute on function public.actualizar_mi_perfil(text, text, date, text) to authenticated;

-- Bucket de avatares (público para mostrar la foto).
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_subir" on storage.objects;
create policy "avatars_subir" on storage.objects for insert to authenticated with check (bucket_id = 'avatars');
drop policy if exists "avatars_actualizar" on storage.objects;
create policy "avatars_actualizar" on storage.objects for update to authenticated using (bucket_id = 'avatars');
drop policy if exists "avatars_ver" on storage.objects;
create policy "avatars_ver" on storage.objects for select using (bucket_id = 'avatars');

-- Mostrar el avatar en los contactos del chat.
drop function if exists public.chat_contactos();
create function public.chat_contactos()
returns table (id uuid, nombre text, rol text, avatar text, no_leidos bigint, ultimo text, ultimo_en timestamptz)
language sql security definer stable set search_path = public as $$
  select u.id, coalesce(nullif(u.nombre, ''), u.correo) as nombre, u.rol::text, u.avatar_url as avatar,
    (select count(*) from public.mensajes_chat m
       where m.de = u.id and m.para = auth.uid() and m.leido = false
         and not (auth.uid() = any(m.oculto_para))) as no_leidos,
    (select case when m.eliminado_todos then '🚫 Mensaje eliminado'
         else coalesce(nullif(m.texto, ''), case when m.imagen_url is not null then '📷 Foto' else '' end) end
       from public.mensajes_chat m
       where ((m.de = u.id and m.para = auth.uid()) or (m.de = auth.uid() and m.para = u.id))
         and not (auth.uid() = any(m.oculto_para))
       order by m.creado_en desc limit 1) as ultimo,
    (select m.creado_en from public.mensajes_chat m
       where ((m.de = u.id and m.para = auth.uid()) or (m.de = auth.uid() and m.para = u.id))
         and not (auth.uid() = any(m.oculto_para))
       order by m.creado_en desc limit 1) as ultimo_en
  from public.usuarios u
  where u.id <> auth.uid()
    and u.estado = 'activo'
    and coalesce(u.tipo, '') <> 'proveedor';
$$;
grant execute on function public.chat_contactos() to authenticated;
