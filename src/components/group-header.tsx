"use client";

import { useRouter } from "next/navigation";
import { deleteGroup } from "@/lib/actions/groups";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type GroupHeaderProps = {
  group: {
    id: string;
    name: string;
    description: string | null;
    currency: string;
    members: { id: string }[];
  };
};

export function GroupHeader({ group }: GroupHeaderProps) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this group?")) return;
    await deleteGroup(group.id);
    toast.success("Group deleted");
    router.push("/groups");
  }

  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
          <span className="text-xs text-mauve border border-border rounded px-2 py-0.5">
            {group.currency}
          </span>
        </div>
        {group.description && (
          <p className="text-mauve mt-1">{group.description}</p>
        )}
        <p className="text-sm text-mauve/60 mt-1">
          {group.members.length}{" "}
          {group.members.length === 1 ? "member" : "members"}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleDelete}
      >
        Delete
      </Button>
    </div>
  );
}
