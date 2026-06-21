-- 0002_modulos.sql
-- Tablas de los módulos de negocio (acopio, inventario, caja, ventas, web),
-- helper de permisos por módulo, RLS, vista de stock y funciones (RPC) para
-- las operaciones que cruzan módulos (clasificación → inventario, venta → stock + caja).
-- Idempotente: seguro de re-ejecutar.

-- ===== Helper: ¿el usuario actual tiene permiso sobre un módulo? =====
create or replace function public.tiene_permiso(modulo text)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.usuarios u
    where u.id = auth.uid() and u.estado = 'activo'
      and (u.rol = 'dueno' or coalesce((u.permisos ->> modulo)::boolean, false) = true)
  );
$$;

-- ===== Tablas =====
create table if not exists public.productores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  dni text,
  zona text,
  telefono text,
  organico boolean not null default false,
  notas text,
  creado_en timestamptz not null default now()
);

create table if not exists public.lotes_acopio (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  productor_id uuid references public.productores(id),
  fecha date not null default current_date,
  estado_recepcion text not null check (estado_recepcion in ('baba','seco')),
  peso_kg numeric not null check (peso_kg > 0),
  humedad numeric,
  precio_kg numeric not null check (precio_kg >= 0),
  monto_total numeric generated always as (peso_kg * precio_kg) stored,
  estado text not null default 'recibido'
    check (estado in ('recibido','fermentado','secado','clasificado')),
  creado_por uuid,
  creado_en timestamptz not null default now()
);

create table if not exists public.procesos_lote (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes_acopio(id) on delete cascade,
  etapa text not null check (etapa in ('recepcion','fermentado','secado','clasificacion')),
  fecha date not null default current_date,
  peso_resultante numeric,
  merma numeric,
  observaciones text,
  creado_por uuid,
  creado_en timestamptz not null default now()
);

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text,
  unidad text not null default 'kg',
  es_para_venta boolean not null default true,
  visible_web boolean not null default false,
  descripcion text,
  precio_referencial numeric,
  creado_en timestamptz not null default now()
);

create table if not exists public.inventario_movimientos (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id),
  tipo text not null check (tipo in ('entrada','salida','ajuste','merma')),
  cantidad numeric not null check (cantidad > 0),
  lote_origen_id uuid references public.lotes_acopio(id),
  motivo text,
  fecha date not null default current_date,
  creado_por uuid,
  creado_en timestamptz not null default now()
);

create table if not exists public.caja_movimientos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('ingreso','egreso')),
  categoria text,
  monto numeric not null check (monto >= 0),
  descripcion text,
  fecha date not null default current_date,
  venta_id uuid,
  lote_id uuid,
  creado_por uuid,
  creado_en timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  doc text,
  tipo text not null default 'local' check (tipo in ('local','exportacion')),
  pais text,
  contacto text,
  notas text,
  creado_en timestamptz not null default now()
);

create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  cliente_id uuid references public.clientes(id),
  fecha date not null default current_date,
  tipo text not null default 'local' check (tipo in ('local','exportacion')),
  estado text not null default 'registrada'
    check (estado in ('cotizacion','registrada','entregada','pagada')),
  total numeric not null default 0,
  creado_por uuid,
  creado_en timestamptz not null default now()
);

create table if not exists public.venta_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  producto_id uuid not null references public.productos(id),
  cantidad numeric not null check (cantidad > 0),
  precio_unit numeric not null check (precio_unit >= 0),
  subtotal numeric generated always as (cantidad * precio_unit) stored,
  lote_origen_id uuid references public.lotes_acopio(id)
);

create table if not exists public.contacto_mensajes (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  correo text,
  mensaje text,
  creado_en timestamptz not null default now()
);

-- ===== RLS =====
alter table public.productores enable row level security;
alter table public.lotes_acopio enable row level security;
alter table public.procesos_lote enable row level security;
alter table public.productos enable row level security;
alter table public.inventario_movimientos enable row level security;
alter table public.caja_movimientos enable row level security;
alter table public.clientes enable row level security;
alter table public.ventas enable row level security;
alter table public.venta_items enable row level security;
alter table public.contacto_mensajes enable row level security;

-- Acopio
drop policy if exists "acopio_productores" on public.productores;
create policy "acopio_productores" on public.productores for all
  using (public.tiene_permiso('acopio')) with check (public.tiene_permiso('acopio'));
drop policy if exists "acopio_lotes" on public.lotes_acopio;
create policy "acopio_lotes" on public.lotes_acopio for all
  using (public.tiene_permiso('acopio')) with check (public.tiene_permiso('acopio'));
drop policy if exists "acopio_procesos" on public.procesos_lote;
create policy "acopio_procesos" on public.procesos_lote for all
  using (public.tiene_permiso('acopio')) with check (public.tiene_permiso('acopio'));

-- Productos: lectura interna (inventario o ventas) + lectura pública del catálogo; escritura inventario
drop policy if exists "productos_select_interno" on public.productos;
create policy "productos_select_interno" on public.productos for select
  using (public.tiene_permiso('inventario') or public.tiene_permiso('ventas'));
drop policy if exists "productos_select_publico" on public.productos;
create policy "productos_select_publico" on public.productos for select
  using (visible_web = true);
drop policy if exists "productos_insert" on public.productos;
create policy "productos_insert" on public.productos for insert
  with check (public.tiene_permiso('inventario'));
drop policy if exists "productos_update" on public.productos;
create policy "productos_update" on public.productos for update
  using (public.tiene_permiso('inventario'));
drop policy if exists "productos_delete" on public.productos;
create policy "productos_delete" on public.productos for delete
  using (public.tiene_permiso('inventario'));

-- Inventario (movimientos directos)
drop policy if exists "inventario_mov" on public.inventario_movimientos;
create policy "inventario_mov" on public.inventario_movimientos for all
  using (public.tiene_permiso('inventario')) with check (public.tiene_permiso('inventario'));

-- Caja
drop policy if exists "caja_mov" on public.caja_movimientos;
create policy "caja_mov" on public.caja_movimientos for all
  using (public.tiene_permiso('caja')) with check (public.tiene_permiso('caja'));

-- Ventas
drop policy if exists "ventas_clientes" on public.clientes;
create policy "ventas_clientes" on public.clientes for all
  using (public.tiene_permiso('ventas')) with check (public.tiene_permiso('ventas'));
drop policy if exists "ventas_ventas" on public.ventas;
create policy "ventas_ventas" on public.ventas for all
  using (public.tiene_permiso('ventas')) with check (public.tiene_permiso('ventas'));
drop policy if exists "ventas_items" on public.venta_items;
create policy "ventas_items" on public.venta_items for all
  using (public.tiene_permiso('ventas')) with check (public.tiene_permiso('ventas'));

-- Contacto: cualquiera puede enviar; solo ventas/dueño lee
drop policy if exists "contacto_insert" on public.contacto_mensajes;
create policy "contacto_insert" on public.contacto_mensajes for insert with check (true);
drop policy if exists "contacto_select" on public.contacto_mensajes;
create policy "contacto_select" on public.contacto_mensajes for select
  using (public.tiene_permiso('ventas'));

-- ===== Vista de stock actual (respeta RLS con security_invoker) =====
create or replace view public.stock_actual with (security_invoker = true) as
select
  p.id as producto_id,
  p.nombre,
  p.categoria,
  p.unidad,
  coalesce(sum(
    case
      when m.tipo in ('entrada','ajuste') then m.cantidad
      when m.tipo in ('salida','merma') then -m.cantidad
      else 0
    end), 0) as cantidad
from public.productos p
left join public.inventario_movimientos m on m.producto_id = p.id
group by p.id, p.nombre, p.categoria, p.unidad;

-- ===== Productos semilla (categorías que produce la clasificación) =====
insert into public.productos (nombre, categoria, unidad, es_para_venta)
select 'Cacao en grano (pequeño)', 'grano pequeño', 'kg', true
where not exists (select 1 from public.productos where categoria = 'grano pequeño');
insert into public.productos (nombre, categoria, unidad, es_para_venta)
select 'Cacao en grano (grande)', 'grano grande', 'kg', true
where not exists (select 1 from public.productos where categoria = 'grano grande');

-- ===== RPC: clasificar un lote → procesos + entradas de inventario =====
create or replace function public.clasificar_lote(
  p_lote uuid, p_kg_pequeno numeric, p_kg_grande numeric, p_merma numeric
) returns void language plpgsql security definer set search_path = public as $$
declare v_peq uuid; v_gra uuid;
begin
  if not public.tiene_permiso('acopio') then
    raise exception 'Sin permiso de acopio';
  end if;
  select id into v_peq from public.productos where categoria = 'grano pequeño' limit 1;
  select id into v_gra from public.productos where categoria = 'grano grande' limit 1;

  insert into public.procesos_lote (lote_id, etapa, peso_resultante, merma, creado_por)
    values (p_lote, 'clasificacion',
      coalesce(p_kg_pequeno,0) + coalesce(p_kg_grande,0), coalesce(p_merma,0), auth.uid());

  if coalesce(p_kg_pequeno,0) > 0 and v_peq is not null then
    insert into public.inventario_movimientos (producto_id, tipo, cantidad, lote_origen_id, motivo, creado_por)
      values (v_peq, 'entrada', p_kg_pequeno, p_lote, 'Clasificación de lote', auth.uid());
  end if;
  if coalesce(p_kg_grande,0) > 0 and v_gra is not null then
    insert into public.inventario_movimientos (producto_id, tipo, cantidad, lote_origen_id, motivo, creado_por)
      values (v_gra, 'entrada', p_kg_grande, p_lote, 'Clasificación de lote', auth.uid());
  end if;

  update public.lotes_acopio set estado = 'clasificado' where id = p_lote;
end; $$;

-- ===== RPC: registrar una venta → ítems + salidas de stock + ingreso a caja =====
create or replace function public.registrar_venta(
  p_cliente uuid, p_tipo text, p_codigo text, p_items jsonb, p_cobrar boolean
) returns uuid language plpgsql security definer set search_path = public as $$
declare it jsonb; v_id uuid; v_total numeric := 0; v_disp numeric;
begin
  if not public.tiene_permiso('ventas') then
    raise exception 'Sin permiso de ventas';
  end if;

  -- Validar stock y calcular total
  for it in select * from jsonb_array_elements(p_items) loop
    v_total := v_total + (it->>'cantidad')::numeric * (it->>'precio_unit')::numeric;
    select coalesce(sum(
      case when tipo in ('entrada','ajuste') then cantidad
           when tipo in ('salida','merma') then -cantidad else 0 end), 0)
      into v_disp from public.inventario_movimientos
      where producto_id = (it->>'producto_id')::uuid;
    if (it->>'cantidad')::numeric > v_disp then
      raise exception 'Stock insuficiente (disponible %, pedido %)', v_disp, (it->>'cantidad');
    end if;
  end loop;

  insert into public.ventas (codigo, cliente_id, tipo, estado, total, creado_por)
    values (p_codigo, p_cliente, coalesce(p_tipo,'local'),
      case when p_cobrar then 'pagada' else 'registrada' end, v_total, auth.uid())
    returning id into v_id;

  for it in select * from jsonb_array_elements(p_items) loop
    insert into public.venta_items (venta_id, producto_id, cantidad, precio_unit, lote_origen_id)
      values (v_id, (it->>'producto_id')::uuid, (it->>'cantidad')::numeric,
        (it->>'precio_unit')::numeric, nullif(it->>'lote_origen_id','')::uuid);
    insert into public.inventario_movimientos (producto_id, tipo, cantidad, lote_origen_id, motivo, creado_por)
      values ((it->>'producto_id')::uuid, 'salida', (it->>'cantidad')::numeric,
        nullif(it->>'lote_origen_id','')::uuid, 'Venta ' || p_codigo, auth.uid());
  end loop;

  if p_cobrar then
    insert into public.caja_movimientos (tipo, categoria, monto, descripcion, venta_id, creado_por)
      values ('ingreso', 'venta', v_total, 'Venta ' || p_codigo, v_id, auth.uid());
  end if;

  return v_id;
end; $$;
