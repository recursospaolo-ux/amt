import { describe, it, expect } from "vitest";
import { puedeAcceder, puedeIngresar, PERMISOS_VACIOS } from "@/lib/auth/permisos";
import type { Usuario } from "@/lib/types";

const dueno: Usuario = {
  id: "1", nombre: "Edgar", correo: "edgar@amt.pe",
  rol: "dueno", estado: "activo",
  permisos: { acopio: true, inventario: true, caja: true, ventas: true },
};
const trabajadorVentas: Usuario = {
  id: "2", nombre: "Ana", correo: "ana@amt.pe",
  rol: "trabajador", estado: "activo",
  permisos: { ...PERMISOS_VACIOS, ventas: true },
};
const pendiente: Usuario = { ...trabajadorVentas, id: "3", estado: "pendiente" };
const duenoSuspendido: Usuario = { ...dueno, id: "4", estado: "suspendido" };

describe("permisos", () => {
  it("el dueño accede a todos los módulos", () => {
    expect(puedeAcceder(dueno, "caja")).toBe(true);
    expect(puedeAcceder(dueno, "acopio")).toBe(true);
  });
  it("el trabajador solo accede a sus módulos permitidos", () => {
    expect(puedeAcceder(trabajadorVentas, "ventas")).toBe(true);
    expect(puedeAcceder(trabajadorVentas, "caja")).toBe(false);
  });
  it("un usuario pendiente nunca accede", () => {
    expect(puedeAcceder(pendiente, "ventas")).toBe(false);
  });
  it("ni siquiera un dueño suspendido accede", () => {
    expect(puedeAcceder(duenoSuspendido, "caja")).toBe(false);
  });
  it("solo los usuarios activos pueden ingresar", () => {
    expect(puedeIngresar(dueno)).toBe(true);
    expect(puedeIngresar(pendiente)).toBe(false);
    expect(puedeIngresar(duenoSuspendido)).toBe(false);
  });
});
