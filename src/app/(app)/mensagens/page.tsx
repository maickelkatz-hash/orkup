import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr}h`;
  return `há ${Math.floor(hr / 24)}d`;
}

export default async function MensagensPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: friendships } = await supabase
    .from("friendships")
    .select(
      "requester_id, addressee_id, requester:profiles!friendships_requester_id_fkey(id, display_name, username, initials, avatar_url), addressee:profiles!friendships_addressee_id_fkey(id, display_name, username, initials, avatar_url)"
    )
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  type FriendProfile = {
    id: string;
    display_name: string;
    username: string;
    initials: string;
    avatar_url: string | null;
  };

  const friends: FriendProfile[] = (friendships ?? []).map((f) => {
    const requester = f.requester as unknown as FriendProfile;
    const addressee = f.addressee as unknown as FriendProfile;
    return f.requester_id === user.id ? addressee : requester;
  });

  const { data: conversations } = await supabase
    .from("conversations")
    .select(
      "id, user_a_id, user_b_id, messages(id, body, sender_id, created_at, read_at)"
    )
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

  type ConversationSummary = {
    id: string;
    otherId: string;
    lastMessage: { body: string; created_at: string; sender_id: string } | null;
    unreadCount: number;
  };

  const conversationByOtherId = new Map<string, ConversationSummary>();
  for (const c of conversations ?? []) {
    const otherId = c.user_a_id === user.id ? c.user_b_id : c.user_a_id;
    const messages = (c.messages ?? []) as {
      id: string;
      body: string;
      sender_id: string;
      created_at: string;
      read_at: string | null;
    }[];
    const sorted = [...messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const last = sorted[sorted.length - 1] ?? null;
    const unreadCount = messages.filter(
      (m) => m.sender_id !== user.id && !m.read_at
    ).length;
    conversationByOtherId.set(otherId, {
      id: c.id,
      otherId,
      lastMessage: last,
      unreadCount,
    });
  }

  const rows = friends
    .map((friend) => ({
      friend,
      conversation: conversationByOtherId.get(friend.id) ?? null,
    }))
    .sort((a, b) => {
      const aTime = a.conversation?.lastMessage?.created_at;
      const bTime = b.conversation?.lastMessage?.created_at;
      if (aTime && bTime) return new Date(bTime).getTime() - new Date(aTime).getTime();
      if (aTime) return -1;
      if (bTime) return 1;
      return a.friend.display_name.localeCompare(b.friend.display_name);
    });

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-lg font-bold mb-1">Mensagens</h1>
      <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
        Só entre amigos que aceitaram um ao outro — privacidade sempre.
      </p>

      {rows.length === 0 && (
        <div className="card p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          Você ainda não tem amigos para conversar. Adicione alguém no perfil dela(e)!
        </div>
      )}

      {rows.map(({ friend, conversation }) => (
        <Link
          key={friend.id}
          href={`/mensagens/${friend.username}`}
          className="card p-3 mb-2 flex items-center gap-3 hover:bg-[var(--blue-lighter)]"
        >
          <Avatar avatarUrl={friend.avatar_url} initials={friend.initials} size={44} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{friend.display_name}</p>
            <p
              className="text-xs truncate"
              style={{
                color: (conversation?.unreadCount ?? 0) > 0 ? "var(--text)" : "var(--muted)",
                fontWeight: (conversation?.unreadCount ?? 0) > 0 ? 600 : 400,
              }}
            >
              {conversation?.lastMessage
                ? `${conversation.lastMessage.sender_id === user.id ? "Você: " : ""}${conversation.lastMessage.body}`
                : "Diga oi 👋"}
            </p>
          </div>
          <div className="text-right shrink-0">
            {conversation?.lastMessage && (
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {timeAgo(conversation.lastMessage.created_at)}
              </p>
            )}
            {(conversation?.unreadCount ?? 0) > 0 && (
              <span
                className="inline-flex items-center justify-center rounded-full text-white text-xs font-bold mt-1"
                style={{ background: "var(--brand-pink)", width: 20, height: 20 }}
              >
                {conversation!.unreadCount}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
