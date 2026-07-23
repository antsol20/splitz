"use server";

import { getPrisma } from "@/lib/db";
import {
  createGroupSchema,
  addMemberSchema,
  createUserSchema,
} from "@/lib/schemas";
import { revalidatePath } from "next/cache";

function generateShareCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""); // 8-char hex string
}

export async function createGroup(formData: FormData) {
  const prisma = getPrisma();
  const parsed = createGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    currency: formData.get("currency") || "USD",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const group = await prisma.group.create({
    data: {
      ...parsed.data,
      shareCode: generateShareCode(),
    },
  });

  revalidatePath("/groups");
  return { shareCode: group.shareCode };
}

export async function addMemberToGroup(formData: FormData) {
  const prisma = getPrisma();
  const parsed = addMemberSchema.safeParse({
    groupId: formData.get("groupId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { groupId, name } = parsed.data;

  const userParsed = createUserSchema.safeParse({ name });
  if (!userParsed.success) {
    return { error: userParsed.error.issues[0].message };
  }

  // Without an email there is no identity that spans groups, so a person is
  // scoped to the group they were added to: name is what distinguishes them,
  // and each add creates its own user row.
  const existing = await prisma.member.findFirst({
    where: { groupId, user: { name } },
    select: { id: true },
  });

  if (existing) {
    return { error: "Someone with that name is already in the group" };
  }

  const user = await prisma.user.create({ data: userParsed.data });

  await prisma.member.create({
    data: { userId: user.id, groupId },
  });

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { shareCode: true },
  });

  if (group) revalidatePath(`/groups/${group.shareCode}`);

  return { success: true };
}

export async function getGroupByShareCode(shareCode: string) {
  const prisma = getPrisma();
  return prisma.group.findUnique({
    where: { shareCode },
    include: {
      members: { include: { user: true } },
      expenses: {
        include: {
          paidBy: true,
          splits: { include: { user: true } },
        },
        orderBy: { date: "desc" },
      },
      settlements: {
        include: { from: true, to: true },
        orderBy: { date: "desc" },
      },
    },
  });
}

export async function deleteGroup(groupId: string) {
  const prisma = getPrisma();
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { shareCode: true },
  });
  await prisma.group.delete({ where: { id: groupId } });
  if (group) revalidatePath(`/groups/${group.shareCode}`);
  return { success: true };
}

export async function removeMember(groupId: string, memberId: string) {
  const prisma = getPrisma();
  await prisma.member.delete({ where: { id: memberId } });
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { shareCode: true },
  });
  if (group) revalidatePath(`/groups/${group.shareCode}`);
  return { success: true };
}
