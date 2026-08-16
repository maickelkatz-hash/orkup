# OrkUp — núcleo do app (MVP)

Este é o código real do OrkUp: cadastro/login, perfil, timeline/feed
**estritamente cronológico** (sem algoritmo) e comunidades/fórum ("bolhas"
separadas), construído com Next.js (App Router) + Supabase.

Ainda **não** incluídos nesta primeira fatia (ver `orkup-spec-produto.md`,
seção 13): mensageiro em tempo real, Páginas Públicas, selo de verificação
pago e o amigo virtual de IA. Esses vêm em iterações seguintes, sobre esta
mesma base.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Supabase** (Postgres + Auth + Row Level Security) como backend
- Hospedagem recomendada: **Vercel** (frontend) + **Supabase Cloud** (banco/auth)

## 1. Criar o projeto Supabase

1. Crie uma conta gratuita em https://supabase.com e um novo projeto.
2. No painel do projeto, vá em **SQL Editor** → cole todo o conteúdo de
   `supabase/migrations/0001_init.sql` → **Run**. Isso cria todas as
   tabelas (profiles, posts, likes, comments, communities,
   community_members, topics, replies, friendships) já com as regras de
   privacidade (Row Level Security) aplicadas — por exemplo, um post só é
   visível para o próprio autor e para amigos aceitos dele.
3. Em **Project Settings → API**, copie:
   - `Project URL`
   - `anon public` key

## 2. Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha com os valores do
passo anterior:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Nunca** coloque a chave `service_role` do Supabase em uma variável
`NEXT_PUBLIC_*` — ela dá acesso total ao banco, ignorando as regras de
privacidade.

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — você poderá criar uma conta, postar, curtir,
comentar, adicionar amigos e criar/participar de comunidades.

Para conferir que está tudo certo antes de publicar:

```bash
npm run build
npm run lint
```

## 4. Colocar no GitHub

```bash
git init   # se ainda não foi feito
git add .
git commit -m "OrkUp: núcleo (auth, perfil, feed cronológico, comunidades)"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/orkup.git
git push -u origin main
```

`.env.local` já está no `.gitignore` — suas chaves não vão para o GitHub.

## 5. Deploy na Vercel

1. Crie uma conta em https://vercel.com (pode entrar com o GitHub).
2. **Add New → Project** → selecione o repositório `orkup`.
3. Em **Environment Variables**, adicione as mesmas duas variáveis do
   `.env.local`.
4. Deploy. A cada `git push` na branch `main`, a Vercel publica
   automaticamente a nova versão.
5. O plano gratuito ("Hobby") da Vercel tem restrição de uso comercial —
   quando o OrkUp começar a exibir anúncios do Google AdSense, é preciso
   migrar para o plano **Pro** (US$20/mês).

## 6. Estrutura do projeto

```
src/
  app/
    page.tsx                  → landing (redireciona para /feed se já logado)
    login/page.tsx            → login
    cadastro/page.tsx         → criação de conta
    (app)/layout.tsx          → layout autenticado (navbar, exige login)
    (app)/feed/page.tsx       → timeline cronológica + criar post
    (app)/perfil/[username]/  → perfil, posts do usuário, pedido de amizade
    (app)/comunidades/        → lista/criação de comunidades
    (app)/comunidades/[id]/   → tópicos da comunidade
    .../topicos/[topicId]/    → respostas de um tópico
  lib/
    supabase/                 → clientes Supabase (browser, server, proxy)
    actions/                  → Server Actions (mutações: posts, amizades, comunidades, auth)
    data/                     → funções de leitura de dados (feed, perfil)
  components/                 → Navbar, PostCard
proxy.ts                      → sessão do Supabase + proteção de rotas privadas
supabase/migrations/0001_init.sql → schema completo do banco + RLS
```

**Nota sobre `proxy.ts`**: no Next.js 16 o arquivo `middleware.ts` foi
renomeado para `proxy.ts` (mesmo comportamento, nome novo). Se você usar
IA/tutoriais baseados em versões antigas do Next.js, não se surpreenda
com essa diferença.

## 7. Próximos passos (fora desta entrega)

Seguindo o roadmap do `orkup-spec-produto.md`:

1. Mensageiro em tempo real (Supabase Realtime), restrito a amigos aceitos.
2. Moderação automática de conteúdo (OpenAI omni-moderation + Amazon
   Rekognition) antes de um post/imagem ficar visível.
3. Páginas Públicas (empresas/pessoas, seguidores, integradas ao mesmo
   feed cronológico).
4. Selo de verificação pago (perfis e páginas) — sem qualquer aumento de
   alcance.
5. Amigo virtual de IA, com guarda-corpos de segurança (18+, detecção de
   crise com direcionamento ao CVV/188).
6. Upload de foto de perfil/posts via Cloudflare R2.
