"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";

export default function GroupsPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter a group code");
      return;
    }
    setError("");
    router.push(`/groups/${trimmed}`);
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground">Find a Group</h2>
          <p className="text-sm text-mauve mt-1">
            Enter the group code shared with you to view expenses.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm text-foreground">
              Group Code
            </Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              placeholder="e.g. a1b2c3d4"
              className="font-mono"
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-rose-muted to-primary text-background font-medium hover:opacity-90 transition-opacity"
          >
            View Group
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-sm text-mauve mb-3">
            Or start a new expense group
          </p>
          <Link
            href="/groups/new"
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            Create New Group
          </Link>
        </div>
      </div>
    </div>
  );
}
