import { createClient } from "@/lib/supabase/server";
import { fetchFeed } from "@/lib/data/posts";
import { createPost } from "@/lib/actions/posts";
import { PostCard } from "@/components/PostCard";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const posts = await fetchFeed(supabase);

  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-4 mb-4">
        <form action={createPost}>
          <textarea
            name="body"
            required
            rows={3}
            placeholder="O que está acontecendo?"
            className="input-field mb-2"
          />
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              Publicar
            </button>
          </div>
        </form>
      </div>

      <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
        Sua timeline é sempre cronológica — sem algoritmo escolhendo o que
        você vê.
      </p>

      {posts.length === 0 && (
        <div className="card p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          Nenhum post ainda. Adicione amigos ou publique algo para começar!
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} meId={user.id} />
      ))}
    </div>
  );
}
