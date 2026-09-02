import { randomBytes, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type {
  AccountSnapshot,
  BankIntegrationService,
  BankTransactionSnapshot,
  ConsentInitResult,
  ConsentOutcome,
  Institution,
} from "@/lib/bank/bank-integration-service";
import { institutionColor, institutionInitials } from "@/lib/bank/institution-visuals";

// Provider de desenvolvimento — nunca roda em produção (ver get-bank-provider.ts,
// que só devolve MockBankProvider quando NODE_ENV !== "production"). Todo
// dado devolvido aqui é fake e determinístico a partir do consentId, para que
// a mesma conexão simulada sempre gere os mesmos números ao sincronizar de
// novo.
//
// A "decisão" do usuário na tela simulada (/open-finance-mock/[consentId])
// é gravada direto no BankConsent.status (ver actions.ts daquela rota) e
// getConsentStatus só lê de volta esse mesmo registro. Diferente de um
// provider real, o Mock pode fazer isso porque ele representa nosso próprio
// ambiente simulado, não um sistema externo de verdade — evita depender de
// estado em memória do processo, que o Next.js pode não compartilhar entre
// o bundle da Server Action e o do Route Handler mesmo dentro de `next dev`.


const INSTITUTION_NAMES: Array<{ id: string; name: string }> = [
  { id: "bb", name: "Banco do Brasil" },
  { id: "itau", name: "Itaú" },
  { id: "bradesco", name: "Bradesco" },
  { id: "santander", name: "Santander" },
  { id: "caixa", name: "Caixa Econômica Federal" },
  { id: "nubank", name: "Nubank" },
  { id: "inter", name: "Banco Inter" },
];

const INSTITUTIONS: Institution[] = INSTITUTION_NAMES.map(({ id, name }) => ({
  id,
  name,
  initials: institutionInitials(name),
  colorHex: institutionColor(id),
}));

const MOCK_MERCHANTS: Array<{
  description: string;
  type: "CREDIT" | "DEBIT";
  min: number;
  max: number;
}> = [
  { description: "PIX RECEBIDO - CLIENTE", type: "CREDIT", min: 300, max: 4500 },
  { description: "UBER TRIP", type: "DEBIT", min: 15, max: 60 },
  { description: "IFOOD", type: "DEBIT", min: 25, max: 120 },
  { description: "AMAZON BR", type: "DEBIT", min: 40, max: 500 },
  { description: "POSTO SHELL", type: "DEBIT", min: 80, max: 300 },
  { description: "PAGAMENTO FORNECEDOR", type: "DEBIT", min: 200, max: 3000 },
  { description: "TED RECEBIDA", type: "CREDIT", min: 500, max: 8000 },
  { description: "TARIFA BANCARIA", type: "DEBIT", min: 15, max: 45 },
];

// Mulberry32 — PRNG determinístico simples a partir de um seed numérico,
// suficiente para gerar dados fake estáveis (não precisa ser criptográfico).
function mulberry32(seed: number) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash;
}

export class MockBankProvider implements BankIntegrationService {
  readonly providerName = "mock";

  async listInstitutions(): Promise<Institution[]> {
    return INSTITUTIONS;
  }

  async initiateConsent(params: {
    institutionId: string;
    userId: string;
    redirectUri: string;
  }): Promise<ConsentInitResult> {
    const institution = INSTITUTIONS.find((i) => i.id === params.institutionId);
    if (!institution) {
      throw new Error("Instituição desconhecida.");
    }
    const consentId = `mock_${randomUUID()}`;
    const state = randomBytes(24).toString("hex");
    const redirectParam = encodeURIComponent(params.redirectUri);
    return {
      consentId,
      state,
      redirectUrl: `/open-finance-mock/${consentId}?state=${state}&redirect=${redirectParam}`,
    };
  }

  async getConsentStatus(consentId: string): Promise<ConsentOutcome> {
    const consent = await prisma.bankConsent.findUnique({ where: { consentId } });
    if (consent?.status === "AUTHORISED") return "AUTHORISED";
    if (consent?.status === "REJECTED") return "REJECTED";
    return "ERROR";
  }

  async fetchAccounts(consentId: string): Promise<AccountSnapshot[]> {
    const rand = mulberry32(seedFromString(consentId));
    const balance = Math.round((5000 + rand() * 45000) * 100) / 100;
    return [
      {
        externalAccountId: `${consentId}:acc1`,
        accountType: "CONTA_CORRENTE",
        numberMasked: `****${String(Math.floor(rand() * 9000) + 1000)}`,
        branchMasked: `${String(Math.floor(rand() * 9000) + 1000)}`,
        currency: "BRL",
        balance,
      },
    ];
  }

  async fetchTransactions(params: {
    consentId: string;
    externalAccountId: string;
    since?: Date;
  }): Promise<BankTransactionSnapshot[]> {
    const rand = mulberry32(seedFromString(params.externalAccountId + (params.since?.toISOString() ?? "")));
    const count = 4 + Math.floor(rand() * 5);
    const transactions: BankTransactionSnapshot[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const merchant = MOCK_MERCHANTS[Math.floor(rand() * MOCK_MERCHANTS.length)];
      const amount = Math.round((merchant.min + rand() * (merchant.max - merchant.min)) * 100) / 100;
      const daysAgo = Math.floor(rand() * 30);
      const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      transactions.push({
        externalTransactionId: `${params.externalAccountId}:${i}:${date.getTime()}`,
        date,
        description: merchant.description,
        amount,
        type: merchant.type,
        raw: { source: "mock", merchant: merchant.description },
      });
    }

    return transactions;
  }

  async revokeConsent(_consentId: string): Promise<void> {
    // Nada a fazer do lado do "banco" simulado — a revogação já é
    // registrada no nosso BankConsent por disconnectBankAccount.
  }
}
