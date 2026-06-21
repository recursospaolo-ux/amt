// Aplica un archivo .sql vía la Management API de Supabase.
// Uso: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-migration.mjs <ref> <ruta.sql>
import { readFileSync } from "node:fs";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.argv[2];
const sqlPath = process.argv[3];

if (!token || !ref || !sqlPath) {
  console.log("Faltan datos: token (env), ref (arg1) o ruta sql (arg2)");
  process.exit(1);
}

const query = readFileSync(sqlPath, "utf8");
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});

const text = await res.text();
console.log("HTTP", res.status);
console.log(text.slice(0, 1000));
process.exit(res.ok ? 0 : 2);
