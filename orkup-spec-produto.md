# OrkUp — Especificação de Produto (MVP com foco no Brasil)

*Documento de trabalho — v4, agosto de 2026*

## 1. Visão geral

OrkUp é uma rede social regional inspirada no Orkut, focada em cinco pilares: perfil/timeline, postagens com fotos, um fórum de comunidades no estilo do Orkut original — onde grupos temáticos ficam relativamente isolados uns dos outros, reduzindo o atrito entre "bolhas" diferentes da internet que hoje se cruzam (e brigam) em redes como X e Facebook — e um mensageiro privado só entre amigos, sem contato de desconhecidos.

A monetização inicial será via **Google AdSense** (anúncios de display), sem depender de outros negócios para sustentar a operação. O cadastro é **aberto ao mundo todo desde o início** — sem barreira geográfica técnica —, mas o foco de marketing, idioma da interface e construção de comunidades-semente é o **Brasil**.

## 2. Público-alvo e piloto

- **Público primário**: pessoas de 28–45 anos que usaram Orkut entre 2004–2012 e sentem falta daquele formato — nostalgia como gancho de aquisição inicial.
- **Público secundário**: comunidades locais/regionais (bairro, cidade, hobby, profissão) que hoje não têm um espaço próprio e se sentem deslocadas em redes generalistas.
- **Piloto**: escolher **uma cidade ou região metropolitana específica no Brasil** para concentrar o esforço de construção de comunidade no lançamento fechado, mesmo com o cadastro tecnicamente aberto a qualquer pessoa no mundo. Sugestão de critério de escolha: onde já exista uma comunidade offline ou grupo de WhatsApp/Facebook nostálgico de Orkut ativo, que possa ser convidado como base inicial (resolve parte do problema do "ovo e da galinha").

### 2.1 Acesso global, foco regional — o que isso muda na prática

Vale separar duas coisas que são fáceis de confundir: **acesso** (quem tecnicamente consegue se cadastrar) e **foco de mercado** (onde a energia de marketing e construção de comunidade é investida). A decisão aqui foi não colocar nenhuma barreira técnica de acesso — qualquer pessoa no mundo pode criar conta — enquanto a interface, o idioma (português) e a estratégia de aquisição continuam 100% concentrados no Brasil.

Isso tem baixo custo de engenharia: a arquitetura já recomendada (seção 6) — Cloudflare R2 para mídia, moderação via OpenAI (cobre 40+ idiomas) — já é global por natureza. Não existe uma versão "só Brasil" dela que seria estruturalmente mais barata, então não abrir mão de acesso internacional não adiciona complexidade técnica relevante.

O ponto de atenção real é regulatório, não técnico — ver seção 5.1.

## 3. Escopo do MVP

### 3.1 Perfil e timeline
- Perfil com foto, bio curta, "recados" (feature clássica do Orkut — mensagens públicas no perfil de outra pessoa).
- Timeline cronológica simples (sem algoritmo de engajamento agressivo no início — reduz complexidade técnica e reduz risco de viciar/irritar o usuário).
- Álbuns de fotos por perfil.

### 3.2 Feed de postagens
- Postagem de texto + foto, curtidas e comentários.
- Feed por padrão mostra: amigos + comunidades que o usuário participa. Sem anúncio de terceiros misturado ao conteúdo social no MVP inicial (anúncios ficam em posições dedicadas — ver seção 5).

### 3.3 Comunidades / Fórum (o diferencial)
- Estrutura de "comunidades" com tópicos de discussão, como o Orkut original.
- Cada comunidade é **auto-contida**: seus tópicos não aparecem misturados no feed geral de quem não participa, e não há mecanismo de "viralização cruzada" (sem retweet/compartilhamento automático entre comunidades diferentes). Isso é o que preserva a separação de bolhas.
- Moderação própria por comunidade: cada comunidade tem um dono/moderador local, responsável pelas regras daquele espaço — como já funcionava no Orkut.
- Moderação da plataforma (nível OrkUp): regras mínimas globais (proibição de conteúdo ilegal, discurso de ódio, assédio) aplicadas a todas as comunidades, com denúncia simples e revisão manual no início (equipe pequena/você mesmo, dado o tamanho regional do piloto).

### 3.4 Mensageiro (chat em tempo real)

Chat privado 1:1, com regra de privacidade rígida por design — reflete o mesmo espírito de "sem briga de bolhas que se cruzam" aplicado agora a mensagens diretas:

- **Só entre amigos confirmados**: só é possível enviar mensagem para quem já é amigo mútuo (pedido de amizade aceito dos dois lados). Não existe "solicitação de mensagem" de desconhecido chegando na caixa de entrada, nem prévia de conteúdo de quem não é amigo — ao contrário do modelo Instagram/Facebook, aqui não há essa porta intermediária.
- **Desfazer amizade corta o canal**: ao desfazer amizade, a conversa anterior fica arquivada só para quem já a tinha, mas nenhum dos dois consegue mais enviar mensagem novas ao outro.
- **Bloqueio explícito**: bloquear um usuário impede qualquer contato futuro (mensagem, visualização de perfil, pedido de amizade), reversível só pela vítima do bloqueio.
- **Status "online agora"**: visível por padrão apenas para amigos, com opção de desativar completamente nas configurações de privacidade (usuário pode aparecer sempre como offline).
- **Confirmação de leitura**: opcional e configurável por usuário (liga/desliga), nunca ativada por padrão sem escolha explícita.
- **Sem grupo no MVP**: chat em grupo fica fora do escopo inicial — adiciona complexidade de moderação (voltamos ao problema de "bolhas se cruzando" dentro de um grupo) sem ser essencial para validar o piloto.

### 3.5 Stories — recomendação: fora do MVP

Avaliei incluir Stories (posts efêmeros de 24h, estilo Instagram) e recomendo **deixar fora do lançamento inicial**, por dois motivos:

- **Coerência de posicionamento**: Stories é um mecanismo desenhado para gerar checagem compulsiva e ansiedade de "perder o momento" (FOMO) — vai na direção oposta do clima calmo e nostálgico que é o diferencial do OrkUp. Vale validar primeiro se o público que busca essa experiência sente falta disso.
- **Custo na fase errada**: é a feature de mídia mais cara de sustentar (fluxo constante de foto/vídeo novo), justamente na fase em que o objetivo é gastar pouco e validar.

Se, depois do piloto, os usuários pedirem essa feature, o desenho recomendado para uma "fase 2" seria propositalmente mais simples que o do Instagram: sem filtro, sem efeito de realidade aumentada, sem trilha sonora — só foto/vídeo curto (máx. 15s) com expiração automática em 24h. Um efeito colateral interessante: como o conteúdo expira, o armazenamento não cresce indefinidamente como os posts permanentes — é a única feature de mídia cujo custo se autolimita com o tempo.

### 3.6 Páginas Públicas (empresas, marcas e figuras públicas)

Além do perfil pessoal (baseado em amizade mútua), o OrkUp terá um segundo tipo de conta para quem quer publicar abertamente: empresas, marcas, criadores de conteúdo, políticos, veículos de notícia locais etc.

- **Baseada em "seguir", não em amizade mútua**: qualquer pessoa pode seguir uma Página sem pedido de aceite — é uma relação de transmissão unidirecional, diferente do modelo de amizade do perfil pessoal (seção 3.4).
- **Visibilidade em dois lugares**: os posts de uma Página aparecem (a) na timeline pública da própria Página — acessível a qualquer visitante, inclusive sem estar logado, o que ajuda em busca/descoberta orgânica — e (b) no feed de quem a segue, misturados cronologicamente com posts de amigos, **nunca em destaque especial** (ver princípio na seção 3.7).
- **Múltiplos administradores**: uma Página pode ter mais de uma pessoa da equipe com acesso de publicação — útil para empresas com time de social media.
- **Sem mensageiro aberto por padrão**: mantém a mesma filosofia de privacidade do restante do produto — a Página não recebe mensagem direta de qualquer seguidor por padrão, só de quem ela decidir liberar.
- **Métricas visíveis**: contagem de seguidores e de visualizações da própria página — informação passiva de leitura, nunca usada para alterar a ordem de exibição de nada (reforça a seção 3.7).

### 3.7 Princípio de produto: timeline sempre cronológica, sem exceção

Este é um princípio de design não-negociável do OrkUp, e vale para todo mundo — perfil pessoal e Página Pública, verificada ou não: **a timeline e o feed são ordenados exclusivamente por ordem de publicação, do mais recente para o mais antigo. Não existe, e não está previsto existir, nenhum algoritmo de relevância, engajamento ou pagamento que reordene o que aparece.**

Isso é uma decisão consciente de posicionamento, coerente com o resto do produto (nenhuma feature foi desenhada para maximizar tempo de tela — ver decisão sobre Stories na seção 3.5 e sobre o amigo virtual de IA na seção 11.3): o algoritmo de engajamento é, historicamente, um dos principais motores das brigas de bolhas que o OrkUp quer evitar, porque prioriza conteúdo que gera reação forte (raiva, indignação) em vez de conteúdo relevante pra quem segue. Sem algoritmo, essa dinâmica simplesmente não tem como existir.

Essa regra também simplifica a promessa do selo de verificação (seção 4.1): como não existe nenhum mecanismo de priorização, verificação **não pode**, por construção, comprar mais alcance — não é uma escolha de política que poderia mudar depois, é uma consequência direta de como o produto é desenhado.

## 4. Monetização — Google AdSense

Pesquisei os requisitos atuais do Google para isso, porque conteúdo gerado por usuário tem uma regra específica que precisa entrar no design técnico desde já.

- **Regra técnica central**: para veicular anúncios ao lado de conteúdo gerado pelo usuário (posts, comentários, tópicos de fórum), o Google exige que exista uma **versão web equivalente e acessível por URL exata** daquele mesmo conteúdo, para que o rastreador do Google consiga avaliá-lo antes de decidir qual anúncio mostrar. Isso reforça a decisão de lançar como **web/PWA** (não app nativo fechado) — cada post e tópico de fórum já nasce com URL própria e pública.
- **Posicionamento recomendado no MVP**: anúncios em posições dedicadas (topo/lateral de timeline, entre tópicos do fórum, rodapé de perfil), evitando intercalar anúncio dentro do fluxo de comentários/postagens no início — isso simplifica a conformidade com a regra de "conteúdo equivalente" e evita atrito de experiência.
- **Brand safety**: como a proposta do produto já separa comunidades e modera localmente, isso ajuda a evitar que anúncios apareçam ao lado de conteúdo impróprio — mas a moderação mínima (seção 3.3) precisa estar funcionando **antes** de submeter o site para aprovação do AdSense, não depois.
- **Expectativa de receita**: não há tráfego mínimo oficial exigido para aprovação, mas receita real de AdSense é proporcional a page views. Numa fase de piloto regional (milhares, não milhões, de usuários), a receita tende a ser baixa nos primeiros meses — trate como validação do modelo, não como fonte de caixa relevante ainda.

### 4.1 Selo de verificação (pago, opcional, sem qualquer boost de alcance)

Segunda fonte de receita, complementar ao AdSense: um selo pago para perfis pessoais e Páginas Públicas (seção 3.6) que queiram confirmar formalmente que são quem dizem ser. O compromisso central, e ele é absoluto por causa do princípio da seção 3.7: **o selo certifica identidade, e só isso — nunca aumenta alcance, prioridade no feed ou qualquer forma de destaque algorítmico**, porque esse mecanismo simplesmente não existe na plataforma para ninguém.

**Processo de verificação**: confirmação de CPF (pessoa física) ou CNPJ + documento do representante legal (empresa/entidade), via API de consulta de terceiros.

**Custo operacional pesquisado**: hoje, no Brasil, APIs de consulta/validação de CPF e CNPJ custam entre R$ 0,005 e R$ 0,09 por consulta, dependendo do volume contratado — ou seja, o custo de verificar uma identidade é centavos, não reais. Isso dá margem confortável para cobrar um preço bem mais baixo que o mercado e ainda assim ser sustentável.

**Preço sugerido** (referência: hoje o Meta Verified cobra R$ 55/mês só no Instagram e R$ 69,90/mês no Facebook — separadamente por rede — e inclui benefícios que se aproximam de vantagem de alcance/prioridade de suporte; o OrkUp propositalmente entrega menos por cobrar menos, já que aqui a promessa é só autenticidade):

- **Pessoa física**: R$ 9,90/mês ou R$ 89,90/ano (equivalente a ~R$ 7,50/mês no plano anual).
- **Empresa/entidade (CNPJ)**: R$ 19,90/mês ou R$ 179,90/ano — mais caro que pessoa física porque a verificação é mais elaborada (CNPJ + representante legal).
- Recomendo cobrança **anual como padrão** (mensal como opção secundária): reduz volume de transações pra uma operação pequena administrar, e reforça o posicionamento de "selo de autenticidade", não "assinatura premium" que empurra upsell.

Vale usar esse preço mais baixo e essa promessa de "não compra alcance" como diferencial de marketing explícito — é uma forma honesta de se posicionar contra o modelo de verificação de outras redes, coerente com a proposta original de trazer de volta uma internet com menos manipulação de atenção.

## 5. Privacidade e LGPD

Anúncio personalizado do Google exige gerenciamento de consentimento de cookies compatível com a LGPD e as diretrizes da ANPD. Pontos obrigatórios de design, confirmados na regulamentação vigente:

- Banner de consentimento em **três camadas**: aviso inicial com opção de aceitar/recusar, central de preferências com escolha por categoria de cookie, e política de cookies completa e acessível.
- Consentimento deve ser **livre, informado, inequívoco, granular e revogável** — nada de "aceitar tudo" em destaque com "recusar" escondido (dark pattern proibido).
- Cookies não-essenciais (incluindo os usados por anúncio comportamental) só podem ser ativados **depois** da interação do usuário com o banner — nunca antes.
- Cookies estritamente necessários (autenticação, sessão) não exigem consentimento prévio.
- A plataforma precisa manter registro de quando e qual versão do banner foi exibida e qual escolha o usuário fez, para efeito de comprovação em caso de fiscalização.

Isso precisa entrar no MVP desde o lançamento, não como ajuste posterior — trocar o mecanismo de consentimento depois de já ter usuários cadastrados é mais custoso.

**Mensagens privadas e LGPD**: o conteúdo do mensageiro (seção 3.4) é dado pessoal sensível do ponto de vista de expectativa de privacidade do usuário, mesmo sem ser "dado sensível" na definição técnica da lei. Tratamento recomendado: mensagens criptografadas em trânsito (TLS) e em repouso no banco; acesso da equipe interna a conteúdo de conversa restrito a investigação formal de denúncia (nunca acesso irrestrito para "curiosidade" ou métricas); e opção do usuário de apagar seu histórico de conversa, respeitando o direito de eliminação de dados da LGPD.

### 5.1 Cadastro global: exposição a outras leis além da LGPD

Como o cadastro não tem barreira geográfica (seção 2.1), a LGPD deixa de ser a única lei de privacidade relevante. O exemplo mais importante é o **GDPR europeu**, que é extraterritorial por definição: se aplica a qualquer pessoa localizada na Europa que use o OrkUp, independente de onde a empresa esteja sediada — não é preciso ter escritório ou operação na Europa para a lei valer.

A boa notícia é que o desenho de privacidade já especificado nesta seção (consentimento granular, revogável, com registro de quando/qual versão foi aceita, criptografia de mensagens, direito de apagar dados) cobre boa parte dos princípios que o GDPR também exige — não é um projeto de conformidade do zero, é uma extensão do que já foi desenhado para a LGPD. Ainda assim, isso **não é aconselhamento jurídico**: vale uma consulta pontual com advogado especializado antes do produto ganhar tração de verdade fora do Brasil, para revisar pontos específicos (ex.: base legal de tratamento, DPO/encarregado, prazos de resposta a solicitações) que variam entre as duas leis.

Recomendação prática para o MVP: manter o mesmo padrão de consentimento e direitos do usuário para todo mundo, independente de país — tratar todos como se a lei mais rigorosa aplicável fosse a regra, em vez de tentar detectar a localização do usuário e aplicar políticas diferentes por região (o que adicionaria complexidade sem necessidade nessa fase).

## 6. Arquitetura técnica (enxuta, para operação regional)

Objetivo: nada de infraestrutura pesada, fácil de manter por uma equipe pequena, custo baixo no início.

- **Formato**: Web app / PWA (instalável no celular sem passar por loja de app), responsivo mobile-first — a maioria do público vai acessar pelo celular.
- **Hospedagem — recomendação concreta**: **Vercel** (frontend/PWA, se o app for construído em Next.js ou similar) + **Supabase** (banco de dados Postgres, autenticação e realtime) + **Cloudflare R2** (mídia, seção 6.1). Avaliei também hospedar num **VPS** (ex.: Hostinger) e descartei essa rota pro MVP — não porque seja ruim, mas porque exige manter servidor, deploy, SSL e backup manualmente, trabalho de operação que uma equipe pequena/solo não precisa carregar agora. A combinação Vercel + Supabase é "aponte o repositório e publique", com tier gratuito que cobre bem a fase de piloto:
  - **Vercel (plano Hobby)**: gratuito para uso pessoal — 100 GB de banda/mês, 100 horas de execução de funções, deploy automático a cada atualização. Importante: o plano gratuito tem restrição de uso comercial, então assim que o AdSense começar a gerar receita, o certo é migrar para o **Plano Pro (US$ 20/mês)**.
  - **Supabase (plano Free)**: banco de até 500 MB, autenticação para até 50 mil usuários ativos/mês, realtime incluso (200 conexões simultâneas, 2 milhões de mensagens/mês) — dá margem confortável pro piloto. Atenção a um detalhe: projetos gratuitos **pausam depois de uma semana sem uso** (demora ~30s pra "acordar" no primeiro acesso) — não é um problema depois que o app tiver uso regular, mas pode confundir durante a fase de testes com pouca atividade. Quando o banco passar de 500 MB ou for preciso backup automático, o **plano Pro (US$ 25/mês)** resolve.
  - Ou seja: dá pra rodar o piloto inteiro sem pagar nada de hospedagem, e o primeiro custo real (~US$ 45/mês somando os dois Pro) só aparece quando o produto já estiver gerando alguma receita de anúncio — crescimento de custo acompanhando crescimento de uso, não custo fixo alto desde o dia 1 como um VPS.
- **Identidade**: sistema de conta único ("Conta OrkUp"), desenhado desde já para, no futuro, poder ser reaproveitado como login para os outros negócios (transporte, delivery) via API — sem acoplar os sistemas agora, só deixando a porta aberta.
- **Conteúdo**: cada post e tópico de fórum com URL pública própria (necessário para o AdSense, ver seção 4, e bom para SEO/descoberta orgânica também).
- **Moderação**: painel simples de denúncia + fila de revisão manual no início; automação (filtro de palavras, IA de moderação) só entra quando o volume justificar.
- **Mensageiro em tempo real**: essa é a única parte do MVP que exige um componente de infraestrutura diferente do resto (que pode ser praticamente estático/serverless) — chat em tempo real precisa de conexão persistente (WebSocket). Pesquisei as opções atuais de mercado para não reinventar isso do zero:
  - **Supabase Realtime** é a opção mais econômica se o banco de dados do OrkUp já for Supabase/Postgres — o recurso de realtime vem incluído sem custo adicional, e é suficiente para chat 1:1 e status de presença ("online agora").
  - **Pusher** é uma alternativa simples e desacoplada do banco, com plano gratuito de até 200 conexões simultâneas e 200 mil mensagens/dia — dá margem confortável para um piloto regional.
  - Em ambos os casos, evita-se montar e manter um servidor WebSocket próprio no início, o que manteria a operação enxuta como o resto do produto.

### 6.1 Estratégia de mídia de baixo custo (fotos e vídeo)

Pesquisei o cenário atual de preços de armazenamento/entrega de mídia, porque é aqui que um app social pode sair caro rápido se não houver limite desde o desenho.

**Armazenamento (fotos e vídeo já comprimidos)**:
- **Cloudflare R2** é a recomendação: não cobra taxa de saída de dados (egress) — o custo que mais escala quando muita gente visualiza a mesma foto/vídeo repetidamente. Tier gratuito de 10 GB/mês cobre bem a fase de piloto; depois disso, custo de referência é bem baixo (ordem de US$ 1,50/mês para 100 GB armazenados + 100 GB servidos, contra ~US$ 11 em serviços que cobram egress).

**Regra de ouro para fotos**:
- Nunca guardar o arquivo original enviado pelo usuário. Redimensionar para um tamanho máximo (ex.: 1600px no lado maior) e converter para WebP no momento do upload — reduz o tamanho do arquivo de forma significativa em relação a JPEG, sem perda visível de qualidade.
- Remover metadados EXIF no upload (bônus: privacidade — evita vazar localização de onde a foto foi tirada).

**Regra de ouro para vídeo**:
- Limitar duração (ex.: 60 segundos no MVP) e resolução (ex.: 720p) — isso sozinho já controla a maior parte do custo.
- Comprimir/recodificar todo vídeo enviado para uma única qualidade padrão no momento do upload (processo automático no servidor), e descartar o arquivo bruto original depois. Evitar múltiplas resoluções (streaming adaptativo) no início — isso multiplica o espaço ocupado por vídeo e não é necessário na escala de um piloto regional.
- Duas rotas possíveis: (a) montar esse pipeline de compressão você mesmo e guardar o resultado no R2 (mais barato, mais trabalho de engenharia), ou (b) usar um serviço de vídeo pronto como Cloudflare Stream, que cobra por minuto armazenado/entregue mas já resolve compressão e entrega — mais caro por unidade, porém menos trabalho de construir. Para o piloto, a rota (a) tende a valer a pena pelo volume ser pequeno.

**Controle adicional durante o piloto**: considerar um limite temporário de quantidade de fotos/vídeos por usuário por mês (ex.: um teto generoso, mas existente), só para não ser surpreendido por custo antes de entender o padrão real de uso. Pode ser removido assim que os números da fase piloto derem previsibilidade de custo por usuário ativo.

## 7. Plano de lançamento faseado

1. **Fase fechada (convite)**: base inicial de comunidades nostálgicas de Orkut na região brasileira escolhida, sem anúncio ainda — foco em validar se a mecânica de comunidades/fórum realmente evita as brigas que a proposta promete. Cadastro já tecnicamente aberto (sem geobloqueio), mas convites e divulgação concentrados na região.
2. **Fase pública com foco regional**: cadastro livre para qualquer pessoa (sem barreira geográfica), mas todo o esforço de divulgação, comunidades-semente e conteúdo em destaque continua concentrado na região-alvo no Brasil — submissão do site ao AdSense já com moderação mínima ativa e banner de consentimento implementado.
3. **Fase de expansão do foco**: ampliar a região de foco dentro do Brasil (ou eventualmente para fora) só depois de validar retenção e clima saudável nas comunidades da primeira — não expandir o foco por volume, expandir por prova de que o modelo funciona. Como o cadastro já é global desde o início, "expandir" aqui significa mudar onde a energia de marketing é investida, não abrir acesso técnico novo.

## 8. Métricas de sucesso (piloto)

- Retenção de usuários ativos semanais dentro das comunidades (não só cadastro).
- Número de denúncias por comunidade / taxa de resolução — indicador direto de que o design "bolhas separadas" está funcionando.
- Receita de AdSense por usuário ativo (mesmo pequena, serve para calibrar expectativa de monetização futura).
- Taxa de comunidades com atividade orgânica sustentada (sem precisar de incentivo do time).

## 9. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Poucas pessoas na região inicial para dar massa crítica | Escolher região com comunidade nostálgica offline/grupo já existente para migrar em bloco |
| Conteúdo impróprio em alguma comunidade derruba aprovação/conta do AdSense | Moderação mínima ativa antes de submeter ao AdSense; regras globais claras |
| Receita de anúncio insuficiente para sustentar operação | Tratar fase inicial como validação, manter custo de infraestrutura baixo (arquitetura enxuta da seção 6) |
| Trocar banner de consentimento depois de ter base de usuários | Implementar conformidade LGPD completa desde o MVP, não depois |
| Vazamento ou acesso indevido a conteúdo de mensagens privadas | Criptografia em trânsito/repouso, acesso interno restrito a investigação formal de denúncia, uso de provedor de realtime já testado no mercado em vez de solução própria |
| Custo de armazenamento/entrega de mídia cresce descontrolado com adoção | Compressão obrigatória no upload, nunca guardar arquivo bruto, limites de duração/resolução de vídeo, storage sem taxa de egress (Cloudflare R2), teto temporário por usuário no piloto |
| Filtro automático erra (falso positivo censura conteúdo legítimo, ou falso negativo deixa passar violação, especialmente violência contra animais) | Threshold de confiança alto para bloqueio automático, revisão humana para casos intermediários, denúncia da comunidade como rede de segurança complementar, processo de recurso para o usuário |
| Amigo virtual de IA usado por menor de idade ou falha em crise emocional (área com litígio e regulação crescente em 2026) | Restringir a adultos com verificação de idade, integração obrigatória com fluxo de crise (10.3), transparência de que é IA, lançar só na fase 2 com salvaguardas prontas |
| Cadastro global expõe a leis de privacidade além da LGPD (ex.: GDPR europeu), ou a picos de crescimento fora da região de foco sem aviso | Aplicar o mesmo padrão de consentimento/direitos rigoroso pra todo mundo (seção 5.1), consulta jurídica pontual antes de tração internacional real, e moderação/infra já dimensionadas para escalar sob demanda (arquitetura elástica da seção 6) em vez de capacidade fixa por região |
| Documento falso usado para obter selo de verificação (fraude de identidade) | API de verificação com consulta oficial (Receita Federal), canal de denúncia de perfil verificado suspeito, revogação do selo em caso de fraude confirmada |

## 10. Moderação automática de conteúdo

Além da moderação humana por comunidade (seção 3.3), o MVP precisa de um filtro automático **pré-publicação** para as categorias mais graves: discurso de ódio, conteúdo sexual/nudez, gore, violência contra animais e incentivo ao suicídio/autolesão. Pesquisei as opções atuais de mercado — a boa notícia é que dá pra montar isso sem custo relevante.

### 10.1 Camada 1 — filtro automático antes de publicar

- **Texto (posts, comentários, tópicos de fórum)**: usar a **API de Moderação da OpenAI** (`omni-moderation-latest`). É **gratuita para qualquer desenvolvedor**, cobre discurso de ódio, conteúdo sexual, violência e autolesão/suicídio, e teve ganhos recentes de precisão em idiomas não-ingleses (relevante para conteúdo em português).
- **Imagem e vídeo**: a mesma API da OpenAI já avalia imagem (isolada ou junto com a legenda) para violência, autolesão e conteúdo sexual — cobrindo boa parte do escopo com uma única integração. Para nudez/gore com mais granularidade (a OpenAI não expõe subcategoria fina o suficiente para todos os casos), complementar com **Amazon Rekognition** (moderação de imagem), que tem categorias específicas de nudez, nudez explícita, conteúdo sugestivo, violência, gore e armas, com pontuação de confiança ajustável. Custo: ~US$ 1 por 1.000 imagens — para vídeo, em vez de analisar o arquivo inteiro (caro), basta extrair 1 frame a cada poucos segundos e checar cada frame, o que mantém o custo por vídeo em centavos.
- **Conteúdo publicado é bloqueado automaticamente** só quando a pontuação de confiança for muito alta (violação clara); casos de confiança intermediária vão para revisão humana antes de publicar, e casos claramente aceitáveis publicam direto — evita tanto excesso de censura automática quanto excesso de fila manual.

### 10.2 Limite conhecido: violência contra animais

Nenhuma das APIs de moderação hoje no mercado (OpenAI, AWS Rekognition, Google Vision) tem uma categoria dedicada a crueldade/violência contra animais — isso normalmente é capturado apenas de forma indireta pela categoria genérica de "violência"/"gore", e nem sempre. Esse é um ponto que exige honestidade: a ferramenta automática vai pegar os casos mais gráficos por acidente (via violência/gore geral), mas **a defesa principal aqui precisa continuar sendo denúncia da comunidade + revisão humana**, porque também é um tipo de conteúdo onde o contexto importa muito (ex.: denúncia jornalística de maus-tratos vs. glorificação do ato) — algo que IA de moderação erra com frequência nos dois sentidos.

### 10.3 Tratamento especial: incentivo ao suicídio e autolesão

Esse é o único tipo de conteúdo em que a resposta certa **não é só remover**. Prática recomendada (seguida por redes maiores e que faz sentido replicar mesmo em escala pequena):

- Conteúdo sinalizado por essa categoria vai para o **topo da fila de revisão humana**, à frente de qualquer outro tipo de denúncia.
- Ao mesmo tempo em que o conteúdo é ocultado/revisado, a pessoa que postou recebe uma mensagem de apoio com recursos de ajuda (no Brasil, o **CVV — Centro de Valorização da Vida, 188**, funciona 24h por telefone, chat e e-mail) — em vez de só uma notificação de "seu conteúdo foi removido".
- Evitar prometer ao usuário qualquer garantia sobre acionamento automático de autoridades — isso varia por circunstância e não deve ser prometido de forma genérica na interface; o foco da automação é priorizar revisão humana rápida e oferecer o recurso de ajuda.

### 10.4 Pipeline completo

1. Filtro automático pré-publicação (10.1) — bloqueia violação clara, libera caso aceitável, encaminha caso intermediário.
2. Denúncia da comunidade (já prevista na seção 3.3) alimentando a fila de revisão.
3. Revisão humana: moderador de cada comunidade cuida de julgamento contextual local; uma fila central pequena (pode ser só você no início, dado o volume regional) cuida de violação de regra global e de qualquer caso escalado — com fila de autolesão/suicídio sempre em primeiro lugar.
4. Recurso: usuário pode contestar uma remoção.

Custo total estimado dessa camada de moderação para um piloto regional: próximo de zero (moderação de texto gratuita) mais poucos dólares por mês em moderação de imagem — coerente com a filosofia de operação enxuta do restante do produto.

### 10.5 Importante: isso não se aplica ao mensageiro privado

Esse filtro automático roda sobre **conteúdo público** (posts, fotos, comentários, tópicos de fórum) antes de publicar. Ele **não** varre mensagens privadas do mensageiro (seção 3.4) de forma automática e proativa — isso entraria em conflito direto com o compromisso de privacidade já assumido no mensageiro. Conversa privada só é revisada por humano se for denunciada por um dos participantes, nunca de forma automática/preventiva. Essa é uma escolha de produto consciente, coerente com o "privacidade sempre" pedido para o mensageiro.

## 11. Amigo virtual de IA (botão "conversar com IA")

### 11.1 Realidade sobre "gratuito e sem limite"

Não existe hoje uma IA boa, gratuita e sem limite de verdade — toda resposta gerada consome poder de GPU, que tem custo real em algum ponto da cadeia. O que existe são tiers gratuitos com limite de requisições por minuto/dia. Pesquisei o cenário atual para montar uma estratégia realista:

- **Gateway multi-provedor**: Google Gemini como principal (hoje descrito como "o tier gratuito mais generoso de propósito geral" do mercado), com **Groq** como respaldo (baixíssima latência, modelos open-weight, bom pra absorver picos), e cache agressivo de respostas repetidas para reduzir o número de chamadas reais — segundo a pesquisa, isso sozinho pode cortar 70%+ das chamadas necessárias.
- **Reformular a meta**: em vez de "sem limite" (que não existe), pensar em "limite alto o suficiente que ninguém percebe no uso normal, mas existente" — um teto diário generoso de mensagens por usuário evita que uma única pessoa mandando milhares de mensagens comprometa a conta gratuita de todo mundo.
- **Gatilho de migração**: quando os limites gratuitos começarem a ser atingidos com frequência, é sinal de que a feature está validada — nesse momento migra-se para um plano pago dimensionado ao uso real, já com dado de custo por usuário ativo para embasar a decisão.

### 11.2 Atenção: essa categoria de feature está sob escrutínio regulatório crescente

Pesquisei o cenário atual porque mudou bastante recentemente e afeta diretamente o desenho da feature, não é só uma nota de rodapé:

- Nova York aprovou em 2026 uma lei que proíbe "chatbots de companhia" — definidos como software que simula relacionamento emocional contínuo, com persona e memória de conversas — para menores de 18 anos, com multa de até US$ 25 mil por violação. A justificativa dos legisladores: esses bots são "projetados para engajamento" de um jeito que pode aprofundar isolamento em vez de resolvê-lo, com relatos de falhas graves quando o usuário menor de idade passa por uma crise emocional durante o uso.
- Há processos judiciais em andamento contra empresas de chatbot de companhia (caso mais conhecido: Character.AI) ligando o uso do produto a crises de saúde mental e casos de suicídio de adolescentes.
- Isso não significa abandonar a ideia — significa que ela precisa nascer com salvaguardas desde o primeiro dia, não como remendo depois de um incidente.

### 11.3 Recomendações de desenho

- **Restringir a usuários adultos (18+) na primeira fase.** Dado o cenário regulatório e os casos documentados envolvendo menores, recomendo fortemente não liberar essa feature para contas de menores de idade, com verificação de idade coerente com o restante do cadastro.
- **Transparência sempre**: a IA precisa deixar claro, na primeira mensagem e periodicamente, que é uma inteligência artificial — nunca fingir ser humano ou deixar isso ambíguo.
- **Integração obrigatória com o fluxo de crise (seção 10.3)**: se a conversa indicar sinais de risco (isolamento extremo, ideação suicida, autolesão), a IA precisa responder com cuidado apropriado — nunca ignorar ou seguir batendo papo neutro — e direcionar a pessoa aos recursos de ajuda já definidos (CVV, 188), com o mesmo tratamento prioritário desenhado para conteúdo público. Esse chat privado tende a ser justamente onde sinais de solidão/risco aparecem com mais frequência, então essa salvaguarda é obrigatória, não opcional.
- **Não desenhar para maximizar tempo de tela.** Evitar mecânica de engajamento viciante (notificação puxando de volta pro chat, personagem que "sente falta" do usuário) — é exatamente o padrão citado pelos reguladores como problemático.
- **Reforçar conexão humana real, não substituí-la.** Como o objetivo do OrkUp já é reduzir solidão conectando gente de verdade (comunidades/fórum), a IA pode, quando fizer sentido na conversa, sugerir comunidades ou tópicos do próprio OrkUp relacionados aos interesses da pessoa — reforçando o propósito real da plataforma em vez de criar dependência exclusiva do bot.

### 11.4 Recomendação de faseamento

Dado o tamanho da salvaguarda necessária (verificação de idade, integração com o fluxo de crise, desenho anti-dependência), sugiro tratar essa feature como **fase 2**, fora do lançamento fechado inicial — o MVP já acumula bastante superfície nova (mensageiro, moderação). Especificar bem agora e implementar com calma depois evita lançar algo sensível assim de forma apressada.

## 12. Fora de escopo do MVP (propositalmente)

Transporte e delivery (os outros dois negócios da visão original) ficam fora deste documento por decisão consciente de foco. A única coisa que este MVP prepara para o futuro é a camada de identidade (conta única), para que a integração seja possível mais tarde sem retrabalho.

## 13. Primeiros passos de implementação

Ordem prática sugerida para sair do protótipo navegável (já validado nesta fase de conversa) para uma versão real em produção:

1. **Registrar domínio**: verificar disponibilidade de algo como `orkup.com.br` (ou variação) — o registro em si é barato (Registro.br, na faixa de R$40/ano) e não trava nenhuma decisão técnica posterior.
2. **Criar contas de infraestrutura**: Vercel, Supabase e Cloudflare (seção 6) — todas com cadastro gratuito, sem cartão obrigatório nos tiers usados no início.
3. **Definir quem constrói**: essa é a decisão que mais muda o resto do caminho — codar você mesmo (com apoio aqui, inclusive posso escrever o código real do projeto nesta sessão), contratar um freelancer/agência, ou uma combinação (ex.: você cuida do produto/negócio, contrata alguém só pra codar). Não há resposta certa universal; depende do seu tempo disponível e orçamento.
4. **Construir o núcleo primeiro**: cadastro/login, perfil com timeline, feed cronológico e comunidades/fórum (seções 3.1–3.3) — é o suficiente pra validar a proposta central com a comunidade-semente, antes de investir em mensageiro, selo de verificação ou Páginas Públicas.
5. **Documentos legais mínimos**: Termos de Uso e Política de Privacidade compatíveis com a LGPD (seção 5) — precisam existir antes do cadastro público abrir, não depois.
6. **Submissão ao Google AdSense**: só depois que o site estiver no ar com conteúdo real e moderação mínima funcionando (seção 4).
7. **Lançamento fechado**: convidar a comunidade-semente da região escolhida (seção 2), testar a mecânica de comunidades antes de abrir ao público.

Cada um desses pontos pode virar uma conversa própria quando você estiver pronto pra avançar nele.
