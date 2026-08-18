import { createClient } from "@/lib/supabase/server";
import { confirmBirthdate, sendAiMessage } from "@/lib/actions/ai";

function calculateAge(birthdateIso: string): number {
  const today = new Date();
  const birth = new Date(birthdateIso);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default async function AmigoIaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("birthdate")
    .eq("id", user.id)
    .maybeSingle();

  // Portão de idade — ninguém entra no chat sem declarar data de nascimento
  // e ter 18 anos ou mais (seção 11.3 da spec).
  if (!profile?.birthdate) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card p-6">
          <h1 className="font-bold text-lg mb-2">Amigo virtual de IA</h1>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            Essa conversa é feita com uma inteligência artificial, restrita a
            maiores de 18 anos. Antes de continuar, confirme sua data de
            nascimento.
          </p>
          <form action={confirmBirthdate} className="space-y-3">
            <input type="date" name="birthdate" required className="input-field" />
            <button type="submit" className="btn-primary w-full">
              Confirmar
            </button>
          </form>
        </div>
      </div>
    );
  }

  const age = calculateAge(profile.birthdate);
  if (age < 18) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          <h1 className="font-bold text-lg mb-2" style={{ color: "var(--text)" }}>
            Amigo virtual de IA
          </h1>
          Essa feature é restrita a maiores de 18 anos, pelas mesmas razões
          que várias redes têm reforçado essa regra recentemente: conversas
          contínuas com IA exigem cuidado extra com usuários menores de
          idade. Volte quando completar 18 anos.
        </div>
      </div>
    );
  }

  const { data: conversationId, error: convError } = await supabase.rpc(
    "get_or_create_ai_conversation"
  );

  if (convError || !conversationId) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          Não foi possível abrir a conversa agora. Tente novamente em
          instantes.
        </div>
      </div>
    );
  }

  const { data: messages } = await supabase
    .from("ai_messages")
    .select("id, role, body, flagged_crisis, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      <div className="card p-3 mb-3">
        <p className="font-semibold text-sm">Amigo virtual de IA</p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Você está conversando com uma inteligência artificial, não uma
          pessoa real. Se precisar de apoio emocional imediato, ligue 188
          (CVV) — gratuito, sigiloso, 24h.
        </p>
      </div>

      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {(!messages || messages.length === 0) && (
            <p className="text-sm text-center mt-8" style={{ color: "var(--muted)" }}>
              Nenhuma mensagem ainda. Diga oi!
            </p>
          )}
          {(messages ?? []).map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[80%] rounded-2xl px-3 py-2 text-sm"
                style={{
                  background: m.role === "user" ? "var(--blue)" : "var(--blue-lighter)",
                  color: m.role === "user" ? "#fff" : "var(--text)",
                  border: m.flagged_crisis ? "2px solid var(--brand-pink)" : "none",
                }}
              >
                {m.body}
              </div>
            </div>
          ))}
        </div>

        <form
          action={sendAiMessage}
          className="flex gap-2 p-3 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <input type="hidden" name="conversationId" value={conversationId} />
          <input
            type="text"
            name="body"
            required
            placeholder="Escreva uma mensagem..."
            autoComplete="off"
            className="input-field text-sm"
          />
          <button type="submit" className="btn-primary text-sm shrink-0">
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
