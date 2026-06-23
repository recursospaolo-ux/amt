import { createClient } from "@/lib/supabase/server";
import { soles, fechaHora } from "@/lib/format";
import { confirmarPago } from "./acciones";
import { ConfirmarPago } from "./ConfirmarPago";

type Prod = { nombre?: string; dni?: string } | null;

export default async function Pagos() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = await supabase
    .from("usuarios")
    .select("rol, permisos")
    .eq("id", user?.id ?? "")
    .single();
  const puedePagar =
    perfil?.rol === "dueno" ||
    !!(perfil?.permisos as Record<string, boolean> | null)?.pagos;

  const { data: saldoData } = await supabase.rpc("saldo_caja");
  const saldo = Number(saldoData ?? 0);

  const { data: pendientes } = await supabase
    .from("lotes_acopio")
    .select("id, codigo, monto_total, peso_kg, fecha, creado_en, productores(nombre, dni)")
    .eq("pago_estado", "pendiente")
    .order("creado_en", { ascending: false });

  const { data: pagados } = await supabase
    .from("lotes_acopio")
    .select("id, codigo, monto_total, pagado_en, productores(nombre)")
    .eq("pago_estado", "pagado")
    .order("pagado_en", { ascending: false })
    .limit(10);

  const totalPendiente = (pendientes ?? []).reduce(
    (a, p) => a + Number(p.monto_total),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pagos en caja</h1>
        <p className="text-gray-600 mt-1">
          Cuando entregás el dinero al proveedor, confirmá el pago y se descuenta
          del saldo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 text-white shadow-md" style={{ backgroundImage: "linear-gradient(135deg,#8a5a2c,#e0a32e)" }}>
          <div className="text-xs uppercase tracking-wide text-white/85">Saldo en caja</div>
          <div className="text-3xl font-extrabold mt-1">{soles(saldo)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="text-sm text-gray-600">Por pagar</div>
          <div className="text-3xl font-bold text-red-600">{soles(totalPendiente)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="text-sm text-gray-600">Pagos pendientes</div>
          <div className="text-3xl font-bold text-gray-900">{pendientes?.length ?? 0}</div>
        </div>
      </div>

      <section>
        <h2 className="font-semibold mb-3">Pendientes de pago</h2>
        {!pendientes || pendientes.length === 0 ? (
          <p className="text-sm text-gray-600">No hay pagos pendientes. 🎉</p>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="p-3">Fecha y hora</th>
                  <th className="p-3">Proveedor</th>
                  <th className="p-3">DNI</th>
                  <th className="p-3">Lote</th>
                  <th className="p-3 text-right">A pagar</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((p) => {
                  const prod = p.productores as Prod;
                  return (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="p-3 whitespace-nowrap">{fechaHora(p.creado_en)}</td>
                      <td className="p-3 font-medium">{prod?.nombre ?? "—"}</td>
                      <td className="p-3">{prod?.dni ?? "—"}</td>
                      <td className="p-3 font-mono">{p.codigo}</td>
                      <td className="p-3 text-right font-bold text-[#8a5a2c]">{soles(p.monto_total)}</td>
                      <td className="p-3 text-right">
                        {puedePagar && (
                          <ConfirmarPago
                            action={confirmarPago.bind(null, p.id)}
                            resumen={`${soles(p.monto_total)} a ${prod?.nombre ?? "proveedor"}`}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-3">Pagos recientes</h2>
        {!pagados || pagados.length === 0 ? (
          <p className="text-sm text-gray-600">Aún no hay pagos confirmados.</p>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="p-3">Pagado</th>
                  <th className="p-3">Proveedor</th>
                  <th className="p-3">Lote</th>
                  <th className="p-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {pagados.map((p) => {
                  const prod = p.productores as Prod;
                  return (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="p-3 whitespace-nowrap">{p.pagado_en ? fechaHora(p.pagado_en) : "—"}</td>
                      <td className="p-3">{prod?.nombre ?? "—"}</td>
                      <td className="p-3 font-mono">{p.codigo}</td>
                      <td className="p-3 text-right font-medium">{soles(p.monto_total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
