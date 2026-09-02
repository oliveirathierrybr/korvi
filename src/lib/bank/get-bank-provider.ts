import "server-only";
import type { BankIntegrationService } from "@/lib/bank/bank-integration-service";
import { MockBankProvider } from "@/lib/bank/providers/mock-bank-provider";
import { OpenFinanceProvider } from "@/lib/bank/providers/open-finance-provider";

function isRealProviderConfigured() {
  return Boolean(
    process.env.OPEN_FINANCE_CLIENT_ID &&
      process.env.OPEN_FINANCE_CLIENT_SECRET &&
      process.env.OPEN_FINANCE_BASE_URL &&
      process.env.OPEN_FINANCE_REDIRECT_URI
  );
}

/**
 * "Produção de verdade" — não usar `NODE_ENV` sozinho aqui: a Vercel builda
 * com NODE_ENV=production tanto em deploys de Produção quanto de Preview, e
 * um deploy de Preview não é o site que clientes reais usam (é exatamente o
 * lugar certo para mostrar o modo simulado a quem está revisando a feature).
 * `VERCEL_ENV` distingue os dois; fora da Vercel (self-hosted), cai de volta
 * em NODE_ENV puro.
 */
function isRealProductionEnvironment() {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === "production";
  }
  return process.env.NODE_ENV === "production";
}

/**
 * Nunca deixa produção de verdade cair silenciosamente em dados simulados.
 * Três (e só três) saídas possíveis:
 *   - fora de produção de verdade (dev local ou Preview da Vercel) → sempre
 *     MockBankProvider, mesmo que as env vars de produção estejam setadas
 *     (não deve depender sem querer de credenciais reais);
 *   - produção de verdade com o provedor real configurado → OpenFinanceProvider;
 *   - produção de verdade sem configuração → lança erro. Nunca um terceiro
 *     caminho que use Mock em produção "só para não quebrar a tela".
 *
 * Mesmo idioma de erro do getClient() em src/lib/actions/assistant.ts:17-23.
 */
export function getBankProvider(): BankIntegrationService {
  if (!isRealProductionEnvironment()) {
    return new MockBankProvider();
  }
  if (!isRealProviderConfigured()) {
    throw new Error("Integração bancária não configurada nesta instalação.");
  }
  return new OpenFinanceProvider();
}

/** Usado pela UI para mostrar um estado "não disponível" em vez de travar num erro. */
export function isBankIntegrationAvailable() {
  return !isRealProductionEnvironment() || isRealProviderConfigured();
}

export function isMockProviderActive() {
  return !isRealProductionEnvironment();
}
