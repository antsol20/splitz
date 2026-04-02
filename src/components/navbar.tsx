import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

export function Navbar() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-base">
          <span className="text-rose">$</span>
          <span className="text-foreground">Splitz</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1">
          <Link
            href="/groups"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "text-mauve hover:text-foreground hover:bg-accent",
            })}
          >
            My Groups
          </Link>
          <Link
            href="/groups/new"
            className={buttonVariants({
              size: "sm",
              className:
                "bg-gradient-to-r from-rose-muted to-primary text-background font-medium hover:opacity-90 transition-opacity",
            })}
          >
            New Group
          </Link>
        </nav>
      </div>
    </header>
  );
}
