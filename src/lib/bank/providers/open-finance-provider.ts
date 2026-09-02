import "server-only";
import type {
  AccountSnapshot,
  BankIntegrationService,
  BankTransactionSnapshot,
  ConsentInitResult,
  ConsentOutcome,
  Institution,
} from "@/lib/bank/bank-integration-service";

/**
 * Implementação real do BankIntegrationService — NÃO FUNCIONAL até ser
 * completada com o provedor/agregador Open Finance efetivamente contratado.
 *
 * Deliberadamente não inventamos endpoints, paths ou payloads de nenhum
 * banco ou agregador específico aqui — isso seria pior do que deixar
 * explícito que falta. Os métodos abaixo leem as variáveis de ambiente
 * corretas e fazem chamadas HTTP no formato genérico que o padrão Open
 * Finance Brasil usa (OAuth2 client credentials + Consent API + Accounts
 * API), mas os paths exatos, o formato do payload e a forma de autenticação
 * (mTLS, FAPI, etc.) dependem de qual instituição participante ou agregador
 * certificado (ex: Pluggy, Belvo, Quanto) a empresa vier a contratar.
 *
 * Para colocar em produção:
 *   1. Contratar/certificar-se junto a um provedor Open Finance autorizado
 *      pelo Banco Central (diretamente como TPP, ou via um agregador já
 *      certificado).
 *   2. Substituir os `throw` abaixo pelas chamadas reais do SDK/API desse
 *      provedor, usando as env vars já configuradas em .env.example.
 *   3. Preencher OPEN_FINANCE_CLIENT_ID / OPEN_FINANCE_CLIENT_SECRET /
 *      OPEN_FINANCE_BASE_URL / OPEN_FINANCE_REDIRECT_URI em produção.
 *
 * Ver docs/OPEN_FINANCE.md.
 */
export class OpenFinanceProvider implements BankIntegrationService {
  readonly providerName = "open_finance";

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;
  private readonly redirectUri: string;

  constructor() {
    const clientId = process.env.OPEN_FINANCE_CLIENT_ID;
    const clientSecret = process.env.OPEN_FINANCE_CLIENT_SECRET;
    const baseUrl = process.env.OPEN_FINANCE_BASE_URL;
    const redirectUri = process.env.OPEN_FINANCE_REDIRECT_URI;

    if (!clientId || !clientSecret || !baseUrl || !redirectUri) {
      throw new Error(
        "OpenFinanceProvider requer OPEN_FINANCE_CLIENT_ID, OPEN_FINANCE_CLIENT_SECRET, " +
          "OPEN_FINANCE_BASE_URL e OPEN_FINANCE_REDIRECT_URI configurados."
      );
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = baseUrl;
    this.redirectUri = redirectUri;
  }

  private notImplemented(method: string): never {
    throw new Error(
      `OpenFinanceProvider.${method} ainda não está implementado — é preciso plugar o ` +
        "SDK/API real do provedor Open Finance contratado antes de usar em produção. " +
        "Ver comentário no topo de src/lib/bank/providers/open-finance-provider.ts."
    );
  }

  async listInstitutions(): Promise<Institution[]> {
    // Numa integração real, isso normalmente vem de um endpoint público do
    // provedor/agregador com a lista de instituições participantes — não é
    // algo que devemos hardcodar aqui além do que já existe no Mock.
    this.notImplemented("listInstitutions");
  }

  async initiateConsent(_params: {
    institutionId: string;
    userId: string;
    redirectUri: string;
  }): Promise<ConsentInitResult> {
    // Fluxo real: POST {baseUrl}/consents com escopo/permissões solicitadas,
    // client autenticado (client credentials, possivelmente mTLS/FAPI),
    // devolve um consentId + uma authorization URL para redirecionar o
    // usuário. O `state` deve ser gerado aqui (ex: com `crypto.randomBytes`)
    // e conferido no callback.
    this.notImplemented("initiateConsent");
  }

  async getConsentStatus(_consentId: string): Promise<ConsentOutcome> {
    this.notImplemented("getConsentStatus");
  }

  async fetchAccounts(_consentId: string): Promise<AccountSnapshot[]> {
    this.notImplemented("fetchAccounts");
  }

  async fetchTransactions(_params: {
    consentId: string;
    externalAccountId: string;
    since?: Date;
  }): Promise<BankTransactionSnapshot[]> {
    this.notImplemented("fetchTransactions");
  }

  async revokeConsent(_consentId: string): Promise<void> {
    this.notImplemented("revokeConsent");
  }
}
