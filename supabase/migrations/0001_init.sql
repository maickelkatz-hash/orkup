-- OrkUp - schema inicial (núcleo: perfis, timeline/feed cronológico, comunidades/fórum)
-- Rode este arquivo no SQL Editor do seu projeto Supabase (ou via `supabase db push`).
--
-- Escopo desta migration: profiles, friendships, posts, likes, comments,
-- communities, community_members, topics, replies — com Row Level Security.
-- Mensageiro, Páginas Públicas, selo de verificação (pago) e IA vêm depois.

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
create extension if not exists "uuid-ossp";

-- ============================================================================
-- PROFILES
-- Um perfil por usuário autenticado (auth.users). Criado automaticamente
-- via trigger quando o usuário se cadastra (ver handle_new_user abaixo).
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  initials text not null default '',
  avatar_url text,
  bio text,
  -- Selo de verificação: NUNCA aumenta alcance/visibilidade, apenas confirma identidade.
  verified boolean not null default false,
  created_at timestamptz not null default now(),

  constraint username_format check (username ~ '^[a-z0-9_]{3,20}$')
);

alter table public.profiles enable row level security;

-- Perfis são publicamente legíveis por qualquer usuário autenticado
-- (necessário para busca de amigos, exibição de autor de post, etc).
create policy "profiles_select_all_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Cria o profile automaticamente quando um novo usuário se cadastra no Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', 'Novo usuário'),
    coalesce(new.raw_user_meta_data->>'initials', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- FRIENDSHIPS
-- Amizade é sempre um pedido + aceite mútuo. Mensageiro e visibilidade de
-- posts no feed exigem status = 'accepted'. "Privacidade sempre".
-- ============================================================================
create table if not exists public.friendships (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,

  constraint no_self_friendship check (requester_id <> addressee_id),
  constraint unique_pair unique (requester_id, addressee_id)
);

alter table public.friendships enable row level security;

create policy "friendships_select_own"
  on public.friendships for select
  to authenticated
  using (auth.uid() in (requester_id, addressee_id));

create policy "friendships_insert_own_request"
  on public.friendships for insert
  to authenticated
  with check (requester_id = auth.uid());

create policy "friendships_update_participant"
  on public.friendships for update
  to authenticated
  using (auth.uid() in (requester_id, addressee_id))
  with check (auth.uid() in (requester_id, addressee_id));

create policy "friendships_delete_participant"
  on public.friendships for delete
  to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- Helper: retorna true se dois usuários são amigos aceitos (usado em várias policies).
create or replace function public.are_friends(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and (
        (requester_id = user_a and addressee_id = user_b)
        or (requester_id = user_b and addressee_id = user_a)
      )
  );
$$;

-- ============================================================================
-- POSTS
-- Timeline/feed SEMPRE cronológico — nenhuma coluna de "score" ou ranking.
-- Um post é visível para: o próprio autor + amigos aceitos do autor.
-- (Páginas Públicas/seguidores entram em uma migration futura.)
-- ============================================================================
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists posts_author_created_idx on public.posts (author_id, created_at desc);
create index if not exists posts_created_idx on public.posts (created_at desc);

alter table public.posts enable row level security;

create policy "posts_select_own_or_friends"
  on public.posts for select
  to authenticated
  using (
    author_id = auth.uid()
    or public.are_friends(auth.uid(), author_id)
  );

create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (author_id = auth.uid());

create policy "posts_update_own"
  on public.posts for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (author_id = auth.uid());

-- ============================================================================
-- LIKES
-- ============================================================================
create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.likes enable row level security;

create policy "likes_select_if_post_visible"
  on public.likes for select
  to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and (p.author_id = auth.uid() or public.are_friends(auth.uid(), p.author_id))
    )
  );

create policy "likes_insert_own_if_post_visible"
  on public.likes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.posts p
      where p.id = post_id
        and (p.author_id = auth.uid() or public.are_friends(auth.uid(), p.author_id))
    )
  );

create policy "likes_delete_own"
  on public.likes for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- COMMENTS
-- ============================================================================
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists comments_post_created_idx on public.comments (post_id, created_at asc);

alter table public.comments enable row level security;

create policy "comments_select_if_post_visible"
  on public.comments for select
  to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id
        and (p.author_id = auth.uid() or public.are_friends(auth.uid(), p.author_id))
    )
  );

create policy "comments_insert_own_if_post_visible"
  on public.comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.posts p
      where p.id = post_id
        and (p.author_id = auth.uid() or public.are_friends(auth.uid(), p.author_id))
    )
  );

create policy "comments_delete_own"
  on public.comments for delete
  to authenticated
  using (author_id = auth.uid());

-- ============================================================================
-- COMMUNITIES (Comunidades / Fórum estilo Orkut)
-- Bolhas separadas: cada comunidade é seu próprio espaço; tópicos e respostas
-- só existem dentro de uma comunidade e só são visíveis a membros.
-- ============================================================================
create table if not exists public.communities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.communities enable row level security;

-- Lista de comunidades é pública (como no Orkut, dá pra descobrir e pedir pra entrar).
create policy "communities_select_all_authenticated"
  on public.communities for select
  to authenticated
  using (true);

create policy "communities_insert_own"
  on public.communities for insert
  to authenticated
  with check (creator_id = auth.uid());

create policy "communities_update_creator"
  on public.communities for update
  to authenticated
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

create policy "communities_delete_creator"
  on public.communities for delete
  to authenticated
  using (creator_id = auth.uid());

-- ============================================================================
-- COMMUNITY_MEMBERS
-- ============================================================================
create table if not exists public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

alter table public.community_members enable row level security;

create policy "community_members_select_all_authenticated"
  on public.community_members for select
  to authenticated
  using (true);

create policy "community_members_insert_own"
  on public.community_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "community_members_delete_own"
  on public.community_members for delete
  to authenticated
  using (user_id = auth.uid());

-- Helper: é membro da comunidade?
create or replace function public.is_community_member(p_community_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.community_members
    where community_id = p_community_id and user_id = p_user_id
  );
$$;

-- ============================================================================
-- TOPICS (tópicos de fórum dentro de uma comunidade)
-- ============================================================================
create table if not exists public.topics (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  created_at timestamptz not null default now()
);

create index if not exists topics_community_created_idx on public.topics (community_id, created_at desc);

alter table public.topics enable row level security;

create policy "topics_select_if_member"
  on public.topics for select
  to authenticated
  using (public.is_community_member(community_id, auth.uid()));

create policy "topics_insert_if_member"
  on public.topics for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and public.is_community_member(community_id, auth.uid())
  );

create policy "topics_delete_own"
  on public.topics for delete
  to authenticated
  using (author_id = auth.uid());

-- ============================================================================
-- REPLIES (respostas dentro de um tópico)
-- ============================================================================
create table if not exists public.replies (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists replies_topic_created_idx on public.replies (topic_id, created_at asc);

alter table public.replies enable row level security;

create policy "replies_select_if_member"
  on public.replies for select
  to authenticated
  using (
    exists (
      select 1 from public.topics t
      where t.id = topic_id
        and public.is_community_member(t.community_id, auth.uid())
    )
  );

create policy "replies_insert_if_member"
  on public.replies for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.topics t
      where t.id = topic_id
        and public.is_community_member(t.community_id, auth.uid())
    )
  );

create policy "replies_delete_own"
  on public.replies for delete
  to authenticated
  using (author_id = auth.uid());

-- ============================================================================
-- FIM da migration inicial.
-- Próximas migrations (fora deste arquivo): mensageiro em tempo real
-- (conversations/messages, restrito a friendships accepted), páginas
-- públicas + followers, selo de verificação (pago, sem afetar alcance),
-- amigo virtual de IA (histórico de conversa isolado por usuário).
-- ============================================================================
