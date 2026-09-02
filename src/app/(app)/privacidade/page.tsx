import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SECTIONS = [
  {
    title: "O que coletamos",
    body: "Quando você conecta uma conta bancária via Open Finance, o Korvi recebe saldo, extrato (data, descrição e valor de cada movimentação) e informações necessárias para identificar a conta (instituição, tipo de conta e os últimos dígitos, quando permitido). Nunca coletamos sua senha, token ou qualquer credencial bancária — a autorização acontece diretamente no ambiente da sua instituição financeira.",
  },
  {
    title: "Para que usamos",
    body: "Esses dados são usados exclusivamente para exibir seu saldo, importar movimentações no seu caixa (depois de você revisar e categorizar) e alimentar os relatórios e o assistente financeiro do Korvi. Não vendemos, compartilhamos ou usamos seus dados financeiros para nenhuma outra finalidade.",
  },
  {
    title: "Como revogar o acesso",
    body: "Você pode desconectar uma conta bancária a qualquer momento na página Contas bancárias, clicando em \"Desconectar\". Isso interrompe a sincronização; o histórico de movimentações já importadas permanece no seu caixa, pois já são lançamentos seus.",
  },
  {
    title: "Exclusão e exportação de dados",
    body: "Você pode exportar seus lançamentos em CSV a partir da tela de Relatórios. Para solicitar a exclusão completa da sua conta e dos dados associados, entre em contato com o suporte.",
  },
  {
    title: "Isolamento entre empresas",
    body: "Cada empresa cadastrada no Korvi só tem acesso aos próprios dados — incluindo consentimentos, contas e movimentações bancárias. Todo acesso passa por verificação de posse antes de qualquer leitura ou escrita.",
  },
  {
    title: "Sobre a certificação Open Finance",
    body: "O Korvi não é uma instituição participante nem está certificado pelo Banco Central do Brasil. A conexão bancária depende de um provedor/agregador certificado a ser contratado; nesta instalação, sem essa contratação, o recurso opera em modo simulado (dados fictícios, claramente identificados como tal) ou fica desabilitado.",
  },
];

export default function PrivacidadePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Privacidade e segurança</h1>
        <p className="text-sm text-muted-foreground">
          Como o Korvi trata os dados financeiros da sua empresa, em especial ao
          conectar uma conta bancária.
        </p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{section.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
