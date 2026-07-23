"use client";

import { removeMember } from "@/lib/actions/groups";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Member = {
  id: string;
  userId: string;
  name: string;
};

export function MemberList({
  members,
  groupId,
}: {
  members: Member[];
  groupId: string;
}) {
  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`Remove ${name} from the group?`)) return;
    const result = await removeMember(groupId, memberId);
    if (result.success) {
      toast.success(`${name} removed from group`);
    }
  }

  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-mauve">
        No members yet. Add someone above.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Members</h3>
      </div>
      <div>
        {members.map((member, i) => (
          <div
            key={member.id}
            className={`flex items-center justify-between px-6 py-4 ${i > 0 ? "border-t border-border" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-rose/10 flex items-center justify-center text-xs font-medium text-rose">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <p className="text-sm font-medium text-foreground">
                {member.name}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
              onClick={() => handleRemove(member.id, member.name)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
