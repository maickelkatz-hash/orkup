import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchProfilePosts } from "@/lib/data/posts";
import { PostCard } from "@/components/PostCard";
import {
  sendFriendRequest,
  respondFriendRequest,
  removeFriendship,
} from "@/lib/actions/friendships";

function Badge({ verified }: { verified: boolean }) {
  if (!verified) return null;
  return (
    <span className="verified-badge" title="Perfil verificado">
      ✓
    </span>
  );
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, username, initials, bio, verified, created_at")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const isMe = profile.id === user.id;

  const { data: friendship } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
    )
    .maybeSingle();

  const { count: friendCount } = await supabase
    .from("friendships")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);

  const posts = await fetchProfilePosts(supabase, profile.id);

  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-6 mb-4">
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0"
            style={{ background: "var(--blue)" }}
          >
            {profile.initials}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">
              {profile.display_name}
              <Badge verified={profile.verified} />
            </h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              @{profile.username} · {friendCount ?? 0} amigo
              {(friendCount ?? 0) === 1 ? "" : "s"}
            </p>
            {profile.bio && <p className="text-sm mt-2">{profile.bio}</p>}
          </div>
        </div>

        {!isMe && (
          <div className="mt-4">
            {!friendship && (
              <form action={sendFriendRequest}>
                <input type="hidden" name="addresseeId" value={profile.id} />
                <button type="submit" className="btn-primary">
                  Adicionar amigo
                </button>
              </form>
            )}

            {friendship?.status === "pending" &&
              friendship.requester_id === user.id && (
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Solicitação de amizade enviada.
                </p>
              )}

            {friendship?.status === "pending" &&
              friendship.addressee_id === user.id && (
                <div className="flex gap-2">
                  <form action={respondFriendRequest}>
                    <input type="hidden" name="friendshipId" value={friendship.id} />
                    <input type="hidden" name="decision" value="accepted" />
                    <button type="submit" className="btn-primary">
                      Aceitar
                    </button>
                  </form>
                  <form action={respondFriendRequest}>
                    <input type="hidden" name="friendshipId" value={friendship.id} />
                    <input type="hidden" name="decision" value="declined" />
                    <button type="submit" className="btn-secondary">
                      Recusar
                    </button>
                  </form>
                </div>
              )}

            {friendship?.status === "accepted" && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: "var(--green)" }}>
                  ✓ Amigos
                </span>
                <form action={removeFriendship}>
                  <input type="hidden" name="friendshipId" value={friendship.id} />
                  <button type="submit" className="text-sm" style={{ color: "var(--muted)" }}>
                    Desfazer amizade
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {posts.length === 0 && (
        <div className="card p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          {isMe ? "Você ainda não postou nada." : "Nenhum post visível ainda."}
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} meId={user.id} />
      ))}
    </div>
  );
}
