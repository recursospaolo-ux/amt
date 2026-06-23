"use client";
import { useEffect, useState } from "react";
import { guardarSuscripcion } from "./acciones";

function urlB64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type Estado = "cargando" | "no-soportado" | "activar" | "activado" | "bloqueado" | "procesando";

export function ActivarPush() {
  const [estado, setEstado] = useState<Estado>("cargando");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("no-soportado");
      return;
    }
    if (Notification.permission === "denied") {
      setEstado("bloqueado");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEstado(sub ? "activado" : "activar"))
      .catch(() => setEstado("activar"));
  }, []);

  async function activar() {
    setEstado("procesando");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setEstado(perm === "denied" ? "bloqueado" : "activar");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      const json = sub.toJSON();
      const res = await guardarSuscripcion({
        endpoint: sub.endpoint,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      });
      setEstado(res.ok ? "activado" : "activar");
    } catch {
      setEstado("activar");
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <h2 className="font-semibold text-gray-900">Avisos en este dispositivo</h2>
      <p className="text-sm text-gray-600 mt-1 mb-3">
        Activá las notificaciones para recibir cada movimiento aunque la app esté
        cerrada (en iPhone, instalá la app primero).
      </p>
      {estado === "cargando" && <p className="text-sm text-gray-500">Verificando…</p>}
      {estado === "no-soportado" && (
        <p className="text-sm text-gray-600">
          Este dispositivo/navegador no soporta notificaciones push.
        </p>
      )}
      {estado === "bloqueado" && (
        <p className="text-sm text-red-600">
          Notificaciones bloqueadas. Activalas en los ajustes del navegador para este sitio.
        </p>
      )}
      {estado === "activado" && (
        <p className="text-sm text-green-700 font-medium">
          ✓ Notificaciones activadas en este dispositivo
        </p>
      )}
      {(estado === "activar" || estado === "procesando") && (
        <button
          onClick={activar}
          disabled={estado === "procesando"}
          className="bg-cacao-grad text-white rounded-full px-5 py-2.5 font-semibold shadow-md disabled:opacity-60"
        >
          {estado === "procesando" ? "Activando…" : "Activar notificaciones"}
        </button>
      )}
    </div>
  );
}
