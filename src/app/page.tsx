import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/feed");
  }

  return (
    <main className="flex-1 flex flex-col md:flex-row">
      <section
        className="md:w-1/2 flex flex-col justify-center px-8 py-16 md:px-16 text-white"
        style={{
          background: "linear-gradient(160deg, var(--blue-deep), var(--blue))",
        }}
      >
        <div className="logo-mark mb-4">
          <span className="ork">ork</span>
          <span className="up">UP</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-3">
          Sua rede, na ordem em que ela realmente aconteceu.
        </h1>
        <p className="text-white/85 mb-6 max-w-md">
          Sem algoritmo escondendo quem te importa. Comunidades de verdade,
          mensagens só entre amigos, e uma timeline cronológica — do jeito
          que a internet já foi um dia.
        </p>
        <ul className="space-y-2 text-white/90 text-sm max-w-md">
          <li>• Timeline sempre em ordem cronológica, sem algoritmo</li>
          <li>• Comunidades e fóruns por assunto, sem brigas cruzadas</li>
          <li>• Mensagens privadas só entre amigos de verdade</li>
          <li>• Moderação ativa contra ódio, violência e conteúdo nocivo</li>
        </ul>
      </section>

      <section className="md:w-1/2 flex items-center justify-center px-8 py-16">
        <div className="card w-full max-w-sm p-8">
          <h2 className="text-xl font-bold mb-1">Entrar no OrkUp</h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-semibold" style={{ color: "var(--blue)" }}>
              Cadastre-se
            </Link>
          </p>
          <Link href="/login" className="btn-primary w-full block text-center">
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="btn-secondary w-full block text-center mt-3"
          >
            Criar conta grátis
          </Link>
        </div>
      </section>
    </main>
  );
}
