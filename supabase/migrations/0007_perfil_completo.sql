-- OrkUp - "Perfil completo" (paridade com concorrentes que já têm essa camada de identidade)
-- Rode este arquivo no SQL Editor do seu projeto Supabase (ou via `supabase db push`).
--
-- Escopo desta migration:
--   1. Campos estendidos de perfil (abas Social / Profissional / Pessoal + "quem sou")
--   2. Recados (mensagens públicas no perfil de outra pessoa) — já previsto na spec (seção 3.1)
--   3. Depoimentos (testemunhos permanentes, com aprovação do dono do perfil antes de ficar público)
--   4. Fãs (relação unidirecional "sou fã de", sem exigir amizade mútua)
--   5. Selos de perfil: fiel / legal / sexy (reações estilo Orkut, um voto por tipo por pessoa)
--
-- Nenhum desses campos/tabelas altera a ordenação do feed (princípio da seção 3.7 da spec:
-- timeline sempre cronológica) — são só camadas de identidade e interação social no perfil.

-- ============================================================================
-- PROFILES: campos estendidos
-- ============================================================================
alter table public.profiles
  add column if not exists quem_sou text check (char_length(quem_sou) <= 2000),
  add column if not exists birth_date date,
  add column if not exists relationship_status text
    check (relationship_status in (
      'solteiro', 'namorando', 'noivo', 'casado', 'e_complicado', 'aberto_relacionamento', null
    )),
  add column if not exists platform_interest text
    check (platform_interest in ('fazer_amigos', 'namorar', 'trabalho', 'comunidades', null)),
  add column if not exists has_children text
    check (has_children in ('sim', 'nao', null)),
  add column if not exists sexual_orientation text
    check (sexual_orientation in (
      'heterossexual', 'homossexual', 'bissexual', 'assexual', 'outro', 'prefiro_nao_dizer', null
    )),
  add column if not exists smokes boolean,
  add column if not exists activities text check (char_length(activities) <= 500),
  add column if not exists books text check (char_length(books) <= 500),
  add column if not exists music text check (char_length(music) <= 500),
  add column if not exists occupation text check (char_length(occupation) <= 200),
  add column if not exists employer text check (char_length(employer) <= 200),
  add column if not exists education text check (char_length(education) <= 500);

comment on column public.profiles.quem_sou is
  'Texto livre "quem sou" (equivalente textual — sem gravação de áudio nesta fase).';

-- ============================================================================
-- RECADOS
-- Mensagem pública no perfil de outra pessoa (spec seção 3.1). Só entre amigos
-- aceitos, coerente com o resto do produto ("privacidade sempre" — seção 3.4).
-- Visível a quem pode ver o perfil (o próprio dono + amigos do dono).
-- ============================================================================
create table if not exists public.recados (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists recados_profile_created_idx on public.recados (profile_id, created_at desc);

alter table public.recados enable row level security;

create policy "recados_select_if_can_view_profile"
  on public.recados for select
  to authenticated
  using (
    profile_id = auth.uid()
    or author_id = auth.uid()
    or public.are_friends(auth.uid(), profile_id)
  );

create policy "recados_insert_if_friends"
  on public.recados for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and (
      profile_id = auth.uid() -- pode deixar recado no próprio mural
      or public.are_friends(auth.uid(), profile_id)
    )
  );

-- Autor do recado OU dono do mural pode apagar (moderação do próprio espaço).
create policy "recados_delete_author_or_owner"
  on public.recados for delete
  to authenticated
  using (author_id = auth.uid() or profile_id = auth.uid());

-- ============================================================================
-- DEPOIMENTOS
-- Testemunho permanente sobre o perfil, escrito por um amigo. Diferente de
-- recado: fica pendente até o dono do perfil aprovar (mecânica clássica do
-- Orkut), e só aparece publicamente depois de aprovado.
-- ============================================================================
create table if not exists public.depoimentos (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,

  constraint depoimento_unique_pair unique (profile_id, author_id)
);

create index if not exists depoimentos_profile_status_idx
  on public.depoimentos (profile_id, status, created_at desc);

alter table public.depoimentos enable row level security;

-- Aprovados: qualquer um que pode ver o perfil. Pendentes/rejeitados: só o
-- dono do perfil (pra moderar) e o próprio autor (pra ver o status do que escreveu).
create policy "depoimentos_select_approved_or_involved"
  on public.depoimentos for select
  to authenticated
  using (
    (status = 'approved' and (profile_id = auth.uid() or public.are_friends(auth.uid(), profile_id)))
    or profile_id = auth.uid()
    or author_id = auth.uid()
  );

create policy "depoimentos_insert_if_friends"
  on public.depoimentos for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and author_id <> profile_id
    and public.are_friends(auth.uid(), profile_id)
  );

-- Só o dono do perfil aprova/rejeita (é o único campo que ele pode mudar).
create policy "depoimentos_update_owner_moderation"
  on public.depoimentos for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "depoimentos_delete_author_or_owner"
  on public.depoimentos for delete
  to authenticated
  using (author_id = auth.uid() or profile_id = auth.uid());

-- ============================================================================
-- FÃS
-- Relação unidirecional "sou fã de" — não exige amizade mútua (diferente do
-- friendships). Usada só para o contador/lista de fãs, sem afetar feed/mensageiro.
-- ============================================================================
create table if not exists public.fans (
  fan_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (fan_id, target_id),
  constraint no_self_fan check (fan_id <> target_id)
);

create index if not exists fans_target_idx on public.fans (target_id);

alter table public.fans enable row level security;

-- Lista/contagem de fãs é pública (assim como no Orkut e no Angiru — é uma
-- métrica de leitura passiva, nunca usada para reordenar feed, seção 3.7).
create policy "fans_select_all_authenticated"
  on public.fans for select
  to authenticated
  using (true);

create policy "fans_insert_own"
  on public.fans for insert
  to authenticated
  with check (fan_id = auth.uid());

create policy "fans_delete_own"
  on public.fans for delete
  to authenticated
  using (fan_id = auth.uid());

-- ============================================================================
-- SELOS DE PERFIL (fiel / legal / sexy)
-- Reação rápida estilo Orkut: um voto por tipo, por pessoa, por perfil.
-- Igual ao selo de verificação (seção 4.1), isso é só exibição — não afeta
-- em nada a ordem do feed nem alcance (princípio da seção 3.7).
-- ============================================================================
create table if not exists public.profile_badges (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  badge_type text not null check (badge_type in ('fiel', 'legal', 'sexy')),
  created_at timestamptz not null default now(),
  primary key (profile_id, voter_id, badge_type),
  constraint no_self_badge check (profile_id <> voter_id)
);

create index if not exists profile_badges_profile_idx on public.profile_badges (profile_id, badge_type);

alter table public.profile_badges enable row level security;

create policy "profile_badges_select_all_authenticated"
  on public.profile_badges for select
  to authenticated
  using (true);

create policy "profile_badges_insert_own_vote"
  on public.profile_badges for insert
  to authenticated
  with check (voter_id = auth.uid());

create policy "profile_badges_delete_own_vote"
  on public.profile_badges for delete
  to authenticated
  using (voter_id = auth.uid());

-- ============================================================================
-- FIM da migration "perfil completo".
-- Ainda fora de escopo (deliberado, ver conversa de produto): "quem sou" em
-- áudio (fica texto por enquanto) e apps de terceiros plugáveis no perfil.
-- ============================================================================
