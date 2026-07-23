"use client";

import { useState } from "react";
import { addMemberToGroup } from "@/lib/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AddMemberForm({ groupId }: { groupId: string }) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    formData.set("groupId", groupId);
    const result = await addMemberToGroup(formData);
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Member added!");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5">
        <h3 className="font-semibold text-foreground">Add Member</h3>
        <p className="text-sm text-mauve mt-0.5">
          Add someone to this group by name.
        </p>
      </div>
      <form action={handleSubmit} className="flex flex-wrap gap-3">
        <div className="space-y-1.5 flex-1 min-w-[150px]">
          <Label htmlFor="member-name" className="text-sm text-foreground">
            Name
          </Label>
          <Input id="member-name" name="name" placeholder="John" required />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={pending}
            className="bg-gradient-to-r from-rose-muted to-primary text-background font-medium hover:opacity-90 transition-opacity"
          >
            {pending ? "Adding..." : "Add"}
          </Button>
        </div>
      </form>
    </div>
  );
}
