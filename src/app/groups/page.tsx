import Link from "next/link";
import { getGroups } from "@/lib/actions/groups";
import { buttonVariants } from "@/components/ui/button-variants";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const groups = await getGroups();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Groups</h1>
          <p className="text-mauve mt-1">Manage your expense groups</p>
        </div>
        <Link
          href="/groups/new"
          className={buttonVariants({
            className:
              "bg-gradient-to-r from-rose-muted to-primary text-background font-medium hover:opacity-90 transition-opacity",
          })}
        >
          New Group
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-16 text-center">
          <p className="text-mauve mb-6">
            You haven&apos;t created any groups yet.
          </p>
          <Link
            href="/groups/new"
            className={buttonVariants({
              className:
                "bg-gradient-to-r from-rose-muted to-primary text-background font-medium hover:opacity-90 transition-opacity",
            })}
          >
            Create your first group
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-border grid gap-px md:grid-cols-2">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <div className="bg-card p-6 h-full transition-colors hover:bg-accent cursor-pointer group">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-foreground group-hover:text-rose transition-colors">
                    {group.name}
                  </h3>
                  <span className="text-xs text-mauve border border-border rounded px-1.5 py-0.5">
                    {group.currency}
                  </span>
                </div>
                {group.description && (
                  <p className="text-sm text-mauve mb-3">
                    {group.description}
                  </p>
                )}
                <div className="flex gap-4 text-xs text-mauve/60">
                  <span>
                    {group.members.length}{" "}
                    {group.members.length === 1 ? "member" : "members"}
                  </span>
                  <span>
                    {group._count.expenses}{" "}
                    {group._count.expenses === 1 ? "expense" : "expenses"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
