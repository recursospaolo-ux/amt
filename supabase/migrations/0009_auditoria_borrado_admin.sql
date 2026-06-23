-- 0009_auditoria_borrado_admin.sql
-- 1) Tabla de auditoría: huella permanente de cada movimiento (sobrevive borrados).
-- 2) Solo el administrador (dueño) puede BORRAR registros.
-- Idempotente.

-- ===== Auditoría (solo lectura del dueño; nadie la borra) =====
create table if not exists public.actividad (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_nombre text,
  rol text,
  tipo text,
  descripcion text,
  monto numeric,
  fecha date,
  creado_en timestamptz not null default now()
);
alter table public.actividad enable row level security;
drop policy if exists "actividad_dueno_lee" on public.actividad;
create policy "actividad_dueno_lee" on public.actividad for select
  using (public.es_dueno_activo());

create or replace function public.act_compra()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_n text; v_r rol_usuario; v_p text;
begin
  select nombre, rol into v_n, v_r from public.usuarios where id = new.creado_por;
  select nombre into v_p from public.productores where id = new.productor_id;
  insert into public.actividad (actor_id, actor_nombre, rol, tipo, descripcion, monto, fecha)
  values (new.creado_por, coalesce(nullif(v_n,''),'—'), v_r::text, 'compra',
    'Compra a ' || coalesce(v_p,'proveedor') || ' (' || new.codigo || ')', new.monto_total, new.fecha);
  return new;
end; $$;
drop trigger if exists al_act_compra on public.lotes_acopio;
create trigger al_act_compra after insert on public.lotes_acopio
  for each row execute function public.act_compra();

create or replace function public.act_venta()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_n text; v_r rol_usuario; v_c text;
begin
  select nombre, rol into v_n, v_r from public.usuarios where id = new.creado_por;
  select nombre into v_c from public.clientes where id = new.cliente_id;
  insert into public.actividad (actor_id, actor_nombre, rol, tipo, descripcion, monto, fecha)
  values (new.creado_por, coalesce(nullif(v_n,''),'—'), v_r::text, 'venta',
    'Venta ' || new.codigo || coalesce(' a ' || v_c, ''), new.total, new.fecha);
  return new;
end; $$;
drop trigger if exists al_act_venta on public.ventas;
create trigger al_act_venta after insert on public.ventas
  for each row execute function public.act_venta();

create or replace function public.act_caja()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_n text; v_r rol_usuario;
begin
  if new.lote_id is not null or new.venta_id is not null then return new; end if;
  select nombre, rol into v_n, v_r from public.usuarios where id = new.creado_por;
  insert into public.actividad (actor_id, actor_nombre, rol, tipo, descripcion, monto, fecha)
  values (new.creado_por, coalesce(nullif(v_n,''),'—'), v_r::text, 'dinero',
    new.tipo || coalesce(' (' || new.categoria || ')', '') || coalesce(' - ' || new.descripcion, ''),
    new.monto, new.fecha);
  return new;
end; $$;
drop trigger if exists al_act_caja on public.caja_movimientos;
create trigger al_act_caja after insert on public.caja_movimientos
  for each row execute function public.act_caja();

create or replace function public.act_inventario()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_n text; v_r rol_usuario; v_p text;
begin
  if new.lote_origen_id is not null then return new; end if;
  if new.motivo is not null and new.motivo like 'Venta %' then return new; end if;
  select nombre, rol into v_n, v_r from public.usuarios where id = new.creado_por;
  select nombre into v_p from public.productos where id = new.producto_id;
  insert into public.actividad (actor_id, actor_nombre, rol, tipo, descripcion, monto, fecha)
  values (new.creado_por, coalesce(nullif(v_n,''),'—'), v_r::text, 'inventario',
    new.tipo || ' ' || to_char(new.cantidad,'FM999999990.00') || ' kg' || coalesce(' de ' || v_p, ''),
    null, new.fecha);
  return new;
end; $$;
drop trigger if exists al_act_inventario on public.inventario_movimientos;
create trigger al_act_inventario after insert on public.inventario_movimientos
  for each row execute function public.act_inventario();

-- ===== Borrar: solo el dueño (separar delete del resto de permisos) =====
-- productores
drop policy if exists "acopio_productores" on public.productores;
create policy "prod_sel" on public.productores for select using (public.tiene_permiso('acopio'));
create policy "prod_ins" on public.productores for insert with check (public.tiene_permiso('acopio'));
create policy "prod_upd" on public.productores for update using (public.tiene_permiso('acopio'));
create policy "prod_del" on public.productores for delete using (public.es_dueno_activo());

-- lotes_acopio
drop policy if exists "acopio_lotes" on public.lotes_acopio;
create policy "lote_sel" on public.lotes_acopio for select using (public.tiene_permiso('acopio'));
create policy "lote_ins" on public.lotes_acopio for insert with check (public.tiene_permiso('acopio'));
create policy "lote_upd" on public.lotes_acopio for update using (public.tiene_permiso('acopio'));
create policy "lote_del" on public.lotes_acopio for delete using (public.es_dueno_activo());

-- inventario_movimientos
drop policy if exists "inventario_mov" on public.inventario_movimientos;
create policy "inv_sel" on public.inventario_movimientos for select using (public.tiene_permiso('inventario'));
create policy "inv_ins" on public.inventario_movimientos for insert with check (public.tiene_permiso('inventario'));
create policy "inv_upd" on public.inventario_movimientos for update using (public.tiene_permiso('inventario'));
create policy "inv_del" on public.inventario_movimientos for delete using (public.es_dueno_activo());

-- caja_movimientos
drop policy if exists "caja_mov" on public.caja_movimientos;
create policy "caja_sel" on public.caja_movimientos for select using (public.tiene_permiso('caja'));
create policy "caja_ins" on public.caja_movimientos for insert with check (public.tiene_permiso('caja'));
create policy "caja_upd" on public.caja_movimientos for update using (public.tiene_permiso('caja'));
create policy "caja_del" on public.caja_movimientos for delete using (public.es_dueno_activo());

-- clientes
drop policy if exists "ventas_clientes" on public.clientes;
create policy "cli_sel" on public.clientes for select using (public.tiene_permiso('ventas'));
create policy "cli_ins" on public.clientes for insert with check (public.tiene_permiso('ventas'));
create policy "cli_upd" on public.clientes for update using (public.tiene_permiso('ventas'));
create policy "cli_del" on public.clientes for delete using (public.es_dueno_activo());

-- ventas
drop policy if exists "ventas_ventas" on public.ventas;
create policy "vta_sel" on public.ventas for select using (public.tiene_permiso('ventas'));
create policy "vta_ins" on public.ventas for insert with check (public.tiene_permiso('ventas'));
create policy "vta_upd" on public.ventas for update using (public.tiene_permiso('ventas'));
create policy "vta_del" on public.ventas for delete using (public.es_dueno_activo());

-- productos: solo cambiar borrado a dueño
drop policy if exists "productos_delete" on public.productos;
create policy "productos_delete" on public.productos for delete using (public.es_dueno_activo());

-- RPCs de borrado: exigir dueño
create or replace function public.eliminar_lote(p_lote uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_dueno_activo() then raise exception 'Solo el administrador puede borrar'; end if;
  delete from public.inventario_movimientos where lote_origen_id = p_lote;
  delete from public.caja_movimientos where lote_id = p_lote;
  delete from public.notificaciones where lote_id = p_lote;
  delete from public.lotes_acopio where id = p_lote;
end; $$;

create or replace function public.eliminar_venta(p_venta uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_codigo text;
begin
  if not public.es_dueno_activo() then raise exception 'Solo el administrador puede borrar'; end if;
  select codigo into v_codigo from public.ventas where id = p_venta;
  delete from public.caja_movimientos where venta_id = p_venta;
  delete from public.inventario_movimientos where motivo = 'Venta ' || v_codigo;
  delete from public.ventas where id = p_venta;
end; $$;
