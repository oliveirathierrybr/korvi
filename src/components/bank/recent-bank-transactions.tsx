import { formatCurrency, formatDate } from "@/lib/format";

type RecentTx = {
  id: string;
  description: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  transactionDate: Date | string;
  bankAccount: { institutionName: string };
};

export function RecentBankTransactions({ transactions }: { transactions: RecentTx[] }) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma movimentação bancária ainda. Conecte uma conta para começar.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {transactions.map((tx) => (
        <li key={tx.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{tx.description}</p>
            <p className="text-xs text-muted-foreground">
              {tx.bankAccount.institutionName} · {formatDate(tx.transactionDate)}
            </p>
          </div>
          <p
            className={`shrink-0 tabular-nums text-sm font-semibold ${
              tx.type === "CREDIT" ? "text-[#0ca30c]" : "text-[#d03b3b]"
            }`}
          >
            {tx.type === "CREDIT" ? "+" : "-"} {formatCurrency(tx.amount)}
          </p>
        </li>
      ))}
    </ul>
  );
}
