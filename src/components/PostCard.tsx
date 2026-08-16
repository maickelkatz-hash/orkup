import Link from "next/link";
import type { PostRow } from "@/lib/data/posts";
import { toggleLike, addComment } from "@/lib/actions/posts";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr}h`;
  const days = Math.floor(hr / 24);
  return `há ${days}d`;
}

function Badge({ verified }: { verified: boolean }) {
  if (!verified) return null;
  return (
    <span className="verified-badge" title="Perfil verificado">
      ✓
    </span>
  );
}

export function PostCard({ post, meId }: { post: PostRow; meId: string }) {
  const liked = post.likes.some((l) => l.user_id === meId);
  const comments = [...post.comments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <article className="card p-4 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: "var(--blue)" }}
        >
          {post.author?.initials ?? "?"}
        </div>
        <div>
          <Link
            href={`/perfil/${post.author?.username ?? ""}`}
            className="font-semibold text-sm hover:underline"
          >
            {post.author?.display_name ?? "Usuário"}
            <Badge verified={post.author?.verified ?? false} />
          </Link>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {timeAgo(post.created_at)}
          </p>
        </div>
      </div>

      <p className="mb-3 whitespace-pre-wrap text-sm">{post.body}</p>

      <div className="flex items-center gap-4 text-sm" style={{ color: "var(--muted)" }}>
        <form action={toggleLike}>
          <input type="hidden" name="postId" value={post.id} />
          <button
            type="submit"
            className="font-medium"
            style={{ color: liked ? "var(--brand-pink)" : "var(--muted)" }}
          >
            {liked ? "♥" : "♡"} Curtir{post.likes.length > 0 ? ` (${post.likes.length})` : ""}
          </button>
        </form>
        <span>{comments.length} comentário{comments.length === 1 ? "" : "s"}</span>
      </div>

      {comments.length > 0 && (
        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-semibold">{c.author?.display_name ?? "Usuário"}: </span>
              <span>{c.body}</span>
            </div>
          ))}
        </div>
      )}

      <form action={addComment} className="mt-3 flex gap-2">
        <input type="hidden" name="postId" value={post.id} />
        <input
          type="text"
          name="body"
          placeholder="Escreva um comentário..."
          required
          className="input-field text-sm"
        />
        <button type="submit" className="btn-secondary text-sm shrink-0">
          Enviar
        </button>
      </form>
    </article>
  );
}
