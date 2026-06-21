export function soles(n: number | null | undefined): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(Number(n) || 0);
}

export function kg(n: number | null | undefined): string {
  return `${new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(
    Number(n) || 0
  )} kg`;
}

export function fecha(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("es-PE");
}
