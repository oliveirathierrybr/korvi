"use client";

import { useRef, useState, useTransition } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { askAssistant, type ChatMessage } from "@/lib/actions/assistant";

const SUGGESTIONS = [
  "Como está meu fluxo de caixa este mês?",
  "Quais contas estão vencendo essa semana?",
  "Onde eu mais gastei nos últimos 90 dias?",
];

export function AssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isPending) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", text: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");

    startTransition(async () => {
      const result = await askAssistant(trimmed, messages);
      if ("error" in result) {
        toast.error(result.error);
        setMessages((prev) => prev.slice(0, -1));
        setInput(trimmed);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", text: result.answer }]);
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <Card className="flex h-[calc(100vh-11rem)] flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden pt-6">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium">Assistente financeiro</p>
                <p className="text-sm text-muted-foreground">
                  Pergunte sobre seu caixa, contas e categorias. As respostas usam
                  apenas os dados da sua empresa.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => send(s)}
                    disabled={isPending}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {m.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {m.text}
                </div>
                {m.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}
          {isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <Loader2 className="h-4 w-4 animate-spin" />
              Pensando...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 border-t pt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre suas finanças..."
            disabled={isPending}
            className="h-10"
          />
          <Button type="submit" size="icon" disabled={isPending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
