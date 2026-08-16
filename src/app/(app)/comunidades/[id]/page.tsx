import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { joinCommunity, leaveCommunity, createTopic } from "@/lib/actions/communities";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: community } = await supabase
    .from("communities")
    .select("id, name, description, creator_id, community_members(user_id)")
    .eq("id", id)
    .maybeSingle();

  if (!community) notFound();

  const members = (community.community_members ?? []) as { user_id: string }[];
  const isMember = members.some((m) => m.user_id === user.id);

  // RLS só devolve tópicos se o usuário for membro da comunidade.
  const { data: topics } = await supabase
    .from("topics")
    .select("id, title, created_at, author:profiles!topics_author_id_fkey(display_name), replies(id)")
    .eq("community_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-bold text-lg">{community.name}</h1>
            {community.description && (
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                {community.description}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              {members.length} membro{members.length === 1 ? "" : "s"}
            </p>
          </div>
          {isMember ? (
            <form action={leaveCommunity}>
              <input type="hidden" name="communityId" value={community.id} />
              <button type="submit" className="btn-secondary text-sm shrink-0">
                Sair
              </button>
            </form>
          ) : (
            <form action={joinCommunity}>
              <input type="hidden" name="communityId" value={community.id} />
              <button type="submit" className="btn-primary text-sm shrink-0">
                Participar
              </button>
            </form>
          )}
        </div>
      </div>

      {!isMember && (
        <div className="card p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          Participe da comunidade para ver e criar tópicos.
        </div>
      )}

      {isMember && (
        <>
          <div className="card p-4 mb-4">
            <h2 className="font-semibold mb-2 text-sm">Novo tópico</h2>
            <form action={createTopic} className="flex gap-2">
              <input type="hidden" name="communityId" value={community.id} />
              <input
                type="text"
                name="title"
                required
                placeholder="Título do tópico"
                className="input-field text-sm"
              />
              <button type="submit" className="btn-primary text-sm shrink-0">
                Criar
              </button>
            </form>
          </div>

          {(topics ?? []).map((t) => {
            const author = t.author as unknown as { display_name: string } | null;
            const replies = (t.replies ?? []) as { id: string }[];
            return (
              <Link
                key={t.id}
                href={`/comunidades/${community.id}/topicos/${t.id}`}
                className="card p-4 mb-3 block hover:bg-[var(--blue-lighter)]"
              >
                <p className="font-medium text-sm">{t.title}</p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  por {author?.display_name ?? "Usuário"} · {replies.length} resposta
                  {replies.length === 1 ? "" : "s"}
                </p>
              </Link>
            );
          })}

          {(topics ?? []).length === 0 && (
            <div className="card p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
              Nenhum tópico ainda. Comece a conversa!
            </div>
          )}
        </>
      )}
    </div>
  );
}
