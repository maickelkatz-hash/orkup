-- OrkUp - Páginas Públicas (empresas/pessoas que postam publicamente)
-- Rode este arquivo no SQL Editor do Supabase DEPOIS do 0001, 0002 e 0003.
--
-- Regras da spec (seção 3.6 / 3.7): seguidor, não amigo mútuo; posts de
-- página entram na MESMA timeline cronológica dos amigos, sem algoritmo;
-- selo de verificação (pago, futuro) nunca aumenta alcance.

-- ============================================================================
-- PAGES
-- ============================================================================
create table if not exists public.pages (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text unique not null,
  name text not null,
  bio text,
  avatar_url text,
  -- Selo de verificação: confirma identidade, NUNCA aumenta alcance/visibilidade.
  verified boolean not null default false,
  created_at timestamptz not null default now(),

  constraint page_slug_format check (slug ~ '^[a-z0-9-]{3,40}$')
);

alter table public.pages enable row level security;

create policy "pages_select_all_authenticated"
  on public.pages for select
  to authenticated
  using (true);

create policy "pages_insert_own"
  on public.pages for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "pages_update_owner"
  on public.pages for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "pages_delete_owner"
  on public.pages for delete
  to authenticated
  using (owner_id = auth.uid());

-- ============================================================================
-- PAGE_FOLLOWERS
-- ============================================================================
create table if not exists public.page_followers (
  page_id uuid not null references public.pages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  followed_at timestamptz not null default now(),
  primary key (page_id, user_id)
);

alter table public.page_followers enable row level security;

create policy "page_followers_select_all_authenticated"
  on public.page_followers for select
  to authenticated
  using (true);

create policy "page_followers_insert_own"
  on public.page_followers for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "page_followers_delete_own"
  on public.page_followers for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- POSTS: coluna page_id + regra de visibilidade unificada
-- Um post é de uma página OU de uma pessoa, nunca as duas coisas.
-- ============================================================================
alter table public.posts
  add column if not exists page_id uuid references public.pages(id) on delete cascade;

-- Função única de visibilidade — reaproveitada por posts, likes e comments,
-- pra não duplicar a mesma lógica em 5 policies diferentes.
create or replace function public.can_view_post(p_post_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_post_id
      and (
        p.author_id = auth.uid()
        or public.are_friends(auth.uid(), p.author_id)
        or (
          p.page_id is not null
          and (
            exists (
              select 1 from public.page_followers pf
              where pf.page_id = p.page_id and pf.user_id = auth.uid()
            )
            or exists (
              select 1 from public.pages pg
              where pg.id = p.page_id and pg.owner_id = auth.uid()
            )
          )
        )
      )
  );
$$;

drop policy if exists "posts_select_own_or_friends" on public.posts;
create policy "posts_select_visible"
  on public.posts for select
  to authenticated
  using (public.can_view_post(id));

-- Só o dono da página pode postar em nome dela (mesmo que author_id já
-- seja ele mesmo — sem isso, dava pra "postar" com o page_id de uma
-- página de outra pessoa).
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and (
      page_id is null
      or exists (
        select 1 from public.pages pg
        where pg.id = page_id and pg.owner_id = auth.uid()
      )
    )
  );

drop policy if exists "likes_select_if_post_visible" on public.likes;
create policy "likes_select_if_post_visible"
  on public.likes for select
  to authenticated
  using (public.can_view_post(post_id));

drop policy if exists "likes_insert_own_if_post_visible" on public.likes;
create policy "likes_insert_own_if_post_visible"
  on public.likes for insert
  to authenticated
  with check (user_id = auth.uid() and public.can_view_post(post_id));

drop policy if exists "comments_select_if_post_visible" on public.comments;
create policy "comments_select_if_post_visible"
  on public.comments for select
  to authenticated
  using (public.can_view_post(post_id));

drop policy if exists "comments_insert_own_if_post_visible" on public.comments;
create policy "comments_insert_own_if_post_visible"
  on public.comments for insert
  to authenticated
  with check (author_id = auth.uid() and public.can_view_post(post_id));
