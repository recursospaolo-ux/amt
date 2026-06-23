"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { marcarLeidas } from "./acciones";

export function MarcarLeidas({ hayNoLeidas }: { hayNoLeidas: boolean }) {
  const router = useRouter();
  const hecho = useRef(false);
  useEffect(() => {
    if (!hayNoLeidas || hecho.current) return;
    hecho.current = true;
    marcarLeidas().then(() => router.refresh());
  }, [hayNoLeidas, router]);
  return null;
}
