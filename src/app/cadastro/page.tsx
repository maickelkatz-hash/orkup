"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { error: null };

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="card w-full max-w-sm p-8">
        <div className="logo-mark mb-6">
          <span className="ork" style={{ color: "var(--blue-deep)" }}>
            ork
          </span>
          <span className="up">UP</span>
        </div>
        <h1 className="text-xl font-bold mb-1">Criar conta</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Disponível para qualquer lugar do mundo — foco de produto no
          Brasil.
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="text-sm font-medium block mb-1">
              Nome completo
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              className="input-field"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label htmlFor="username" className="text-sm font-medium block mb-1">
              Nome de usuário
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              pattern="[a-z0-9_]{3,20}"
              className="input-field"
              placeholder="seu_usuario"
            />
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              3-20 caracteres: letras minúsculas, números e _
            </p>
          </div>
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
              minLength={8}
              autoComplete="new-password"
              className="input-field"
              placeholder="mínimo 8 caracteres"
            />
          </div>

          {state.error && (
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              {state.error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Criando conta..." : "Criar conta grátis"}
          </button>
        </form>

        <p className="text-sm mt-6" style={{ color: "var(--muted)" }}>
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "var(--blue)" }}>
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
