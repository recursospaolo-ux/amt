-- 0004_eliminar.sql
-- Funciones para eliminar lotes y ventas de forma segura, revirtiendo sus
-- efectos en inventario y caja. SECURITY DEFINER: cruzan módulos de forma controlada.
-- Idempotente.

-- Eliminar un lote: quita sus entradas de inventario y borra el lote (y sus procesos).
create or replace function public.eliminar_lote(p_lote uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.tiene_permiso('acopio') then
    raise exception 'Sin permiso de acopio';
  end if;
  delete from public.inventario_movimientos where lote_origen_id = p_lote;
  delete from public.lotes_acopio where id = p_lote; -- procesos_lote se borran en cascada
end; $$;

-- Eliminar una venta: devuelve el stock (borra sus salidas), quita el ingreso de
-- caja y borra la venta (y sus ítems).
create or replace function public.eliminar_venta(p_venta uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_codigo text;
begin
  if not public.tiene_permiso('ventas') then
    raise exception 'Sin permiso de ventas';
  end if;
  select codigo into v_codigo from public.ventas where id = p_venta;
  delete from public.caja_movimientos where venta_id = p_venta;
  delete from public.inventario_movimientos where motivo = 'Venta ' || v_codigo;
  delete from public.ventas where id = p_venta; -- venta_items se borran en cascada
end; $$;
