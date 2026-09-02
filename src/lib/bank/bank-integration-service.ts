// Contrato único entre o resto do Korvi e "como a gente fala com um banco".
// Hoje só existe MockBankProvider (src/lib/bank/providers/mock-bank-provider.ts).
// Quando houver um provedor/agregador Open Finance real contratado,
// OpenFinanceProvider (src/lib/bank/providers/open-finance-provider.ts)
// implementa exatamente esta mesma interface — nada em Server Actions, UI
// ou schema precisa mudar. Ver docs/OPEN_FINANCE.md.

export type Institution = {
  id: string;
  name: string;
  /** Iniciais para o badge gerado (não usamos logo real de banco — ver README). */
  initials: string;
  colorHex: string;
};

export type ConsentInitResult = {
  /** Id do consentimento no provedor — vira BankConsent.consentId. */
  consentId: string;
  /** Valor anti-CSRF gerado nesta chamada — vira BankConsent.state. */
  state: string;
  /** Para onde redirecionar o navegador do usuário para autorizar. */
  redirectUrl: string;
};

export type ConsentOutcome = "AUTHORISED" | "REJECTED" | "ERROR";

export type AccountSnapshot = {
  externalAccountId: string;
  accountType: string;
  numberMasked: string;
  branchMasked?: string;
  currency: string;
  balance: number;
};

export type BankTransactionSnapshot = {
  /**
   * Id externo estável da movimentação. Pode vir null de um provedor real
   * para lançamentos ainda "pendentes" (sem id definitivo) — nesse caso o
   * BankSyncService sintetiza um id determinístico em vez de tratar a
   * ausência como sinal de duplicata.
   */
  externalTransactionId: string | null;
  date: Date;
  description: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  raw?: unknown;
};

export interface BankIntegrationService {
  readonly providerName: string;

  listInstitutions(): Promise<Institution[]>;

  initiateConsent(params: {
    institutionId: string;
    userId: string;
    redirectUri: string;
  }): Promise<ConsentInitResult>;

  getConsentStatus(consentId: string): Promise<ConsentOutcome>;

  fetchAccounts(consentId: string): Promise<AccountSnapshot[]>;

  fetchTransactions(params: {
    consentId: string;
    externalAccountId: string;
    since?: Date;
  }): Promise<BankTransactionSnapshot[]>;

  revokeConsent(consentId: string): Promise<void>;
}
