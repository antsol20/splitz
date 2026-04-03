"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createGroup } from "@/lib/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function NewGroupPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    const result = await createGroup(formData);
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.shareCode) {
      setShareCode(result.shareCode);
    }
  }

  function handleCopy() {
    if (!shareCode) return;
    navigator.clipboard.writeText(shareCode);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  if (shareCode) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-4 text-xl">
              ✓
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Group Created!
            </h2>
            <p className="text-sm text-mauve mt-1">
              Share this code with your group members so they can access the
              group.
            </p>
          </div>

          <div className="bg-accent rounded-lg p-4 mb-6">
            <p className="text-xs text-mauve mb-1 uppercase tracking-wider">
              Group Code
            </p>
            <p className="text-3xl font-mono font-bold text-foreground tracking-widest">
              {shareCode}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopy}
            >
              {copied ? "Copied!" : "Copy Code"}
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-rose-muted to-primary text-background font-medium hover:opacity-90 transition-opacity"
              onClick={() => router.push(`/groups/${shareCode}`)}
            >
              Go to Group
            </Button>
          </div>

          <p className="text-xs text-mauve/60 mt-4">
            Anyone with this code can view and manage the group.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground">
            Create a New Group
          </h2>
          <p className="text-sm text-mauve mt-1">
            Start tracking shared expenses with your group.
          </p>
        </div>
        <form action={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-foreground">
              Group Name
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Trip to Barcelona"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-foreground">
              Description{" "}
              <span className="text-mauve font-normal">(optional)</span>
            </Label>
            <Input
              id="description"
              name="description"
              placeholder="e.g. Summer vacation 2026"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm text-foreground">
              Currency
            </Label>
            <Input
              id="currency"
              name="currency"
              defaultValue="USD"
              placeholder="USD"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-rose-muted to-primary text-background font-medium hover:opacity-90 transition-opacity"
            disabled={pending}
          >
            {pending ? "Creating..." : "Create Group"}
          </Button>
        </form>
      </div>
    </div>
  );
}
