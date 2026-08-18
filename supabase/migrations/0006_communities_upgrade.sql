-- OrkUp - Comunidades: foto + poderes de moderador/dono
-- Rode este arquivo no SQL Editor do Supabase DEPOIS do 0001 até 0005.
--
-- Cobre dois problemas encontrados em teste: (1) comunidade não tinha
-- campo de foto; (2) quem criou a comunidade (creator_id) não tinha
-- nenhum poder além dos outros membros, apesar da spec (seção 3.3)
-- prever "cada comunidade tem um dono/moderador local, responsável
-- pelas regras daquele espaço".

-- ============================================================================
-- COMMUNITIES: foto
-- ============================================================================
alter table public.communities
  add column if not exists avatar_url text;

-- Reaproveita o bucket "avatars" já criado na migration 0002. A policy de
-- storage de lá só libera escrita dentro da PRÓPRIA pasta do usuário
-- (storage.foldername(name))[1] = auth.uid()), então o upload de foto de
-- comunidade usa o caminho {user_id}/community-{community_id}.{ext} — só
-- quem é dono da comunidade tenta gravar ali (reforçado também na Server
-- Action, que só deixa o creator_id fazer upload), sem precisar de
-- nenhuma policy de storage nova.

-- ============================================================================
-- TOPICS: dono da comunidade também pode remover (moderação)
-- Continua existindo topics_delete_own (autor do próprio tópico); isso
-- soma um segundo caminho, não substitui.
-- ============================================================================
create policy "topics_delete_by_community_creator"
  on public.topics for delete
  to authenticated
  using (
    exists (
      select 1 from public.communities c
      where c.id = community_id and c.creator_id = auth.uid()
    )
  );

-- ============================================================================
-- REPLIES: idem, dono da comunidade pode remover resposta de qualquer um
-- ============================================================================
create policy "replies_delete_by_community_creator"
  on public.replies for delete
  to authenticated
  using (
    exists (
      select 1 from public.topics t
      join public.communities c on c.id = t.community_id
      where t.id = topic_id and c.creator_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMUNITY_MEMBERS: dono da comunidade pode remover um membro (kick)
-- Continua existindo community_members_delete_own (sair por conta própria).
-- ============================================================================
create policy "community_members_delete_by_creator"
  on public.community_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.communities c
      where c.id = community_id and c.creator_id = auth.uid()
    )
  );
