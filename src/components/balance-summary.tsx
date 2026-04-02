"use client";

import { formatCurrency } from "@/lib/format";
import type { Balance, Debt } from "@/lib/actions/settlements";

type BalanceSummaryProps = {
  balances: Balance[];
  debts: Debt[];
  currency: string;
};

export function BalanceSummary({
  balances,
  debts,
  currency,
}: BalanceSummaryProps) {
  if (balances.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-mauve">
        Add members and expenses to see balances.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Member Balances</h3>
        </div>
        <div className="px-6 py-2">
          {balances.map((b, i) => (
            <div
              key={b.userId}
              className={`flex items-center justify-between py-3 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <span className="text-sm text-foreground">{b.userName}</span>
              <span
                className={`font-medium text-sm ${
                  b.balance > 0.01
                    ? "text-emerald-400"
                    : b.balance < -0.01
                      ? "text-red-400"
                      : "text-mauve"
                }`}
              >
                {b.balance > 0 ? "+" : ""}
                {formatCurrency(b.balance, currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {debts.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">
              Suggested Payments
            </h3>
          </div>
          <div className="px-6 py-2">
            {debts.map((d, i) => (
              <div
                key={i}
                className={`flex items-center justify-between py-3 text-sm ${i > 0 ? "border-t border-border" : ""}`}
              >
                <span className="text-foreground">
                  <span className="font-medium">{d.fromName}</span>
                  <span className="text-mauve">{" owes "}</span>
                  <span className="font-medium">{d.toName}</span>
                </span>
                <span className="font-semibold text-rose">
                  {formatCurrency(d.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {debts.length === 0 &&
        balances.some((b) => Math.abs(b.balance) > 0.01) && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-mauve">
            All settled up!
          </div>
        )}
    </div>
  );
}
