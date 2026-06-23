export type Rol = "dueno" | "trabajador";
export type EstadoUsuario = "pendiente" | "activo" | "suspendido";
export type Modulo = "acopio" | "inventario" | "caja" | "ventas" | "pagos";
export type Permisos = Record<Modulo, boolean>;

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  estado: EstadoUsuario;
  permisos: Permisos;
}
