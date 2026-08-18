-- OrkUp - mensageiro em tempo real
-- Rode este arquivo no SQL Editor do Supabase DEPOIS do 0001 e 0002.
--
-- Regra inegociável (spec, seção 3.4): mensagens só entre amigos aceitos,
-- "privacidade sempre". Por isso a criação de conversa só acontece via
-- função (get_or_create_conversation), que confere amizade antes de
-- qualquer coisa — não existe policy de INSERT direta na tabela
-- conversations, então não dá pra criar uma conversa contornando a checagem.

-- ============================================================================
-- CONVERSATIONS
-- user_a_id é sempre o menor UUID dos dois participantes — isso garante
-- que só existe UMA conversa por par de amigos (sem duplicar).
-- ============================================================================
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint conversation_canonical_order check (user_a_id < user_b_id),
  constraint conversation_unique_pair unique (user_a_id, user_b_id)
);

alter table public.conversations enable row level security;

create policy "conversations_select_participant"
  on public.conversations for select
  to authenticated
  using (auth.uid() in (user_a_id, user_b_id));

-- Sem policy de insert/update/delete de propósito: só a função abaixo
-- (security definer) pode criar uma conversa.

create or replace function public.get_or_create_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  conv_id uuid;
  low uuid;
  high uuid;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if me = other_user_id then
    raise exception 'não é possível conversar consigo mesmo';
  end if;
  if not public.are_friends(me, other_user_id) then
    raise exception 'mensagens só entre amigos aceitos';
  end if;

  if me < other_user_id then
    low := me; high := other_user_id;
  else
    low := other_user_id; high := me;
  end if;

  insert into public.conversations (user_a_id, user_b_id)
  values (low, high)
  on conflict (user_a_id, user_b_id) do nothing;

  select id into conv_id
  from public.conversations
  where user_a_id = low and user_b_id = high;

  return conv_id;
end;
$$;

-- ============================================================================
-- MESSAGES
-- ============================================================================
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at asc);

alter table public.messages enable row level security;

create policy "messages_select_participant"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and auth.uid() in (c.user_a_id, c.user_b_id)
    )
  );

create policy "messages_insert_if_still_friends"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and auth.uid() in (c.user_a_id, c.user_b_id)
        and public.are_friends(c.user_a_id, c.user_b_id)
    )
  );

-- Permite só marcar como lida (o trigger abaixo bloqueia editar o resto).
create policy "messages_update_participant"
  on public.messages for update
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and auth.uid() in (c.user_a_id, c.user_b_id)
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and auth.uid() in (c.user_a_id, c.user_b_id)
    )
  );

create or replace function public.protect_message_edits()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.body <> old.body
     or new.sender_id <> old.sender_id
     or new.conversation_id <> old.conversation_id then
    raise exception 'mensagens não podem ser editadas, só marcadas como lidas';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_protect_edits on public.messages;
create trigger messages_protect_edits
  before update on public.messages
  for each row execute function public.protect_message_edits();

-- Marca como lidas todas as mensagens recebidas (não enviadas por mim)
-- numa conversa. Mais simples e seguro do que deixar o client fazer
-- update em massa direto.
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.messages
  set read_at = now()
  where conversation_id = p_conversation_id
    and sender_id <> auth.uid()
    and read_at is null
    and exists (
      select 1 from public.conversations c
      where c.id = p_conversation_id
        and auth.uid() in (c.user_a_id, c.user_b_id)
    );
end;
$$;

-- ============================================================================
-- REALTIME
-- Sem isso, o Supabase Realtime não envia eventos de INSERT/UPDATE dessa
-- tabela para os clientes inscritos.
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
