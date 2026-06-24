-- 0013_chat_eliminar.sql
-- Borrado de mensajes del chat estilo WhatsApp: para mí, para todos, y conversación. Idempotente.

alter table public.mensajes_chat add column if not exists oculto_para uuid[] not null default '{}';
alter table public.mensajes_chat add column if not exists eliminado_todos boolean not null default false;

-- Eliminar para mí: lo oculta solo de mi vista (el otro lo sigue viendo).
create or replace function public.chat_eliminar_para_mi(p_msg uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.mensajes_chat
  set oculto_para = array_append(oculto_para, auth.uid())
  where id = p_msg
    and (de = auth.uid() or para = auth.uid())
    and not (auth.uid() = any(oculto_para));
end; $$;
grant execute on function public.chat_eliminar_para_mi(uuid) to authenticated;

-- Eliminar para todos: solo mis propios mensajes; deja una marca y borra el contenido.
create or replace function public.chat_eliminar_para_todos(p_msg uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.mensajes_chat
  set eliminado_todos = true, texto = null, imagen_url = null
  where id = p_msg and de = auth.uid();
end; $$;
grant execute on function public.chat_eliminar_para_todos(uuid) to authenticated;

-- Eliminar conversación: oculta de mi vista todos los mensajes con esa persona.
create or replace function public.chat_eliminar_conversacion(p_otro uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.mensajes_chat
  set oculto_para = array_append(oculto_para, auth.uid())
  where ((de = auth.uid() and para = p_otro) or (de = p_otro and para = auth.uid()))
    and not (auth.uid() = any(oculto_para));
end; $$;
grant execute on function public.chat_eliminar_conversacion(uuid) to authenticated;

-- Contactos: ignora lo oculto para mí y muestra marca si fue eliminado para todos.
create or replace function public.chat_contactos()
returns table (id uuid, nombre text, rol text, no_leidos bigint, ultimo text, ultimo_en timestamptz)
language sql security definer stable set search_path = public as $$
  select u.id, coalesce(nullif(u.nombre, ''), u.correo) as nombre, u.rol::text,
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
