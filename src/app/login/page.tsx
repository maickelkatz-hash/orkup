"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="card w-full max-w-sm p-8">
        <div className="logo-mark mb-6">
          <span className="ork" style={{ color: "var(--blue-deep)" }}>
            ork
          </span>
          <span className="up">UP</span>
        </div>
        <h1 className="text-xl font-bold mb-6">Entrar</h1>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium block mb-1">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input-field"
              placeholder="voce@exemplo.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium block mb-1">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          {state.error && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              {state.error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-sm mt-6" style={{ color: "var(--muted)" }}>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold" style={{ color: "var(--blue)" }}>
            Cadastre-se
          </Link>
        </p>
      </div>
    </main>
  );
}
