import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { ChatWindow } from "@/components/ChatWindow";

export default async function ConversationPage({
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

  const { data: otherUser } = await supabase
    .from("profiles")
    .select("id, display_name, username, initials, avatar_url")
    .eq("username", username)
    .maybeSingle();

  if (!otherUser) notFound();
  if (otherUser.id === user.id) notFound();

  const { data: conversationId, error: convError } = await supabase.rpc(
    "get_or_create_conversation",
    { other_user_id: otherUser.id }
  );

  if (convError || !conversationId) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          Vocês precisam ser amigos para conversar por aqui.
        </div>
      </div>
    );
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id, body, sender_id, created_at, read_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      <div className="card p-3 mb-3 flex items-center gap-3">
        <Link href="/mensagens" className="text-sm" style={{ color: "var(--blue)" }}>
          ←
        </Link>
        <Avatar avatarUrl={otherUser.avatar_url} initials={otherUser.initials} size={36} />
        <p className="font-semibold text-sm">{otherUser.display_name}</p>
      </div>

      <ChatWindow
        conversationId={conversationId}
        meId={user.id}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
