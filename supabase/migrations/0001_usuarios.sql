-- 0001_usuarios.sql
-- Tabla de perfiles de usuario, seguridad por fila (RLS) y trigger de alta.
-- El PRIMER usuario que se registra se vuelve dueño (admin) automáticamente;
-- los siguientes quedan en estado "pendiente" hasta que el dueño los apruebe.
-- Versión idempotente: segura de ejecutar varias veces.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'rol_usuario') then
    create type rol_usuario as enum ('dueno', 'trabajador');
  end if;
  if not exists (select 1 from pg_type where typname = 'estado_usuario') then
    create type estado_usuario as enum ('pendiente', 'activo', 'suspendido');
  end if;
end $$;

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default '',
  correo text not null,
  rol rol_usuario not null default 'trabajador',
  estado estado_usuario not null default 'pendiente',
  permisos jsonb not null default
    '{"acopio":false,"inventario":false,"caja":false,"ventas":false}'::jsonb,
  aprobado_por uuid references public.usuarios(id),
  aprobado_en timestamptz,
  creado_en timestamptz not null default now()
);

alter table public.usuarios enable row level security;

-- ¿El usuario actual es un dueño activo? (SECURITY DEFINER evita recursión de RLS)
create or replace function public.es_dueno_activo()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.usuarios u
    where u.id = auth.uid() and u.rol = 'dueno' and u.estado = 'activo'
  );
$$;

-- Cada usuario lee su propia ficha; el dueño lee todas.
drop policy if exists "leer propio o dueno" on public.usuarios;
create policy "leer propio o dueno" on public.usuarios
  for select using (id = auth.uid() or public.es_dueno_activo());

-- Solo el dueño actualiza fichas (aprobar / suspender / permisos).
drop policy if exists "dueno actualiza" on public.usuarios;
create policy "dueno actualiza" on public.usuarios
  for update using (public.es_dueno_activo());

-- Al registrarse en auth.users, crear la ficha en public.usuarios.
create or replace function public.crear_perfil_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  hay_usuarios boolean;
begin
  select exists(select 1 from public.usuarios) into hay_usuarios;
  if not hay_usuarios then
    -- Primer usuario = dueño activo con todos los permisos.
    insert into public.usuarios (id, correo, nombre, rol, estado, permisos, aprobado_en)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre', ''),
      'dueno', 'activo',
      '{"acopio":true,"inventario":true,"caja":true,"ventas":true}'::jsonb, now());
  else
    -- Resto = trabajador pendiente de aprobación.
    insert into public.usuarios (id, correo, nombre)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre', ''));
  end if;
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_usuario();
