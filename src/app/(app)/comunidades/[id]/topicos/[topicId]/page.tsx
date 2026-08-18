import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createReply, deleteReply } from "@/lib/actions/communities";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr}h`;
  return `há ${Math.floor(hr / 24)}d`;
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { id, topicId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: topic } = await supabase
    .from("topics")
    .select(
      "id, title, created_at, community_id, author:profiles!topics_author_id_fkey(display_name, initials), community:communities(creator_id)"
    )
    .eq("id", topicId)
    .maybeSingle();

  if (!topic) notFound();

  const community = topic.community as unknown as { creator_id: string } | null;
  const isModerator = community?.creator_id === user.id;

  const { data: replies } = await supabase
    .from("replies")
    .select("id, body, created_at, author:profiles!replies_author_id_fkey(display_name, initials)")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: true });

  const topicAuthor = topic.author as unknown as {
    display_name: string;
    initials: string;
  } | null;

  return (
    <div className="max-w-xl mx-auto">
      <Link href={`/comunidades/${id}`} className="text-sm" style={{ color: "var(--blue)" }}>
        ← Voltar para a comunidade
      </Link>

      <div className="card p-4 my-4">
        <h1 className="font-bold">{topic.title}</h1>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          por {topicAuthor?.display_name ?? "Usuário"} · {timeAgo(topic.created_at)}
        </p>
      </div>

      <div className="space-y-3 mb-4">
        {(replies ?? []).map((r) => {
          const author = r.author as unknown as {
            display_name: string;
            initials: string;
          } | null;
          return (
            <div key={r.id} className="card p-3 flex gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: "var(--blue)" }}
              >
                {author?.initials ?? "?"}
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{author?.display_name ?? "Usuário"}</span>{" "}
                  <span style={{ color: "var(--muted)" }} className="text-xs">
                    {timeAgo(r.created_at)}
                  </span>
                </p>
                <p className="text-sm mt-0.5">{r.body}</p>
              </div>
              {isModerator && (
                <form action={deleteReply}>
                  <input type="hidden" name="replyId" value={r.id} />
                  <input type="hidden" name="communityId" value={id} />
                  <input type="hidden" name="topicId" value={topicId} />
                  <button type="submit" className="text-xs shrink-0" style={{ color: "var(--danger)" }}>
                    Remover
                  </button>
                </form>
              )}
            </div>
          );
        })}

        {(replies ?? []).length === 0 && (
          <div className="card p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
            Nenhuma resposta ainda. Seja o primeiro a responder!
          </div>
        )}
      </div>

      <form action={createReply} className="card p-4">
        <input type="hidden" name="topicId" value={topic.id} />
        <input type="hidden" name="communityId" value={id} />
        <textarea
          name="body"
          required
          rows={2}
          placeholder="Escreva uma resposta..."
          className="input-field mb-2"
        />
        <div className="flex justify-end">
          <button type="submit" className="btn-primary">
            Responder
          </button>
        </div>
      </form>
    </div>
  );
}
