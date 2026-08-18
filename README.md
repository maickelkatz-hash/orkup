# OrkUp — núcleo do app (MVP)

Este é o código real do OrkUp: cadastro/login com confirmação de e-mail,
perfil com foto, timeline/feed **estritamente cronológico** (sem
algoritmo), comunidades/fórum ("bolhas" separadas), upload de fotos
(avatar e posts), mensageiro em tempo real restrito a amigos aceitos,
Páginas Públicas (empresas/marcas/criadores) e a base do Amigo virtual de
IA (18+, com detecção de sinais de crise) — construído com Next.js (App
Router) + Supabase.

Ainda **não** incluídos (ver `orkup-spec-produto.md`): selo de
verificação pago, moderação automática de conteúdo (OpenAI/Rekognition),
chamada real ao modelo de IA (hoje é um stub — ver seção 8), Cloudflare
R2 para mídia (hoje as fotos vão para o Supabase Storage, que é
suficiente para o piloto).

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Supabase** (Postgres + Auth + Row Level Security + Storage + Realtime) como backend
- Hospedagem recomendada: **Vercel** (frontend) + **Supabase Cloud** (banco/auth)

## 1. Criar o projeto Supabase

1. Crie uma conta gratuita em https://supabase.com e um novo projeto.
2. No painel do projeto, vá em **SQL Editor** e rode, **nesta ordem**,
   cada um dos arquivos de `supabase/migrations/`:
   1. `0001_init.sql` — schema núcleo (profiles, posts, likes, comments,
      communities, community_members, topics, replies, friendships).
   2. `0002_storage.sql` — coluna `image_url` em posts + buckets de
      Storage (`avatars`, `post-images`) para upload de foto.
   3. `0003_messenger.sql` — conversas/mensagens em tempo real, restritas
      a amigos aceitos.
   4. `0004_public_pages.sql` — Páginas Públicas (seguidores, posts de
      página no mesmo feed cronológico).
   5. `0005_ai_companion.sql` — base do Amigo virtual de IA (portão de
      idade 18+, histórico de conversa isolado por usuário).
3. Em **Project Settings → API**, copie:
   - `Project URL`
   - a chave publicável (`sb_publishable_...`, formato novo — substitui a
     antiga `anon` key)

### 1.1 Passos manuais no painel do Supabase (não ficam em SQL)

- **Auth → Providers → Email**: ligue a opção **Confirm email** (exige
  confirmação por e-mail antes do primeiro login). Sem isso, o fluxo de
  "confirme seu e-mail" do app fica sem efeito prático.
- **Auth → URL Configuration → Redirect URLs**: adicione a URL de
  produção do site (ex.: `https://orkup.vercel.app/**`) — sem isso, o
  link de confirmação de e-mail que o Supabase manda não funciona em
  produção, só localmente.

## 2. Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_sua-chave-aqui
NEXT_PUBLIC_SITE_URL=https://orkup.vercel.app
```

`NEXT_PUBLIC_SITE_URL` é usada para montar o link de confirmação de
e-mail — em desenvolvimento local, deixe como `http://localhost:3000`.

**Nunca** coloque a chave secreta (`sb_secret_...`, equivalente à antiga
`service_role`) em uma variável `NEXT_PUBLIC_*` — ela dá acesso total ao
banco, ignorando as regras de privacidade. Esta aplicação não usa a
chave secreta em lugar nenhum.

### 2.1 Amigo virtual de IA — chamada real ao modelo (opcional por enquanto)

A conversa com o Amigo IA funciona hoje em modo "stub": responde de forma
transparente que a IA de verdade ainda não está configurada, mas todo o
resto (portão de idade 18+, histórico isolado por usuário, detecção de
sinais de crise com direcionamento ao CVV) já está ativo. Quando quiser
ligar a IA de verdade (seção 11.1 da spec — Gemini como principal), basta
adicionar `GEMINI_API_KEY` nas variáveis de ambiente e implementar a
chamada real em `src/lib/ai/reply.ts` (o ponto de entrada já está
isolado ali, com o TODO marcado).

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — você poderá criar uma conta, postar (com
foto), curtir, comentar, adicionar amigos, trocar mensagens com amigos
aceitos, criar/seguir Páginas e conversar com o Amigo IA.

Para conferir que está tudo certo antes de publicar:

```bash
npm run build
npm run lint
```

## 4. Colocar no GitHub

```bash
git init   # se ainda não foi feito
git add .
git commit -m "OrkUp"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/orkup.git
git push -u origin main
```

`.env.local` já está no `.gitignore` — suas chaves não vão para o
GitHub.

**Sem terminal à mão (ex.: pelo celular)?** Dá pra editar arquivos direto
pelo site do GitHub: abra o arquivo em `github.com/SEU-USUARIO/orkup`,
clique no ícone de lápis (editar), faça a mudança e clique em
"Commit changes" direto na branch `main`. Funciona bem para ajustes
pontuais em um ou poucos arquivos; para publicar várias mudanças de uma
vez (como este pacote), o caminho do terminal abaixo é mais prático.

## 5. Deploy na Vercel

1. Crie uma conta em https://vercel.com (pode entrar com o GitHub).
2. **Add New → Project** → selecione o repositório `orkup`.
3. Em **Environment Variables**, adicione as três variáveis do
   `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` — esta última
   com a URL de produção, ex. `https://orkup.vercel.app`).
4. Deploy. A cada `git push` na branch `main`, a Vercel publica
   automaticamente a nova versão.
5. Se você já tinha o projeto publicado antes desta leva de mudanças,
   adicione `NEXT_PUBLIC_SITE_URL` nas variáveis de ambiente existentes
   e clique em **Redeploy** (variável nova só entra em vigor em um
   redeploy, não é aplicada em builds já publicados).
6. O plano gratuito ("Hobby") da Vercel tem restrição de uso comercial —
   quando o OrkUp começar a exibir anúncios do Google AdSense, é preciso
   migrar para o plano **Pro** (US$20/mês).

## 6. Estrutura do projeto

```
src/
  app/
    page.tsx                        → landing (redireciona para /feed se já logado)
    login/page.tsx                  → login
    cadastro/page.tsx               → criação de conta
    confirmar-email/page.tsx        → tela "confirme seu e-mail" + reenviar
    auth/confirm/route.ts           → Route Handler que valida o link de confirmação
    (app)/layout.tsx                → layout autenticado (navbar, exige login)
    (app)/feed/page.tsx             → timeline cronológica + criar post (texto/foto)
    (app)/perfil/[username]/        → perfil, upload de avatar, posts, pedido de amizade
    (app)/comunidades/              → lista/criação de comunidades
    (app)/comunidades/[id]/         → tópicos da comunidade
    .../topicos/[topicId]/          → respostas de um tópico
    (app)/mensagens/                → lista de conversas (amigos aceitos)
    (app)/mensagens/[username]/     → chat 1:1 em tempo real
    (app)/paginas/                  → lista/criação de Páginas Públicas
    (app)/paginas/[slug]/           → perfil da página, seguir, postar (dono)
    (app)/amigo-ia/                 → portão de idade + chat com o Amigo IA
  lib/
    supabase/                       → clientes Supabase (browser, server, proxy)
    actions/                        → Server Actions (posts, amizades, comunidades,
                                       auth, mídia, mensagens, páginas, IA)
    data/                           → funções de leitura de dados (feed, perfil, página)
    ai/reply.ts                     → detecção de crise + geração de resposta (stub)
  components/                       → Navbar, PostCard, Avatar, ChatWindow
proxy.ts                            → sessão do Supabase + proteção de rotas privadas
supabase/migrations/
  0001_init.sql                     → schema núcleo + RLS
  0002_storage.sql                  → upload de fotos (avatar/posts)
  0003_messenger.sql                → mensageiro em tempo real
  0004_public_pages.sql             → Páginas Públicas
  0005_ai_companion.sql             → base do Amigo virtual de IA
```

**Nota sobre `proxy.ts`**: no Next.js 16 o arquivo `middleware.ts` foi
renomeado para `proxy.ts` (mesmo comportamento, nome novo). Se você usar
IA/tutoriais baseados em versões antigas do Next.js, não se surpreenda
com essa diferença.

## 7. Regras de privacidade que valem a pena lembrar

- **Feed sempre cronológico**: nenhuma tabela ou coluna de "score"/ranking
  existe no schema — não é uma escolha de configuração, é uma ausência
  estrutural (seção 3.7 da spec).
- **Mensageiro só entre amigos aceitos**: a função
  `get_or_create_conversation()` recusa qualquer tentativa entre pessoas
  que não sejam amigos mútuos, mesmo que alguém tente burlar a UI e
  chamar a API direto.
- **Amigo IA restrito a 18+**: `get_or_create_ai_conversation()` recusa
  se a data de nascimento auto-declarada indicar menos de 18 anos, ou se
  ainda não foi informada — a checagem vive no banco, não só na tela.
- **Selo de verificação nunca aumenta alcance**: quando for implementado,
  não deve mexer em nenhuma query de ordenação — o feed não tem
  parâmetro de prioridade para isso existir.

## 8. Próximos passos (fora desta entrega)

Seguindo o roadmap do `orkup-spec-produto.md`:

1. Moderação automática de conteúdo (OpenAI omni-moderation + Amazon
   Rekognition) antes de um post/imagem ficar visível.
2. Selo de verificação pago (perfis e páginas), via API de consulta de
   CPF/CNPJ — sem qualquer aumento de alcance.
3. Chamada real ao modelo de IA no Amigo virtual (Gemini como principal,
   Groq como respaldo, cache de respostas repetidas) — ver seção 2.1
   acima.
4. Cloudflare R2 para mídia (hoje usa Supabase Storage, que já resolve o
   piloto, mas R2 não cobra taxa de saída de dados a longo prazo).
5. Banner de consentimento de cookies em três camadas (LGPD/ANPD) antes
   de ligar anúncios personalizados do Google AdSense.
