"use client";

import { useTransition } from "react";
import { RefreshCw, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InstitutionBadge } from "@/components/bank/institution-badge";
import { disconnectBankAccount, syncBankAccount } from "@/lib/actions/bank-accounts";
import { institutionColor, institutionInitials } from "@/lib/bank/institution-visuals";
import { formatCurrency, formatDate } from "@/lib/format";

type ConnectionStatus = "ATIVA" | "ERRO" | "DESCONECTADA";

function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  if (status === "ATIVA") {
    return (
      <Badge variant="outline" className="border-transparent bg-[#0ca30c]/10 text-[#0ca30c]">
        Ativa
      </Badge>
    );
  }
  if (status === "ERRO") {
    return (
      <Badge variant="outline" className="border-transparent bg-[#d03b3b]/10 text-[#d03b3b]">
        Erro na sincronização
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">
      Desconectada
    </Badge>
  );
}

export function BankAccountCard({
  account,
}: {
  account: {
    id: string;
    institutionId: string;
    institutionName: string;
    accountNumberMasked: string;
    balance: number;
    connectionStatus: ConnectionStatus;
    consent: { lastSyncAt: Date | null };
  };
}) {
  const [isSyncing, startSync] = useTransition();
  const [isDisconnecting, startDisconnect] = useTransition();
  const disconnected = account.connectionStatus === "DESCONECTADA";

  function handleSync() {
    startSync(async () => {
      const result = await syncBankAccount(account.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Sincronizado há poucos segundos.");
    });
  }

  function handleDisconnect() {
    if (!confirm(`Desconectar ${account.institutionName}? Você pode reconectar depois.`)) return;
    startDisconnect(async () => {
      const result = await disconnectBankAccount(account.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Conta desconectada.");
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <InstitutionBadge
            initials={institutionInitials(account.institutionName)}
            colorHex={institutionColor(account.institutionId)}
          />
          <div>
            <p className="font-medium">{account.institutionName}</p>
            <p className="text-sm text-muted-foreground">
              Conta {account.accountNumberMasked}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1 sm:items-end">
          <p className="text-lg font-semibold tabular-nums">
            {formatCurrency(account.balance)}
          </p>
          <div className="flex items-center gap-2">
            <ConnectionStatusBadge status={account.connectionStatus} />
            <span className="text-xs text-muted-foreground">
              {account.consent.lastSyncAt
                ? `Sincronizado em ${formatDate(account.consent.lastSyncAt)}`
                : "Nunca sincronizado"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:ml-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isSyncing || disconnected}
            onClick={handleSync}
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Sincronizando..." : "Atualizar"}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Desconectar"
            title="Desconectar"
            disabled={isDisconnecting || disconnected}
            onClick={handleDisconnect}
          >
            <Unplug className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
