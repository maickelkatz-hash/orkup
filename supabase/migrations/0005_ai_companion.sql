-- OrkUp - Amigo virtual de IA (botão "conversar com IA") — base
-- Rode este arquivo no SQL Editor do Supabase DEPOIS do 0001, 0002, 0003 e 0004.
--
-- Escopo desta migration (seção 11 da spec): schema de conversa isolado por
-- usuário, restrito a maiores de 18 anos por verificação de data de
-- nascimento auto-declarada. A chamada real ao modelo de IA é feita pela
-- aplicação (stub até existir uma chave de API de LLM configurada) — aqui
-- só garantimos que NENHUMA mensagem de um menor de idade chega a existir
-- no banco, e que toda mensagem carrega uma flag de possível sinal de
-- crise (seção 10.3/11.3) pra UI poder priorizar acolhimento e recursos
-- de ajuda (CVV 188) em vez de só responder normalmente.

-- ============================================================================
-- PROFILES: data de nascimento auto-declarada
-- Só usada, por enquanto, pra liberar o Amigo IA (18+). Não é verificação
-- documental — a spec (seção 11.3/4.1) já prevê que verificação forte de
-- identidade (CPF/CNPJ) é um processo separado e pago (selo de verificação).
-- ============================================================================
alter table public.profiles
  add column if not exists birthdate date;

-- ============================================================================
-- AI_CONVERSATIONS
-- Uma conversa por usuário — simples e suficiente pro escopo "base" de hoje.
-- ============================================================================
create table if not exists public.ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.ai_conversations enable row level security;

create policy "ai_conversations_select_own"
  on public.ai_conversations for select
  to authenticated
  using (user_id = auth.uid());

-- Sem policy de insert direto: só a função get_or_create_ai_conversation()
-- (security definer, abaixo) cria linhas aqui, porque ela é quem checa a
-- idade antes de liberar. Inserir direto pela API burlaria a checagem.

-- ============================================================================
-- AI_MESSAGES
-- ============================================================================
create table if not exists public.ai_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  body text not null check (char_length(body) <= 4000),
  -- Sinal (palavras-chave) de possível crise emocional/ideação suicida
  -- detectado no momento do envio — usado pela UI pra sempre mostrar o
  -- recurso de ajuda (CVV 188) com destaque quando true.
  flagged_crisis boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ai_messages_conversation_created_idx
  on public.ai_messages (conversation_id, created_at asc);

alter table public.ai_messages enable row level security;

create policy "ai_messages_select_own"
  on public.ai_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "ai_messages_insert_own"
  on public.ai_messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- ============================================================================
-- get_or_create_ai_conversation()
-- Único jeito de conseguir um conversation_id — recusa se o usuário não
-- tiver 18 anos completos pela data de nascimento auto-declarada (ou se
-- ainda não declarou).
-- ============================================================================
create or replace function public.get_or_create_ai_conversation()
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_birthdate date;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select birthdate into v_birthdate from public.profiles where id = auth.uid();

  if v_birthdate is null then
    raise exception 'birthdate_not_set';
  end if;

  if v_birthdate > (current_date - interval '18 years')::date then
    raise exception 'must_be_18_or_older';
  end if;

  select id into v_id from public.ai_conversations where user_id = auth.uid();

  if v_id is null then
    insert into public.ai_conversations (user_id) values (auth.uid())
    returning id into v_id;
  end if;

  return v_id;
end;
$$;
