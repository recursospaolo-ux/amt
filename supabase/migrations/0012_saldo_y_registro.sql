-- 0012_saldo_y_registro.sql
-- 1) Avisar al admin cuando alguien se registra (push + campana).
-- 2) Bloquear compras si no hay saldo suficiente en caja (saldo - pagos pendientes).
-- Idempotente.

-- ===== Notificar nuevos registros al administrador =====
create or replace function public.notificar_registro()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.estado = 'pendiente' then
    insert into public.notificaciones (tipo, mensaje, creado_por, para)
    values ('registro',
      '🆕 ' || coalesce(nullif(new.nombre, ''), new.correo, 'Alguien') ||
      ' se registró' || coalesce(' como ' || new.tipo, '') || ' y espera tu aprobación',
      new.id, null);
  end if;
  return new;
end; $$;
drop trigger if exists al_notificar_registro on public.usuarios;
create trigger al_notificar_registro after insert on public.usuarios
  for each row execute function public.notificar_registro();

-- ===== Bloquear la compra si no alcanza el saldo de caja =====
create or replace function public.verificar_saldo_compra()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_saldo numeric; v_pend numeric; v_monto numeric; v_disp numeric;
begin
  v_monto := coalesce(new.peso_kg, 0) * coalesce(new.precio_kg, 0);
  select coalesce(sum(case when tipo = 'ingreso' then monto else -monto end), 0)
    into v_saldo from public.caja_movimientos;
  select coalesce(sum(monto_total), 0)
    into v_pend from public.lotes_acopio where pago_estado = 'pendiente';
  v_disp := v_saldo - v_pend;
  if v_monto > v_disp then
    raise exception 'No hay saldo suficiente en caja para esta compra. Disponible para pagar: S/ %, esta compra: S/ %',
      to_char(v_disp, 'FM999999990.00'), to_char(v_monto, 'FM999999990.00');
  end if;
  return new;
end; $$;
drop trigger if exists al_verificar_saldo on public.lotes_acopio;
create trigger al_verificar_saldo before insert on public.lotes_acopio
  for each row execute function public.verificar_saldo_compra();

-- ===== Borrar sub-registros también solo el admin =====
drop policy if exists "acopio_procesos" on public.procesos_lote;
create policy "proc_sel" on public.procesos_lote for select using (public.tiene_permiso('acopio'));
create policy "proc_ins" on public.procesos_lote for insert with check (public.tiene_permiso('acopio'));
create policy "proc_upd" on public.procesos_lote for update using (public.tiene_permiso('acopio'));
create policy "proc_del" on public.procesos_lote for delete using (public.es_dueno_activo());

drop policy if exists "ventas_items" on public.venta_items;
create policy "vi_sel" on public.venta_items for select using (public.tiene_permiso('ventas'));
create policy "vi_ins" on public.venta_items for insert with check (public.tiene_permiso('ventas'));
create policy "vi_upd" on public.venta_items for update using (public.tiene_permiso('ventas'));
create policy "vi_del" on public.venta_items for delete using (public.es_dueno_activo());
