-- 0005_dinero_notificaciones.sql
-- 1) Cada compra (lote) descuenta automáticamente de la caja.
-- 2) Notificación automática al admin cuando un trabajador registra una compra.
-- 3) Tabla de notificaciones (solo dueño).
-- Idempotente.

-- ===== Notificaciones =====
create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'compra',
  mensaje text not null,
  lote_id uuid,
  creado_por uuid,
  leida boolean not null default false,
  creado_en timestamptz not null default now()
);
alter table public.notificaciones enable row level security;
drop policy if exists "notif_dueno" on public.notificaciones;
create policy "notif_dueno" on public.notificaciones for all
  using (public.es_dueno_activo()) with check (public.es_dueno_activo());

-- ===== La compra descuenta de la caja =====
create or replace function public.compra_descuenta_caja()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_prod text;
begin
  select nombre into v_prod from public.productores where id = new.productor_id;
  insert into public.caja_movimientos (tipo, categoria, monto, descripcion, lote_id, creado_por, fecha)
  values ('egreso', 'compra cacao', new.monto_total,
    'Compra ' || new.codigo || coalesce(' - ' || v_prod, ''), new.id, new.creado_por, new.fecha);
  return new;
end; $$;
drop trigger if exists al_registrar_compra on public.lotes_acopio;
create trigger al_registrar_compra after insert on public.lotes_acopio
  for each row execute function public.compra_descuenta_caja();

-- ===== Notificar al admin si la compra la hizo un trabajador =====
create or replace function public.notificar_compra()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_rol rol_usuario; v_nombre text; v_prod text;
begin
  select rol, nombre into v_rol, v_nombre from public.usuarios where id = new.creado_por;
  if v_rol = 'trabajador' then
    select nombre into v_prod from public.productores where id = new.productor_id;
    insert into public.notificaciones (tipo, mensaje, lote_id, creado_por)
    values ('compra',
      coalesce(nullif(v_nombre,''), 'Un trabajador') || ' registró una compra de S/ ' ||
      to_char(new.monto_total, 'FM999999990.00') || ' a ' || coalesce(v_prod, 'un productor'),
      new.id, new.creado_por);
  end if;
  return new;
end; $$;
drop trigger if exists al_notificar_compra on public.lotes_acopio;
create trigger al_notificar_compra after insert on public.lotes_acopio
  for each row execute function public.notificar_compra();

-- ===== Al eliminar un lote, limpiar también su egreso de caja y notificación =====
create or replace function public.eliminar_lote(p_lote uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.tiene_permiso('acopio') then
    raise exception 'Sin permiso de acopio';
  end if;
  delete from public.inventario_movimientos where lote_origen_id = p_lote;
  delete from public.caja_movimientos where lote_id = p_lote;
  delete from public.notificaciones where lote_id = p_lote;
  delete from public.lotes_acopio where id = p_lote;
end; $$;
