import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (req.headers.get("x-push-secret") !== process.env.PUSH_SECRET) {
    return new Response("No autorizado", { status: 401 });
  }

  const { mensaje, para } = await req
    .json()
    .catch(() => ({ mensaje: "Nuevo movimiento", para: null }));

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@amtagroindustria.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  let query = admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");
  if (para) query = query.eq("user_id", para);
  const { data: subs } = await query;

  const payload = JSON.stringify({
    title: "AMT Agroindustria",
    body: mensaje || "Nuevo movimiento",
  });

  let ok = 0;
  const errores: string[] = [];
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        ok++;
      } catch (e) {
        const code = (e as { statusCode?: number })?.statusCode;
        errores.push(String(code ?? (e as Error)?.message ?? "?"));
        if (code === 404 || code === 410) {
          await admin.from("push_subscriptions").delete().eq("id", s.id);
        }
      }
    })
  );

  return Response.json({ total: subs?.length ?? 0, ok, errores });
}
