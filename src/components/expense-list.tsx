"use client";

import { deleteExpense } from "@/lib/actions/expenses";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  paidByName: string;
  splitType: string;
  splits: { userName: string; amount: number }[];
};

type ExpenseListProps = {
  expenses: Expense[];
  groupId: string;
  currency: string;
};

export function ExpenseList({ expenses, groupId, currency }: ExpenseListProps) {
  async function handleDelete(expenseId: string) {
    if (!confirm("Delete this expense?")) return;
    const result = await deleteExpense(expenseId, groupId);
    if (result.success) {
      toast.success("Expense deleted");
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-mauve">
        No expenses yet. Add one above.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">
          Expenses{" "}
          <span className="text-mauve font-normal">({expenses.length})</span>
        </h3>
      </div>
      <div>
        {expenses.map((expense, i) => (
          <div
            key={expense.id}
            className={`px-6 py-4 hover:bg-accent/50 transition-colors ${i > 0 ? "border-t border-border" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">
                    {expense.description}
                  </p>
                  <span className="text-[11px] text-mauve/60 border border-border rounded px-1.5 py-0.5">
                    {expense.splitType}
                  </span>
                </div>
                <p className="text-sm text-mauve mt-0.5">
                  {expense.paidByName} paid{" "}
                  {formatCurrency(expense.amount, currency)} &middot;{" "}
                  {format(new Date(expense.date), "MMM d, yyyy")}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                  {expense.splits.map((split, j) => (
                    <span key={j} className="text-xs text-mauve/50">
                      {split.userName}: {formatCurrency(split.amount, currency)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="font-semibold text-rose">
                  {formatCurrency(expense.amount, currency)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                  onClick={() => handleDelete(expense.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
