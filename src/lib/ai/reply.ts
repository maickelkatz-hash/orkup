// Amigo virtual de IA — núcleo de resposta.
//
// IMPORTANTE (spec seção 11.3): esta feature precisa nascer com as
// salvaguardas prontas, mesmo antes de existir uma chave de API de LLM
// configurada. Por isso a função abaixo SEMPRE roda a checagem de crise
// primeiro — isso não depende de nenhum provedor de IA estar configurado.

// Palavras/expressões que indicam possível risco de crise emocional,
// ideação suicida ou autolesão (seção 10.3/11.3). Lista propositalmente
// ampla e sujeita a falso positivo — o custo de mostrar o recurso de
// ajuda a mais é muito menor que o custo de não mostrar quando precisa.
const CRISIS_PATTERNS: RegExp[] = [
  /\bme\s+matar\b/i,
  /\bquero\s+morrer\b/i,
  /\bnão\s+aguento\s+mais\s+viver\b/i,
  /\bnao\s+aguento\s+mais\s+viver\b/i,
  /\bacabar\s+com\s+(a\s+)?minha\s+vida\b/i,
  /\bacabar\s+com\s+tudo\b/i,
  /\btirar\s+minha\s+vida\b/i,
  /\bsuic[ií]d[ao]\b/i,
  /\bme\s+cortar\b/i,
  /\bautomutila[çc][ãa]o\b/i,
  /\bme\s+machucar\b/i,
  /\bn[ãa]o\s+quero\s+mais\s+viver\b/i,
  /\bsem\s+vontade\s+de\s+viver\b/i,
  /\bmelhor\s+(eu\s+)?(estar\s+)?morto\b/i,
];

export function detectsCrisisSignal(text: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

// Resposta de acolhimento + recurso de ajuda — nunca "só" isso e nada mais,
// mas também nunca é ignorado ou tratado como papo neutro (seção 11.3).
export const CRISIS_REPLY =
  "Sinto muito que você esteja passando por um momento tão difícil. " +
  "Eu sou uma inteligência artificial e não substituo ajuda humana " +
  "especializada — mas você não precisa passar por isso sozinho(a). " +
  "O CVV (Centro de Valorização da Vida) oferece apoio emocional gratuito, " +
  "sigiloso e 24h por dia: ligue 188, ou converse pelo chat em " +
  "www.cvv.org.br. Se quiser, posso ficar aqui conversando também.";

const AI_DISCLAIMER =
  "Sou uma inteligência artificial do OrkUp, não uma pessoa real — e não " +
  "guardo memória fora desta conversa. ";

// Stub: enquanto não houver uma chave de API de LLM configurada
// (ex.: GEMINI_API_KEY), responde com uma mensagem clara sobre o estado
// atual, em vez de fingir estar processando algo que não está.
async function stubReply(userMessage: string): Promise<string> {
  return (
    AI_DISCLAIMER +
    "No momento, a conversa de verdade com IA ainda não foi ligada neste " +
    `servidor (falta configurar a chave de API). Recebi sua mensagem: "${userMessage.slice(
      0,
      200
    )}" — assim que o modelo estiver configurado, vou responder de verdade.`
  );
}

// Ponto único de geração de resposta. Quando GEMINI_API_KEY (ou outro
// provedor) estiver configurado, a chamada real entra aqui, mantendo a
// checagem de crise e o disclaimer de transparência intactos.
export async function generateAiReply(userMessage: string): Promise<{
  body: string;
  crisis: boolean;
}> {
  const crisis = detectsCrisisSignal(userMessage);
  if (crisis) {
    return { body: CRISIS_REPLY, crisis: true };
  }

  if (!process.env.GEMINI_API_KEY) {
    return { body: await stubReply(userMessage), crisis: false };
  }

  // TODO(fase de API real): chamar Gemini (principal) com Groq como
  // respaldo e cache de respostas repetidas, conforme seção 11.1 da spec.
  return { body: await stubReply(userMessage), crisis: false };
}
