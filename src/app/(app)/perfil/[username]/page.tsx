import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchProfilePosts } from "@/lib/data/posts";
import { PostCard } from "@/components/PostCard";
import { Avatar } from "@/components/Avatar";
import { AvatarUploadForm } from "./AvatarUploadForm";
import { SobreSection } from "./SobreSection";
import { RecadosSection, type Recado } from "./RecadosSection";
import { DepoimentosSection, type Depoimento } from "./DepoimentosSection";
import { FanAndBadges } from "./FanAndBadges";
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
    .select(
      `id, display_name, username, initials, avatar_url, bio, verified, created_at,
       quem_sou, birth_date, relationship_status, platform_interest, has_children,
       sexual_orientation, smokes, activities, books, music, occupation, employer, education`
    )
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

  const isFriend = friendship?.status === "accepted";

  const { count: friendCount } = await supabase
    .from("friendships")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);

  const posts = await fetchProfilePosts(supabase, profile.id);

  // Recados: visíveis a quem já pode ver o perfil (RLS filtra de qualquer forma;
  // aqui só evitamos a query pra quem certamente não teria nada visível).
  const { data: recadosRaw } = await supabase
    .from("recados")
    .select(
      "id, body, created_at, author:profiles!recados_author_id_fkey ( id, username, display_name, initials, avatar_url )"
    )
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const recados = (recadosRaw ?? []) as unknown as Recado[];

  const { data: depoimentosApprovedRaw } = await supabase
    .from("depoimentos")
    .select(
      "id, body, status, created_at, author:profiles!depoimentos_author_id_fkey ( id, username, display_name, initials, avatar_url )"
    )
    .eq("profile_id", profile.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  const depoimentosApproved = (depoimentosApprovedRaw ?? []) as unknown as Depoimento[];

  let depoimentosPending: Depoimento[] = [];
  let alreadyWrote = false;
  if (isMe) {
    const { data: pendingRaw } = await supabase
      .from("depoimentos")
      .select(
        "id, body, status, created_at, author:profiles!depoimentos_author_id_fkey ( id, username, display_name, initials, avatar_url )"
      )
      .eq("profile_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    depoimentosPending = (pendingRaw ?? []) as unknown as Depoimento[];
  } else if (isFriend) {
    const { data: mine } = await supabase
      .from("depoimentos")
      .select("id")
      .eq("profile_id", profile.id)
      .eq("author_id", user.id)
      .maybeSingle();
    alreadyWrote = Boolean(mine);
  }

  const { count: fanCount } = await supabase
    .from("fans")
    .select("fan_id", { count: "exact", head: true })
    .eq("target_id", profile.id);

  const { data: myFanRow } = await supabase
    .from("fans")
    .select("fan_id")
    .eq("fan_id", user.id)
    .eq("target_id", profile.id)
    .maybeSingle();

  const { data: badgeRows } = await supabase
    .from("profile_badges")
    .select("voter_id, badge_type")
    .eq("profile_id", profile.id);

  const badgeCounts: Record<string, number> = { fiel: 0, legal: 0, sexy: 0 };
  const myVotes = new Set<string>();
  for (const row of badgeRows ?? []) {
    badgeCounts[row.badge_type] = (badgeCounts[row.badge_type] ?? 0) + 1;
    if (row.voter_id === user.id) myVotes.add(row.badge_type);
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-6 mb-4">
        <div className="flex items-start gap-4">
          <div>
            <Avatar avatarUrl={profile.avatar_url} initials={profile.initials} size={64} />
            {isMe && <AvatarUploadForm />}
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

            <FanAndBadges
              profileId={profile.id}
              isMe={isMe}
              fanCount={fanCount ?? 0}
              isFan={Boolean(myFanRow)}
              badgeCounts={badgeCounts}
              myVotes={myVotes}
            />
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

      <SobreSection
        profileId={profile.id}
        isMe={isMe}
        details={{
          bio: profile.bio,
          quem_sou: profile.quem_sou,
          birth_date: profile.birth_date,
          relationship_status: profile.relationship_status,
          platform_interest: profile.platform_interest,
          has_children: profile.has_children,
          sexual_orientation: profile.sexual_orientation,
          smokes: profile.smokes,
          activities: profile.activities,
          books: profile.books,
          music: profile.music,
          occupation: profile.occupation,
          employer: profile.employer,
          education: profile.education,
        }}
      />

      <RecadosSection
        profileId={profile.id}
        meId={user.id}
        isMe={isMe}
        canPost={isMe || isFriend}
        recados={recados}
      />

      <DepoimentosSection
        profileId={profile.id}
        isMe={isMe}
        canWrite={!isMe && isFriend}
        alreadyWrote={alreadyWrote}
        approved={depoimentosApproved}
        pending={depoimentosPending}
      />

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
