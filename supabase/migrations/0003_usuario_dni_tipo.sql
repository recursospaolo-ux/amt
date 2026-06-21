-- 0003_usuario_dni_tipo.sql
-- Agrega DNI y tipo (proveedor/trabajador) al perfil de usuario y los captura en el registro.
-- Idempotente.

alter table public.usuarios add column if not exists dni text;
alter table public.usuarios add column if not exists tipo text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'usuarios_tipo_check'
  ) then
    alter table public.usuarios
      add constraint usuarios_tipo_check
      check (tipo is null or tipo in ('proveedor', 'trabajador'));
  end if;
end $$;

-- Trigger: captura nombre, dni y tipo desde los metadatos del registro.
create or replace function public.crear_perfil_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  hay_usuarios boolean;
begin
  select exists(select 1 from public.usuarios) into hay_usuarios;
  if not hay_usuarios then
    insert into public.usuarios (id, correo, nombre, rol, estado, permisos, aprobado_en)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre', ''),
      'dueno', 'activo',
      '{"acopio":true,"inventario":true,"caja":true,"ventas":true}'::jsonb, now());
  else
    insert into public.usuarios (id, correo, nombre, dni, tipo)
    values (new.id, new.email,
      coalesce(new.raw_user_meta_data->>'nombre', ''),
      nullif(new.raw_user_meta_data->>'dni', ''),
      nullif(new.raw_user_meta_data->>'tipo', ''));
  end if;
  return new;
end;
$$;
