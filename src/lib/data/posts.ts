import type { SupabaseClient } from "@supabase/supabase-js";

export type PostRow = {
  id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
  author: {
    display_name: string;
    username: string;
    initials: string;
    avatar_url: string | null;
    verified: boolean;
  } | null;
  likes: { user_id: string }[];
  comments: {
    id: string;
    body: string;
    created_at: string;
    author: {
      display_name: string;
      username: string;
      initials: string;
      avatar_url: string | null;
    } | null;
  }[];
};

const POST_SELECT = `
  id, body, image_url, created_at, author_id,
  author:profiles!posts_author_id_fkey ( display_name, username, initials, avatar_url, verified ),
  likes ( user_id ),
  comments ( id, body, created_at, author:profiles!comments_author_id_fkey ( display_name, username, initials, avatar_url ) )
`;

// Feed: chronological, no ranking of any kind — RLS already restricts rows
// to the caller's own posts + accepted friends' posts.
export async function fetchFeed(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as unknown as PostRow[];
}

export async function fetchProfilePosts(supabase: SupabaseClient, authorId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as unknown as PostRow[];
}
