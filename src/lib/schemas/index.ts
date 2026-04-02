import { z } from "zod/v4";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.email("Invalid email address"),
});

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  description: z.string().max(500).optional(),
  currency: z.string().min(1).max(10).default("USD"),
});

export const addMemberSchema = z.object({
  groupId: z.string().min(1),
  email: z.email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100),
});

export const createExpenseSchema = z.object({
  description: z.string().min(1, "Description is required").max(200),
  amount: z.number().positive("Amount must be positive"),
  groupId: z.string().min(1),
  paidById: z.string().min(1, "Payer is required"),
  splitType: z.enum(["equal", "exact", "percentage"]).default("equal"),
  splits: z
    .array(
      z.object({
        userId: z.string().min(1),
        amount: z.number().min(0),
      }),
    )
    .optional(),
  date: z.coerce.date().optional(),
});

export const createSettlementSchema = z.object({
  groupId: z.string().min(1),
  fromId: z.string().min(1, "Payer is required"),
  toId: z.string().min(1, "Recipient is required"),
  amount: z.number().positive("Amount must be positive"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
