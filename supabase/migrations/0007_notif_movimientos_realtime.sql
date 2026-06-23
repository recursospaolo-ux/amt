-- 0007_notif_movimientos_realtime.sql
-- Notificación automática al admin por cada movimiento de un TRABAJADOR:
-- venta, movimiento de dinero (manual) y movimiento de inventario (manual).
-- (La compra ya notifica desde 0005.) Además activa Realtime en notificaciones.
-- Idempotente.

-- Venta
create or replace function public.notificar_venta()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_rol rol_usuario; v_nombre text; v_cli text;
begin
  select rol, nombre into v_rol, v_nombre from public.usuarios where id = new.creado_por;
  if v_rol = 'trabajador' then
    select nombre into v_cli from public.clientes where id = new.cliente_id;
    insert into public.notificaciones (tipo, mensaje, creado_por)
    values ('venta',
      coalesce(nullif(v_nombre,''),'Un trabajador') || ' registró una venta de S/ ' ||
      to_char(new.total,'FM999999990.00') || coalesce(' a ' || v_cli, ''), new.creado_por);
  end if;
  return new;
end; $$;
drop trigger if exists al_notificar_venta on public.ventas;
create trigger al_notificar_venta after insert on public.ventas
  for each row execute function public.notificar_venta();

-- Movimiento de dinero (solo manual: no el generado por compra/venta)
create or replace function public.notificar_caja()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_rol rol_usuario; v_nombre text;
begin
  if new.lote_id is not null or new.venta_id is not null then return new; end if;
  select rol, nombre into v_rol, v_nombre from public.usuarios where id = new.creado_por;
  if v_rol = 'trabajador' then
    insert into public.notificaciones (tipo, mensaje, creado_por)
    values ('caja',
      coalesce(nullif(v_nombre,''),'Un trabajador') || ' registró un ' || new.tipo ||
      ' de S/ ' || to_char(new.monto,'FM999999990.00') ||
      coalesce(' (' || new.categoria || ')', ''), new.creado_por);
  end if;
  return new;
end; $$;
drop trigger if exists al_notificar_caja on public.caja_movimientos;
create trigger al_notificar_caja after insert on public.caja_movimientos
  for each row execute function public.notificar_caja();

-- Movimiento de inventario (solo manual: no clasificación ni ventas)
create or replace function public.notificar_inventario()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_rol rol_usuario; v_nombre text; v_prod text;
begin
  if new.lote_origen_id is not null then return new; end if;
  if new.motivo is not null and new.motivo like 'Venta %' then return new; end if;
  select rol, nombre into v_rol, v_nombre from public.usuarios where id = new.creado_por;
  if v_rol = 'trabajador' then
    select nombre into v_prod from public.productos where id = new.producto_id;
    insert into public.notificaciones (tipo, mensaje, creado_por)
    values ('inventario',
      coalesce(nullif(v_nombre,''),'Un trabajador') || ' registró ' || new.tipo ||
      ' de ' || to_char(new.cantidad,'FM999999990.00') || ' kg' ||
      coalesce(' de ' || v_prod, ''), new.creado_por);
  end if;
  return new;
end; $$;
drop trigger if exists al_notificar_inventario on public.inventario_movimientos;
create trigger al_notificar_inventario after insert on public.inventario_movimientos
  for each row execute function public.notificar_inventario();

-- Activar Realtime para notificaciones
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notificaciones'
  ) then
    alter publication supabase_realtime add table public.notificaciones;
  end if;
end $$;
