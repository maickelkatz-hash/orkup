-- OrkUp - upload de fotos (avatar de perfil e imagem em posts)
-- Rode este arquivo no SQL Editor do Supabase DEPOIS do 0001_init.sql.
--
-- Estratégia de custo baixo (ver orkup-spec-produto.md, seção 6.1):
-- por enquanto usamos o Supabase Storage (incluso no plano gratuito, 1GB),
-- em vez de já contratar Cloudflare R2. Migrar para R2 depois é só trocar
-- o destino do upload nas actions, sem mudar o restante do app.

-- ============================================================================
-- COLUNA image_url EM POSTS
-- Post agora pode ser só foto (sem texto) — por isso relaxamos a
-- obrigatoriedade de texto mínimo e passamos a exigir "texto OU imagem".
-- ============================================================================
alter table public.posts
  add column if not exists image_url text;

alter table public.posts
  drop constraint if exists posts_body_check;

alter table public.posts
  add constraint posts_body_length check (char_length(body) <= 2000);

alter table public.posts
  add constraint posts_body_or_image check (char_length(body) > 0 or image_url is not null);

-- ============================================================================
-- BUCKETS
-- Ambos públicos para leitura (a foto precisa ser exibida no feed sem
-- autenticação extra) — a escrita continua restrita por policy abaixo.
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('avatars', 'avatars', true, 5242880) -- 5MB
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values ('post-images', 'post-images', true, 5242880) -- 5MB
on conflict (id) do nothing;

-- ============================================================================
-- POLICIES — cada usuário só escreve dentro da própria pasta
-- (ex: avatars/<user_id>/foto.jpg). Leitura é liberada pra qualquer um,
-- já que os buckets são públicos.
-- ============================================================================
create policy "avatars_read_public"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "avatars_write_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own_folder"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "post_images_read_public"
  on storage.objects for select
  to public
  using (bucket_id = 'post-images');

create policy "post_images_write_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "post_images_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);
