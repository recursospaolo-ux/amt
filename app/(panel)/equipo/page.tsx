import Link from "next/link";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fecha } from "@/lib/format";

export default async function Equipo() {
  const supabase = await createClient();
  const { data: trabajadores } = await supabase
    .from("usuarios")
    .select("id, nombre, correo, dni, tipo, estado, creado_en")
    .eq("rol", "trabajador")
    .order("creado_en", { ascending: false });

  const total = trabajadores?.length ?? 0;
  const activos = (trabajadores ?? []).filter((t) => t.estado === "activo").length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Equipo</h1>

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-md">
        <div
          className="rounded-2xl p-5 text-white shadow-md"
          style={{ backgroundImage: "linear-gradient(135deg,#8a5a2c,#b6803c)" }}
        >
          <div className="text-xs uppercase tracking-wide text-white/85">Trabajadores</div>
          <div className="text-3xl font-extrabold mt-1">{total}</div>
        </div>
        <div
          className="rounded-2xl p-5 text-white shadow-md"
          style={{ backgroundImage: "linear-gradient(135deg,#2f8f5b,#5bbd83)" }}
        >
          <div className="text-xs uppercase tracking-wide text-white/85">Activos</div>
          <div className="text-3xl font-extrabold mt-1">{activos}</div>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-gray-600">
          Aún no hay trabajadores. Cuando alguien se registre y lo apruebes en
          &ldquo;Aprobar Usuarios&rdquo;, aparecerá aquí.
        </p>
      ) : (
        <ul className="space-y-2">
          {trabajadores!.map((t) => (
            <li key={t.id}>
              <Link
                href={`/equipo/${t.id}`}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 hover:border-[#8a5a2c] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundImage: "linear-gradient(135deg,#8a5a2c,#e0a32e)" }}
                  >
                    <Briefcase size={18} />
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{t.nombre || "(sin nombre)"}</div>
                    <div className="text-xs text-gray-600">
                      {t.correo} · DNI {t.dni || "—"} · desde {fecha(t.creado_en)}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs rounded-full px-2 py-0.5 ${
                    t.estado === "activo"
                      ? "bg-[#efe7db] text-[#8a5a2c]"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {t.estado}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
