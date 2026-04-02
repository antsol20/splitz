"use client";

import { useState } from "react";
import { createExpense } from "@/lib/actions/expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Member = {
  id: string;
  userId: string;
  name: string;
};

type AddExpenseFormProps = {
  groupId: string;
  members: Member[];
};

export function AddExpenseForm({ groupId, members }: AddExpenseFormProps) {
  const [pending, setPending] = useState(false);
  const [splitType, setSplitType] = useState<"equal" | "exact" | "percentage">(
    "equal",
  );
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (members.length === 0) {
      toast.error("Add members before creating expenses");
      return;
    }

    const form = new FormData(e.currentTarget);
    const amount = parseFloat(form.get("amount") as string);

    let splits: { userId: string; amount: number }[] | undefined;
    if (splitType !== "equal") {
      splits = members.map((m) => ({
        userId: m.userId,
        amount: parseFloat(customSplits[m.userId] || "0"),
      }));
    }

    setPending(true);
    const result = await createExpense({
      description: form.get("description") as string,
      amount,
      groupId,
      paidById: form.get("paidById") as string,
      splitType,
      splits,
      date: form.get("date") ? new Date(form.get("date") as string) : undefined,
    });
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Expense added!");
    (e.target as HTMLFormElement).reset();
    setSplitType("equal");
    setCustomSplits({});
  }

  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-mauve">
        Add members to the group before creating expenses.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5">
        <h3 className="font-semibold text-foreground">Add Expense</h3>
        <p className="text-sm text-mauve mt-0.5">
          Record a new shared expense.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-foreground">
              Description
            </Label>
            <Input
              id="description"
              name="description"
              placeholder="e.g. Dinner"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm text-foreground">
              Amount
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="paidById" className="text-sm text-foreground">
              Paid by
            </Label>
            <select
              id="paidById"
              name="paidById"
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
            <Label htmlFor="date" className="text-sm text-foreground">
              Date
            </Label>
            <Input id="date" name="date" type="date" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-foreground">Split type</Label>
          <div className="flex gap-1">
            {(["equal", "exact", "percentage"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSplitType(type)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  splitType === type
                    ? "bg-rose/15 text-rose border border-rose/30"
                    : "text-mauve border border-border hover:text-foreground hover:border-border"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {splitType !== "equal" && (
          <div className="space-y-3 rounded-lg border border-border bg-background p-4">
            <Label className="text-sm text-foreground">
              {splitType === "exact"
                ? "Amount per person"
                : "Percentage per person"}
            </Label>
            {members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3">
                <span className="text-sm text-mauve min-w-[100px]">
                  {m.name}
                </span>
                <Input
                  type="number"
                  step={splitType === "exact" ? "0.01" : "1"}
                  min="0"
                  placeholder="0"
                  value={customSplits[m.userId] || ""}
                  onChange={(e) =>
                    setCustomSplits((prev) => ({
                      ...prev,
                      [m.userId]: e.target.value,
                    }))
                  }
                  className="max-w-[120px]"
                />
                <span className="text-xs text-mauve/60">
                  {splitType === "percentage" ? "%" : ""}
                </span>
              </div>
            ))}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-rose-muted to-primary text-background font-medium hover:opacity-90 transition-opacity"
          disabled={pending}
        >
          {pending ? "Adding..." : "Add Expense"}
        </Button>
      </form>
    </div>
  );
}
