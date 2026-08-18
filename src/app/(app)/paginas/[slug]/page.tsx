import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchPagePosts } from "@/lib/data/posts";
import { followPage, unfollowPage, createPagePost } from "@/lib/actions/pages";
import { Avatar } from "@/components/Avatar";
import { PostCard } from "@/components/PostCard";

export default async function PageDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, name, bio, avatar_url, verified, owner_id, page_followers(user_id)")
    .eq("slug", slug)
    .maybeSingle();

  if (!page) notFound();

  const followers = (page.page_followers ?? []) as { user_id: string }[];
  const isFollowing = followers.some((f) => f.user_id === user.id);
  const isOwner = page.owner_id === user.id;

  const posts = await fetchPagePosts(supabase, page.id);

  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-4 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Avatar
              avatarUrl={page.avatar_url}
              initials={page.name.slice(0, 2).toUpperCase()}
              size={56}
            />
            <div>
              <h1 className="font-bold text-lg">
                {page.name}
                {page.verified && (
                  <span className="verified-badge" title="Página verificada">✓</span>
                )}
              </h1>
              {page.bio && (
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                  {page.bio}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {followers.length} seguidor{followers.length === 1 ? "" : "es"}
              </p>
            </div>
          </div>
          {!isOwner &&
            (isFollowing ? (
              <form action={unfollowPage}>
                <input type="hidden" name="pageId" value={page.id} />
                <button type="submit" className="btn-secondary text-sm shrink-0">
                  Deixar de seguir
                </button>
              </form>
            ) : (
              <form action={followPage}>
                <input type="hidden" name="pageId" value={page.id} />
                <button type="submit" className="btn-primary text-sm shrink-0">
                  Seguir
                </button>
              </form>
            ))}
        </div>
      </div>

      {isOwner && (
        <div className="card p-4 mb-6">
          <h2 className="font-bold mb-3 text-sm">Postar como {page.name}</h2>
          <form action={createPagePost} className="space-y-2">
            <input type="hidden" name="pageId" value={page.id} />
            <input type="hidden" name="pageSlug" value={page.slug} />
            <textarea
              name="body"
              rows={3}
              placeholder={`O que ${page.name} quer compartilhar?`}
              className="input-field"
            />
            <div className="flex items-center justify-between gap-2">
              <input
                type="file"
                name="image"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="text-xs"
              />
              <button type="submit" className="btn-primary text-sm shrink-0">
                Publicar
              </button>
            </div>
          </form>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} meId={user.id} />
      ))}

      {posts.length === 0 && (
        <div className="card p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          Essa página ainda não publicou nada.
        </div>
      )}
    </div>
  );
}
