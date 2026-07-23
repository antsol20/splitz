export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getGroupByShareCode } from "@/lib/actions/groups";
import { calculateBalances } from "@/lib/actions/settlements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddMemberForm } from "@/components/add-member-form";
import { AddExpenseForm } from "@/components/add-expense-form";
import { ExpenseList } from "@/components/expense-list";
import { BalanceSummary } from "@/components/balance-summary";
import { SettleUpForm } from "@/components/settle-up-form";
import { GroupHeader } from "@/components/group-header";
import { MemberList } from "@/components/member-list";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const group = await getGroupByShareCode(id);

  if (!group) {
    notFound();
  }

  const { balances, debts } = await calculateBalances(group.id);

  const members = group.members.map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.user.name,
  }));

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <GroupHeader group={group} />

      <Tabs defaultValue="expenses" className="mt-10">
        <TabsList className="w-full justify-start border-b border-border bg-transparent rounded-none p-0 h-auto gap-0">
          {["expenses", "balances", "settle", "members"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab === "settle" ? "settle" : tab}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-rose data-[state=active]:text-rose data-[state=active]:bg-transparent data-[state=active]:shadow-none text-mauve hover:text-foreground px-5 py-3 capitalize transition-colors"
            >
              {tab === "settle" ? "Settle Up" : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="expenses" className="space-y-6 mt-8">
          <AddExpenseForm groupId={group.id} members={members} />
          <ExpenseList
            expenses={group.expenses.map((e) => ({
              id: e.id,
              description: e.description,
              amount: e.amount,
              date: e.date.toISOString(),
              paidByName: e.paidBy.name,
              splitType: e.splitType,
              splits: e.splits.map((s) => ({
                userName: s.user.name,
                amount: s.amount,
              })),
            }))}
            groupId={group.id}
            currency={group.currency}
          />
        </TabsContent>

        <TabsContent value="balances" className="mt-8">
          <BalanceSummary
            balances={balances}
            debts={debts}
            currency={group.currency}
          />
        </TabsContent>

        <TabsContent value="settle" className="mt-8">
          <SettleUpForm
            groupId={group.id}
            members={members}
            debts={debts}
            currency={group.currency}
          />
        </TabsContent>

        <TabsContent value="members" className="space-y-6 mt-8">
          <AddMemberForm groupId={group.id} />
          <MemberList members={members} groupId={group.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
