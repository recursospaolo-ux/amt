-- 0010_pagos_cajero.sql
-- Flujo de cajero: la compra ya NO descuenta caja al instante.
-- Crea un "pago pendiente" -> avisa al cajero -> el cajero confirma -> descuenta caja -> avisa al admin.
-- Idempotente.

-- ===== Permitir el tipo 'cajero' en el registro =====
alter table public.usuarios drop constraint if exists usuarios_tipo_check;
alter table public.usuarios add constraint usuarios_tipo_check
  check (tipo is null or tipo in ('proveedor', 'trabajador', 'cajero'));

-- ===== Notificaciones con destinatario =====
alter table public.notificaciones add column if not exists para uuid;

drop policy if exists "notif_dueno" on public.notificaciones;
drop policy if exists "notif_dueno_admin" on public.notificaciones;
drop policy if exists "notif_lee" on public.notificaciones;
drop policy if exists "notif_marca" on public.notificaciones;
-- el dueño administra todo
create policy "notif_dueno_admin" on public.notificaciones for all
  using (public.es_dueno_activo()) with check (public.es_dueno_activo());
-- cada quien lee y marca como leídas las suyas (para = su id)
create policy "notif_lee" on public.notificaciones for select
  using (public.es_dueno_activo() or para = auth.uid());
create policy "notif_marca" on public.notificaciones for update
  using (public.es_dueno_activo() or para = auth.uid())
  with check (public.es_dueno_activo() or para = auth.uid());

-- ===== Estado de pago en los lotes =====
alter table public.lotes_acopio add column if not exists pago_estado text not null default 'pendiente';
alter table public.lotes_acopio add column if not exists pagado_por uuid;
alter table public.lotes_acopio add column if not exists pagado_en timestamptz;

-- Backfill seguro: las compras viejas (que ya tienen egreso en caja) quedan como pagadas.
update public.lotes_acopio l
set pago_estado = 'pagado', pagado_en = coalesce(l.pagado_en, l.creado_en)
where l.pago_estado = 'pendiente'
  and exists (select 1 from public.caja_movimientos c where c.lote_id = l.id);

-- ===== La compra ya NO descuenta caja automáticamente =====
drop trigger if exists al_registrar_compra on public.lotes_acopio;

-- ===== Avisar a los cajeros del pago pendiente =====
create or replace function public.notificar_pago_pendiente()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_prod text; v_dni text; v_msg text; c record;
begin
  select nombre, dni into v_prod, v_dni from public.productores where id = new.productor_id;
  v_msg := '💵 Pagar S/ ' || to_char(new.monto_total, 'FM999999990.00') ||
    ' a ' || coalesce(v_prod, 'proveedor') ||
    coalesce(' (DNI ' || v_dni || ')', '') || ' — lote ' || new.codigo;
  for c in
    select id from public.usuarios
    where estado = 'activo' and rol = 'trabajador'
      and coalesce((permisos ->> 'pagos')::boolean, false) = true
  loop
    insert into public.notificaciones (tipo, mensaje, lote_id, creado_por, para)
    values ('pago', v_msg, new.id, new.creado_por, c.id);
  end loop;
  return new;
end; $$;
drop trigger if exists al_notificar_pago_pendiente on public.lotes_acopio;
create trigger al_notificar_pago_pendiente after insert on public.lotes_acopio
  for each row execute function public.notificar_pago_pendiente();

-- ===== El cajero confirma el pago: descuenta caja + avisa al admin =====
create or replace function public.confirmar_pago(p_lote uuid)
returns void language plpgsql security definer set search_path = public as $$
declare l record; v_prod text; v_cajero text; v_rol text;
begin
  if not public.tiene_permiso('pagos') then
    raise exception 'No tenés permiso para confirmar pagos';
  end if;
  select * into l from public.lotes_acopio where id = p_lote;
  if not found then raise exception 'Lote no encontrado'; end if;
  if l.pago_estado = 'pagado' then raise exception 'Este pago ya fue confirmado'; end if;

  select nombre into v_prod from public.productores where id = l.productor_id;
  select nombre, rol::text into v_cajero, v_rol from public.usuarios where id = auth.uid();

  -- descuenta de la caja
  insert into public.caja_movimientos (tipo, categoria, monto, descripcion, lote_id, creado_por, fecha)
  values ('egreso', 'pago productor', l.monto_total,
    'Pago compra ' || l.codigo || coalesce(' a ' || v_prod, ''), l.id, auth.uid(), current_date);

  -- marca el lote como pagado
  update public.lotes_acopio
  set pago_estado = 'pagado', pagado_por = auth.uid(), pagado_en = now()
  where id = p_lote;

  -- deja huella en la auditoría
  insert into public.actividad (actor_id, actor_nombre, rol, tipo, descripcion, monto, fecha)
  values (auth.uid(), coalesce(nullif(v_cajero, ''), '—'), v_rol, 'dinero',
    'Pago a ' || coalesce(v_prod, 'proveedor') || ' (lote ' || l.codigo || ')', l.monto_total, current_date);

  -- avisa al administrador
  insert into public.notificaciones (tipo, mensaje, lote_id, creado_por, para)
  values ('pago',
    '✅ ' || coalesce(nullif(v_cajero, ''), 'Cajero') || ' pagó S/ ' ||
    to_char(l.monto_total, 'FM999999990.00') || coalesce(' a ' || v_prod, '') ||
    ' (lote ' || l.codigo || ')', l.id, auth.uid(), null);
end; $$;
grant execute on function public.confirmar_pago(uuid) to authenticated;

-- ===== Saldo de caja accesible para el cajero (sin permiso de caja) =====
create or replace function public.saldo_caja()
returns numeric language sql security definer stable set search_path = public as $$
  select coalesce(sum(case when tipo = 'ingreso' then monto else -monto end), 0)
  from public.caja_movimientos;
$$;
grant execute on function public.saldo_caja() to authenticated;

-- ===== El cajero puede LEER lotes y productores (solo lectura) =====
drop policy if exists "lote_sel" on public.lotes_acopio;
create policy "lote_sel" on public.lotes_acopio for select
  using (public.tiene_permiso('acopio') or public.tiene_permiso('pagos'));

drop policy if exists "prod_sel" on public.productores;
create policy "prod_sel" on public.productores for select
  using (public.tiene_permiso('acopio') or public.tiene_permiso('pagos'));

-- ===== Push dirigido al destinatario correcto =====
create or replace function public.enviar_push()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_para uuid;
begin
  v_para := coalesce(new.para, (select id from public.usuarios where rol = 'dueno' order by creado_en limit 1));
  perform net.http_post(
    url := 'https://amt-agroindustria.vercel.app/api/push/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', 'b054c0fe58c17d2fc319c8190664ab17ca16b48d5e16bdea'
    ),
    body := jsonb_build_object('mensaje', new.mensaje, 'para', v_para)
  );
  return new;
end; $$;
