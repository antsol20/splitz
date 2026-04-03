"use server";

import { prisma } from "@/lib/db";
import { createSettlementSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

async function revalidateGroup(groupId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { shareCode: true } });
  if (group) revalidatePath(`/groups/${group.shareCode}`);
}

export async function createSettlement(data: {
  groupId: string;
  fromId: string;
  toId: string;
  amount: number;
}) {
  const parsed = createSettlementSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (parsed.data.fromId === parsed.data.toId) {
    return { error: "Cannot settle with yourself" };
  }

  await prisma.settlement.create({ data: parsed.data });

  await revalidateGroup(parsed.data.groupId);
  return { success: true };
}

export type Balance = {
  userId: string;
  userName: string;
  balance: number;
};

export type Debt = {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
};

export async function calculateBalances(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: true } },
      expenses: { include: { splits: true } },
      settlements: true,
    },
  });

  if (!group) return { balances: [], debts: [] };

  const balanceMap = new Map<string, number>();
  const nameMap = new Map<string, string>();

  for (const member of group.members) {
    balanceMap.set(member.userId, 0);
    nameMap.set(member.userId, member.user.name);
  }

  // For each expense: payer gets +amount, each split person gets -splitAmount
  for (const expense of group.expenses) {
    const current = balanceMap.get(expense.paidById) ?? 0;
    balanceMap.set(expense.paidById, current + expense.amount);

    for (const split of expense.splits) {
      const splitCurrent = balanceMap.get(split.userId) ?? 0;
      balanceMap.set(split.userId, splitCurrent - split.amount);
    }
  }

  // Settlements: from gets +amount (paid off debt), to gets -amount (received payment)
  for (const settlement of group.settlements) {
    const fromCurrent = balanceMap.get(settlement.fromId) ?? 0;
    balanceMap.set(settlement.fromId, fromCurrent + settlement.amount);

    const toCurrent = balanceMap.get(settlement.toId) ?? 0;
    balanceMap.set(settlement.toId, toCurrent - settlement.amount);
  }

  const balances: Balance[] = [];
  for (const [userId, balance] of balanceMap) {
    balances.push({
      userId,
      userName: nameMap.get(userId) ?? "Unknown",
      balance: Math.round(balance * 100) / 100,
    });
  }

  // Simplify debts using greedy algorithm
  const debts = simplifyDebts(balances, nameMap);

  return { balances, debts };
}

function simplifyDebts(
  balances: Balance[],
  nameMap: Map<string, string>,
): Debt[] {
  const debtors = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ userId: b.userId, amount: -b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ userId: b.userId, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const debts: Debt[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0.01) {
      debts.push({
        fromId: debtors[i].userId,
        fromName: nameMap.get(debtors[i].userId) ?? "Unknown",
        toId: creditors[j].userId,
        toName: nameMap.get(creditors[j].userId) ?? "Unknown",
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtors[i].amount -= amount;
    creditors[j].amount -= amount;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return debts;
}
