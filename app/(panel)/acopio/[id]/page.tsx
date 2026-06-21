import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { soles, kg, fecha } from "@/lib/format";
import { registrarEtapa, clasificarLote } from "../acciones";

export default async function LoteDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: lote } = await supabase
    .from("lotes_acopio")
    .select("*, productores(nombre)")
    .eq("id", id)
    .single();
  if (!lote) notFound();

  const { data: procesos } = await supabase
    .from("procesos_lote")
    .select("etapa, fecha, peso_resultante, merma, observaciones")
    .eq("lote_id", id)
    .order("creado_en");

  const prod = lote.productores as { nombre?: string } | null;
  const esBaba = lote.estado_recepcion === "baba";

  const mostrarFermentado = esBaba && lote.estado === "recibido";
  const mostrarSecado = lote.estado === "fermentado";
  const mostrarClasificar =
    lote.estado === "secado" || (!esBaba && lote.estado === "recibido");
  const clasificado = lote.estado === "clasificado";

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/acopio" className="text-sm text-[#8a5a2c] underline">
        ← Volver a acopio
      </Link>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h1 className="text-3xl font-bold text-gray-900 font-mono">{lote.codigo}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-sm">
          <div><span className="text-gray-500">Productor</span><br />{prod?.nombre ?? "—"}</div>
          <div><span className="text-gray-500">Fecha</span><br />{fecha(lote.fecha)}</div>
          <div><span className="text-gray-500">Recepción</span><br />{lote.estado_recepcion}</div>
          <div><span className="text-gray-500">Peso</span><br />{kg(lote.peso_kg)}</div>
          <div><span className="text-gray-500">Precio/kg</span><br />{soles(lote.precio_kg)}</div>
          <div><span className="text-gray-500">Monto total</span><br />{soles(lote.monto_total)}</div>
          <div><span className="text-gray-500">Humedad</span><br />{lote.humedad ?? "—"}%</div>
          <div><span className="text-gray-500">Estado</span><br />
            <span className="rounded bg-[#efe7db] text-[#8a5a2c] px-2 py-0.5 text-xs">{lote.estado}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="font-medium mb-3">Línea de tiempo</h2>
        <ol className="space-y-2 text-sm">
          {procesos?.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-[#8a5a2c]">●</span>
              <div>
                <span className="font-medium capitalize">{p.etapa}</span> — {fecha(p.fecha)}
                {p.peso_resultante != null && <> · {kg(p.peso_resultante)}</>}
                {p.merma != null && <> · merma {kg(p.merma)}</>}
                {p.observaciones && <div className="text-gray-500">{p.observaciones}</div>}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {clasificado && (
        <div className="bg-[#f6f1ea] border border-[#e6dccb] rounded-lg p-4 text-sm text-[#8a5a2c]">
          ✓ Lote clasificado. El grano ya entró al inventario.{" "}
          <Link href="/inventario" className="underline">Ver inventario</Link>
        </div>
      )}

      {mostrarFermentado && (
        <EtapaForm loteId={lote.id} etapa="fermentado" titulo="Registrar fermentado" />
      )}
      {mostrarSecado && (
        <EtapaForm loteId={lote.id} etapa="secado" titulo="Registrar secado" />
      )}
      {mostrarClasificar && (
        <form
          action={clasificarLote.bind(null, lote.id)}
          className="bg-white border border-gray-200 rounded-xl p-4 space-y-3"
        >
          <h2 className="font-medium">Clasificar lote</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-sm">
              Grano pequeño (kg)
              <input name="kg_pequeno" type="number" step="0.01" min="0" defaultValue="0" className="w-full border rounded p-2 mt-1" />
            </label>
            <label className="text-sm">
              Grano grande (kg)
              <input name="kg_grande" type="number" step="0.01" min="0" defaultValue="0" className="w-full border rounded p-2 mt-1" />
            </label>
            <label className="text-sm">
              Merma (kg)
              <input name="merma" type="number" step="0.01" min="0" defaultValue="0" className="w-full border rounded p-2 mt-1" />
            </label>
          </div>
          <button className="bg-[#8a5a2c] text-white rounded px-4 py-2">
            Clasificar e ingresar a inventario
          </button>
        </form>
      )}
    </div>
  );
}

function EtapaForm({
  loteId,
  etapa,
  titulo,
}: {
  loteId: string;
  etapa: "fermentado" | "secado";
  titulo: string;
}) {
  return (
    <form
      action={registrarEtapa.bind(null, loteId, etapa)}
      className="bg-white border border-gray-200 rounded-xl p-4 space-y-3"
    >
      <h2 className="font-medium">{titulo}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm">
          Peso resultante (kg)
          <input name="peso_resultante" type="number" step="0.01" min="0" className="w-full border rounded p-2 mt-1" />
        </label>
        <label className="text-sm">
          Merma (kg)
          <input name="merma" type="number" step="0.01" min="0" className="w-full border rounded p-2 mt-1" />
        </label>
      </div>
      <label className="text-sm block">
        Observaciones
        <input name="observaciones" className="w-full border rounded p-2 mt-1" />
      </label>
      <button className="bg-[#8a5a2c] text-white rounded px-4 py-2">{titulo}</button>
    </form>
  );
}
