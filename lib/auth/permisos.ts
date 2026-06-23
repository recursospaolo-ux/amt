import type { Usuario, Modulo, Permisos } from "@/lib/types";

export const PERMISOS_VACIOS: Permisos = {
  acopio: false,
  inventario: false,
  caja: false,
  ventas: false,
  pagos: false,
};

/** Solo los usuarios en estado "activo" pueden ingresar al panel. */
export function puedeIngresar(usuario: Usuario): boolean {
  return usuario.estado === "activo";
}

/**
 * Política de acceso a un módulo:
 * - Quien no esté activo, no accede (ni el dueño).
 * - El dueño accede a todos los módulos.
 * - El trabajador accede solo a los módulos marcados en sus permisos.
 */
export function puedeAcceder(usuario: Usuario, modulo: Modulo): boolean {
  if (!puedeIngresar(usuario)) return false;
  if (usuario.rol === "dueno") return true;
  return usuario.permisos[modulo] === true;
}
