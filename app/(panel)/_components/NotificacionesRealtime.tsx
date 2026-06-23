"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function NotificacionesRealtime() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Prepara el audio tras la primera interacción del usuario (políticas del navegador)
    const prepararAudio = () => {
      if (!ctxRef.current) {
        try {
          const AC =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          ctxRef.current = new AC();
        } catch {
          /* sin audio */
        }
      }
      if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
    };
    window.addEventListener("pointerdown", prepararAudio);

    const sonar = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const t = ctx.currentTime;
      const tono = (freq: number, inicio: number, dur: number) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = "sine";
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t + inicio);
        g.gain.exponentialRampToValueAtTime(0.25, t + inicio + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + inicio + dur);
        o.start(t + inicio);
        o.stop(t + inicio + dur + 0.02);
      };
      tono(880, 0, 0.25);
      tono(1175, 0.16, 0.32);
    };

    const canal = supabase
      .channel("notif-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificaciones" },
        (payload) => {
          const msg =
            (payload.new as { mensaje?: string })?.mensaje || "Nuevo movimiento";
          sonar();
          setToast(msg);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
      window.removeEventListener("pointerdown", prepararAudio);
    };
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(id);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] max-w-xs w-[calc(100%-2rem)] sm:w-auto bg-white border border-[#e6dccb] shadow-xl rounded-2xl p-4 flex items-start gap-3 animate-fade">
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
        style={{ backgroundImage: "linear-gradient(135deg,#8a5a2c,#e0a32e)" }}
      >
        <Bell size={18} />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">Nuevo movimiento</p>
        <p className="text-sm text-gray-700">{toast}</p>
      </div>
      <button
        onClick={() => setToast(null)}
        aria-label="Cerrar"
        className="text-gray-400 hover:text-gray-700"
      >
        <X size={16} />
      </button>
    </div>
  );
}
