"use server";

import { getPrisma } from "@/lib/db";
import { createExpenseSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

async function revalidateGroup(groupId: string) {
  const prisma = getPrisma();
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { shareCode: true },
  });
  if (group) revalidatePath(`/groups/${group.shareCode}`);
}

export async function createExpense(data: {
  description: string;
  amount: number;
  groupId: string;
  paidById: string;
  splitType: "equal" | "exact" | "percentage";
  splits?: { userId: string; amount: number }[];
  date?: Date;
}) {
  const prisma = getPrisma();
  const parsed = createExpenseSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { description, amount, groupId, paidById, splitType, date } =
    parsed.data;

  const members = await prisma.member.findMany({
    where: { groupId },
    include: { user: true },
  });

  if (members.length === 0) {
    return { error: "Group has no members" };
  }

  let splitAmounts: { userId: string; amount: number }[];

  if (splitType === "equal") {
    const perPerson = Math.round((amount / members.length) * 100) / 100;
    const remainder =
      Math.round((amount - perPerson * members.length) * 100) / 100;

    splitAmounts = members.map((m, i) => ({
      userId: m.userId,
      amount: i === 0 ? perPerson + remainder : perPerson,
    }));
  } else if (splitType === "exact" && parsed.data.splits) {
    const total = parsed.data.splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(total - amount) > 0.01) {
      return { error: "Split amounts must equal the total" };
    }
    splitAmounts = parsed.data.splits;
  } else if (splitType === "percentage" && parsed.data.splits) {
    const totalPct = parsed.data.splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      return { error: "Percentages must add up to 100" };
    }
    splitAmounts = parsed.data.splits.map((s) => ({
      userId: s.userId,
      amount: Math.round(amount * (s.amount / 100) * 100) / 100,
    }));
  } else {
    return { error: "Invalid split configuration" };
  }

  const expense = await prisma.expense.create({
    data: {
      description,
      amount,
      groupId,
      paidById,
      splitType,
      date: date || new Date(),
      splits: {
        create: splitAmounts.map((s) => ({
          userId: s.userId,
          amount: s.amount,
        })),
      },
    },
    include: { splits: true },
  });

  await revalidateGroup(groupId);
  return { expenseId: expense.id };
}

export async function deleteExpense(expenseId: string, groupId: string) {
  const prisma = getPrisma();
  await prisma.expense.delete({ where: { id: expenseId } });
  await revalidateGroup(groupId);
  return { success: true };
}
