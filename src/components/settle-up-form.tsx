"use client";

import { useState } from "react";
import { createSettlement } from "@/lib/actions/settlements";
import type { Debt } from "@/lib/actions/settlements";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Member = {
  id: string;
  userId: string;
  name: string;
};

type SettleUpFormProps = {
  groupId: string;
  members: Member[];
  debts: Debt[];
  currency: string;
};

export function SettleUpForm({
  groupId,
  members,
  debts,
  currency,
}: SettleUpFormProps) {
  const [pending, setPending] = useState(false);

  async function handleQuickSettle(debt: Debt) {
    setPending(true);
    const result = await createSettlement({
      groupId,
      fromId: debt.fromId,
      toId: debt.toId,
      amount: debt.amount,
    });
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Payment recorded!");
  }

  async function handleCustomSettle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    setPending(true);
    const result = await createSettlement({
      groupId,
      fromId: form.get("fromId") as string,
      toId: form.get("toId") as string,
      amount: parseFloat(form.get("amount") as string),
    });
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Payment recorded!");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="space-y-4">
      {debts.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Quick Settle</h3>
            <p className="text-sm text-mauve mt-0.5">
              One-click record a suggested payment.
            </p>
          </div>
          <div>
            {debts.map((debt, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-6 py-4 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <span className="text-sm text-foreground">
                  <span className="font-medium">{debt.fromName}</span>
                  <span className="text-mauve">{" pays "}</span>
                  <span className="font-medium">{debt.toName}</span>{" "}
                  <span className="font-semibold text-rose">
                    {formatCurrency(debt.amount, currency)}
                  </span>
                </span>
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() => handleQuickSettle(debt)}
                  className="bg-gradient-to-r from-rose-muted to-primary text-background font-medium hover:opacity-90 transition-opacity"
                >
                  Record
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5">
          <h3 className="font-semibold text-foreground">Custom Payment</h3>
          <p className="text-sm text-mauve mt-0.5">
            Record a custom settlement.
          </p>
        </div>
        <form onSubmit={handleCustomSettle} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fromId" className="text-sm text-foreground">
                From
              </Label>
              <select
                id="fromId"
                name="fromId"
                required
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select payer</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="toId" className="text-sm text-foreground">
                To
              </Label>
              <select
                id="toId"
                name="toId"
                required
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select recipient</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="settle-amount"
                className="text-sm text-foreground"
              >
                Amount
              </Label>
              <Input
                id="settle-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={pending}
            className="bg-gradient-to-r from-rose-muted to-primary text-background font-medium hover:opacity-90 transition-opacity"
          >
            {pending ? "Recording..." : "Record Payment"}
          </Button>
        </form>
      </div>
    </div>
  );
}
