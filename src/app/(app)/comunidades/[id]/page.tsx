import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  joinCommunity,
  leaveCommunity,
  createTopic,
  deleteTopic,
  removeMember,
} from "@/lib/actions/communities";
import { Avatar } from "@/components/Avatar";
import { CommunityAvatarUploadForm } from "./CommunityAvatarUploadForm";
import { DeleteCommunityButton } from "./DeleteCommunityButton";

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
    .select(
      "id, name, description, avatar_url, creator_id, community_members(user_id, profile:profiles!community_members_user_id_fkey(display_name, username, avatar_url, initials))"
    )
    .eq("id", id)
    .maybeSingle();

  if (!community) notFound();

  const members = (community.community_members ?? []) as unknown as {
    user_id: string;
    profile: { display_name: string; username: string; avatar_url: string | null; initials: string } | null;
  }[];
  const isMember = members.some((m) => m.user_id === user.id);
  const isModerator = community.creator_id === user.id;

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
          <div className="flex items-start gap-3">
            <div>
              <Avatar
                avatarUrl={community.avatar_url}
                initials={community.name.slice(0, 2).toUpperCase()}
                size={56}
              />
              {isModerator && <CommunityAvatarUploadForm communityId={community.id} />}
            </div>
            <div>
              <h1 className="font-bold text-lg">
                {community.name}
                {isModerator && (
                  <span
                    className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full align-middle"
                    style={{ background: "var(--brand-pink)", color: "#fff" }}
                  >
                    Moderador
                  </span>
                )}
              </h1>
              {community.description && (
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                  {community.description}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {members.length} membro{members.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          {isModerator ? (
            <DeleteCommunityButton communityId={community.id} />
          ) : isMember ? (
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
            <h2 className="font-semibold mb-2 text-sm">Membros</h2>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar avatarUrl={m.profile?.avatar_url} initials={m.profile?.initials} size={28} />
                    <Link
                      href={`/perfil/${m.profile?.username ?? ""}`}
                      className="text-sm hover:underline"
                    >
                      {m.profile?.display_name ?? "Usuário"}
                      {m.user_id === community.creator_id && (
                        <span className="text-xs ml-1" style={{ color: "var(--muted)" }}>
                          (moderador)
                        </span>
                      )}
                    </Link>
                  </div>
                  {isModerator && m.user_id !== community.creator_id && (
                    <form action={removeMember}>
                      <input type="hidden" name="communityId" value={community.id} />
                      <input type="hidden" name="userId" value={m.user_id} />
                      <button type="submit" className="text-xs" style={{ color: "var(--danger)" }}>
                        Remover
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>

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
              <div key={t.id} className="card p-4 mb-3 flex items-start justify-between gap-2">
                <Link
                  href={`/comunidades/${community.id}/topicos/${t.id}`}
                  className="flex-1 hover:bg-[var(--blue-lighter)]"
                >
                  <p className="font-medium text-sm">{t.title}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                    por {author?.display_name ?? "Usuário"} · {replies.length} resposta
                    {replies.length === 1 ? "" : "s"}
                  </p>
                </Link>
                {isModerator && (
                  <form action={deleteTopic}>
                    <input type="hidden" name="topicId" value={t.id} />
                    <input type="hidden" name="communityId" value={community.id} />
                    <button type="submit" className="text-xs shrink-0" style={{ color: "var(--danger)" }}>
                      Remover
                    </button>
                  </form>
                )}
              </div>
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
