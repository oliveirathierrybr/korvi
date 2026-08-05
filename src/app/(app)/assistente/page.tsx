import { AssistantChat } from "@/components/assistant/assistant-chat";

export default function AssistentePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Assistente IA</h1>
        <p className="text-sm text-muted-foreground">
          Tire dúvidas sobre o caixa, contas e categorias da sua empresa.
        </p>
      </div>
      <AssistantChat />
    </div>
  );
}
