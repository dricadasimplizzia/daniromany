"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-5">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-7">
          <h1 className="font-display text-2xl text-ink tracking-wide">DANIELLA ROMANY</h1>
          <div className="text-ink-muted text-xs tracking-[0.15em] uppercase mt-1.5">
            Studio Pilates &amp; Saúde Integrada
          </div>
          <div className="text-ink-muted text-sm mt-1.5">Sistema de gestão</div>
        </div>

        <form action={formAction} className="flex flex-col gap-3.5 bg-surface border border-border rounded-2xl p-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold text-ink-muted">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              className="border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-sage bg-white text-ink"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold text-ink-muted">Senha</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-sage bg-white text-ink"
            />
          </label>

          {state.error && (
            <div className="bg-brick-soft text-brick text-[12.5px] rounded-lg px-3 py-2">{state.error}</div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 bg-sage text-white rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60 cursor-pointer"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-4 text-[11.5px] text-ink-muted text-center leading-relaxed">
          Esqueceu a senha? Peça para a proprietária gerar uma nova no painel do Supabase.
        </div>
      </div>
    </div>
  );
}
