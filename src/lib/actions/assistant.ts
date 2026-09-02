"use server";

import Anthropic from "@anthropic-ai/sdk";
import { requireUserId, getSession } from "@/lib/session";
import { buildFinancialContext } from "@/lib/data/assistant-context";
import { checkRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";

// Cada pergunta custa uma chamada de API paga (claude-opus-5) — sem limite,
// um cliente com bug (ou uso mal-intencionado da própria conta) poderia gerar
// uma fatura de API bem maior do que o esperado. 20/hora é folgado para uso
// legítimo (ninguém conversa com o assistente nesse ritmo) e barato de
// ajustar depois via um segundo limite diário, se necessário.
const ASSISTANT_RATE_LIMIT = 20;
const ASSISTANT_RATE_WINDOW_MS = 60 * 60 * 1000;

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export type AskAssistantResult = { answer: string } | { error: string };

const MAX_HISTORY_MESSAGES = 12;
const MAX_QUESTION_LENGTH = 2000;

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY não configurado.");
  }
  return new Anthropic({ apiKey });
}

export async function askAssistant(
  question: string,
  history: ChatMessage[]
): Promise<AskAssistantResult> {
  const userId = await requireUserId();
  const session = await getSession();

  const trimmed = question.trim();
  if (!trimmed) {
    return { error: "Digite uma pergunta." };
  }
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return { error: "Pergunta muito longa. Tente resumir." };
  }

  const allowed = await checkRateLimit(
    `assistant:user:${userId}`,
    ASSISTANT_RATE_LIMIT,
    ASSISTANT_RATE_WINDOW_MS
  );
  if (!allowed) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  let client: Anthropic;
  try {
    client = getClient();
  } catch {
    return {
      error:
        "O assistente de IA ainda não foi configurado nesta instalação (falta a chave da API).",
    };
  }

  const context = await buildFinancialContext(userId);

  const systemPrompt = [
    `Você é o assistente financeiro do Korvi, um dashboard de gestão de caixa para pequenas empresas.`,
    `Responda em português do Brasil, em tom direto e profissional, sobre os dados financeiros de "${session?.companyName ?? "esta empresa"}".`,
    `Use os dados abaixo como sua única fonte de verdade — não invente números. Se a pergunta não puder ser respondida com esses dados, diga isso claramente e explique o que falta.`,
    `Formate valores em reais (R$). Seja conciso: responda o que foi perguntado antes de qualquer contexto adicional.`,
    ``,
    `=== DADOS FINANCEIROS DA EMPRESA ===`,
    context,
  ].join("\n");

  const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);

  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      system: systemPrompt,
      output_config: { effort: "medium" },
      messages: [
        ...recentHistory.map((m) => ({
          role: m.role,
          content: m.text,
        })),
        { role: "user" as const, content: trimmed },
      ],
    });

    if (response.stop_reason === "refusal") {
      return {
        error:
          "Não consegui responder a essa pergunta. Tente reformular ou pergunte outra coisa sobre suas finanças.",
      };
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { error: "O assistente não retornou uma resposta em texto." };
    }

    return { answer: textBlock.text };
  } catch (err) {
    console.error("askAssistant failed:", err);
    return {
      error: "Não foi possível falar com o assistente agora. Tente novamente em instantes.",
    };
  }
}
