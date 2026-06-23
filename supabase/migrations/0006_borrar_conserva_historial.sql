-- 0006_borrar_conserva_historial.sql
-- Permite borrar un proveedor o un cliente sin perder sus compras/ventas:
-- el registro queda con proveedor/cliente en blanco (ON DELETE SET NULL).
-- Idempotente.

alter table public.lotes_acopio drop constraint if exists lotes_acopio_productor_id_fkey;
alter table public.lotes_acopio
  add constraint lotes_acopio_productor_id_fkey
  foreign key (productor_id) references public.productores(id) on delete set null;

alter table public.ventas drop constraint if exists ventas_cliente_id_fkey;
alter table public.ventas
  add constraint ventas_cliente_id_fkey
  foreign key (cliente_id) references public.clientes(id) on delete set null;
