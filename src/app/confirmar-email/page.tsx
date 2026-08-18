import Link from "next/link";
import { ResendButton } from "./ResendButton";

export default async function ConfirmarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="card w-full max-w-sm p-8 text-center">
        <div className="logo-mark mb-6 justify-center flex">
          <span className="ork" style={{ color: "var(--blue-deep)" }}>
            ork
          </span>
          <span className="up">UP</span>
        </div>
        <h1 className="text-xl font-bold mb-2">Confirme seu e-mail</h1>
        <p className="text-sm mb-1" style={{ color: "var(--muted)" }}>
          Enviamos um link de confirmação para
        </p>
        <p className="text-sm font-semibold mb-4">{email || "o seu e-mail"}</p>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Abra o e-mail e clique no link para ativar sua conta. Se não
          encontrar, olhe também a caixa de spam.
        </p>

        {email && <ResendButton email={email} />}

        <Link
          href="/login"
          className="text-sm font-semibold block mt-6"
          style={{ color: "var(--blue)" }}
        >
          Voltar para o login
        </Link>
      </div>
    </main>
  );
}
