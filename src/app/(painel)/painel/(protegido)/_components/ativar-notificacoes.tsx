"use client";

import { useEffect, useState } from "react";
import { removerInscricao, salvarInscricao } from "../notificacoes-actions";

type Estado =
  | "carregando"
  | "nao-suportado"
  | "bloqueado"
  | "inativo"
  | "ativo"
  | "processando";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

const CHAVE_PUBLICA = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function AtivarNotificacoes() {
  const [estado, setEstado] = useState<Estado>("carregando");

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window) ||
      !CHAVE_PUBLICA
    ) {
      setEstado("nao-suportado");
      return;
    }
    if (Notification.permission === "denied") {
      setEstado("bloqueado");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEstado(sub ? "ativo" : "inativo"))
      .catch(() => setEstado("nao-suportado"));
  }, []);

  async function ativar() {
    setEstado("processando");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setEstado(permissao === "denied" ? "bloqueado" : "inativo");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(CHAVE_PUBLICA!),
      });
      const json = sub.toJSON();
      await salvarInscricao({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      });
      setEstado("ativo");
    } catch {
      setEstado("inativo");
    }
  }

  async function desativar() {
    setEstado("processando");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removerInscricao(sub.endpoint);
        await sub.unsubscribe();
      }
      setEstado("inativo");
    } catch {
      setEstado("ativo");
    }
  }

  const base =
    "rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-60";

  if (estado === "carregando") return null;
  if (estado === "nao-suportado")
    return (
      <span className="text-xs text-content-secondary">
        Notificações não suportadas neste navegador.
      </span>
    );
  if (estado === "bloqueado")
    return (
      <span className="text-xs text-warning">
        Notificações bloqueadas nas configurações do navegador.
      </span>
    );
  if (estado === "ativo")
    return (
      <button
        onClick={desativar}
        className={`${base} bg-success/10 text-success ring-1 ring-success/20 hover:bg-success/15`}
      >
        🔔 Notificações ativas — desativar
      </button>
    );

  return (
    <button
      onClick={ativar}
      disabled={estado === "processando"}
      className={`${base} bg-primary text-canvas hover:bg-primary-light`}
    >
      {estado === "processando" ? "Ativando…" : "🔔 Ativar notificações"}
    </button>
  );
}
