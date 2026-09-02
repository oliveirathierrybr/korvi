"use client";

import { useState, useTransition } from "react";
import { Plus, ShieldCheck, Wallet, Receipt, ArrowLeftRight, IdCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InstitutionBadge } from "@/components/bank/institution-badge";
import { initiateBankConnection } from "@/lib/actions/bank-accounts";
import type { Institution } from "@/lib/bank/bank-integration-service";

const DATA_ITEMS = [
  { icon: Wallet, label: "Saldo" },
  { icon: Receipt, label: "Extrato" },
  { icon: ArrowLeftRight, label: "Entradas e saídas" },
  { icon: IdCard, label: "Informações para identificação da conta" },
];

export function ConnectBankModal({
  institutions,
  isMockMode,
}: {
  institutions: Institution[];
  isMockMode: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"intro" | "institution">("intro");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setStep("intro");
  }

  function handleSelectInstitution(institutionId: string) {
    startTransition(async () => {
      const result = await initiateBankConnection({ institutionId });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      window.location.href = result.redirectUrl;
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Conectar conta bancária
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {step === "intro" ? (
          <>
            <DialogHeader>
              <DialogTitle>Conectar conta bancária</DialogTitle>
              <DialogDescription>
                Conecte sua conta bancária ao Korvi para importar automaticamente
                seus saldos e movimentações.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {isMockMode ? (
                <div className="rounded-lg border border-dashed border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                  Modo simulado — nenhuma conexão bancária real será feita nesta
                  instalação.
                </div>
              ) : null}
              <div>
                <p className="mb-2 text-sm font-medium">O Korvi vai usar:</p>
                <ul className="space-y-1.5">
                  {DATA_ITEMS.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                Você será direcionado ao ambiente seguro do seu banco para
                autorizar o compartilhamento. O Korvi nunca pede sua senha ou
                credenciais bancárias.
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setStep("institution")} className="w-full">
                Continuar com Open Finance
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Selecione sua instituição</DialogTitle>
              <DialogDescription>
                Você será redirecionado para autorizar o compartilhamento.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              {institutions.map((institution) => (
                <button
                  key={institution.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSelectInstitution(institution.id)}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border p-3 text-center text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                >
                  <InstitutionBadge
                    initials={institution.initials}
                    colorHex={institution.colorHex}
                  />
                  <span className="line-clamp-2">{institution.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
