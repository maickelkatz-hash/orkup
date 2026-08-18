import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCommunity, joinCommunity, leaveCommunity } from "@/lib/actions/communities";
import { Avatar } from "@/components/Avatar";

export default async function ComunidadesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: communities } = await supabase
    .from("communities")
    .select("id, name, description, avatar_url, created_at, community_members(user_id)")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-4 mb-6">
        <h2 className="font-bold mb-3">Criar uma comunidade</h2>
        <form action={createCommunity} className="space-y-2">
          <input
            type="text"
            name="name"
            required
            placeholder="Nome da comunidade"
            className="input-field"
          />
          <textarea
            name="description"
            rows={2}
            placeholder="Sobre o que é essa bolha?"
            className="input-field"
          />
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              Criar comunidade
            </button>
          </div>
        </form>
      </div>

      <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
        Cada comunidade é uma bolha própria — tópicos e respostas ficam
        dentro dela, sem se misturar com outras.
      </p>

      {(communities ?? []).map((c) => {
        const members = (c.community_members ?? []) as { user_id: string }[];
        const isMember = members.some((m) => m.user_id === user.id);
        return (
          <div key={c.id} className="card p-4 mb-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Avatar avatarUrl={c.avatar_url} initials={c.name.slice(0, 2).toUpperCase()} size={44} />
              <div>
                <Link href={`/comunidades/${c.id}`} className="font-semibold hover:underline">
                  {c.name}
                </Link>
                {c.description && (
                  <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                    {c.description}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  {members.length} membro{members.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            {isMember ? (
              <form action={leaveCommunity}>
                <input type="hidden" name="communityId" value={c.id} />
                <button type="submit" className="btn-secondary text-sm shrink-0">
                  Sair
                </button>
              </form>
            ) : (
              <form action={joinCommunity}>
                <input type="hidden" name="communityId" value={c.id} />
                <button type="submit" className="btn-primary text-sm shrink-0">
                  Participar
                </button>
              </form>
            )}
          </div>
        );
      })}

      {(communities ?? []).length === 0 && (
        <div className="card p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          Nenhuma comunidade ainda. Que tal criar a primeira?
        </div>
      )}
    </div>
  );
}
