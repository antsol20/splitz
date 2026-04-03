import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-20">
        {/* Radial glow behind hero */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,#f5c0c015_0%,transparent_70%)] pointer-events-none" />

        <div className="container relative mx-auto px-4 text-center max-w-4xl">
          <p className="text-mauve text-sm tracking-widest uppercase mb-6">
            No sign-up required
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1]">
            <span className="text-foreground">Split expenses,</span>
            <br />
            <span className="bg-gradient-to-r from-rose to-rose-muted bg-clip-text text-transparent">
              not friendships.
            </span>
          </h1>
          <p className="mt-8 text-lg text-mauve max-w-xl mx-auto leading-relaxed">
            Track shared expenses with your group. Add costs, split them fairly,
            and see who owes what.
          </p>
          <div className="mt-12 flex gap-4 justify-center">
            <Link
              href="/groups/new"
              className={buttonVariants({
                size: "lg",
                className:
                  "bg-gradient-to-r from-rose-muted to-primary text-background font-semibold px-8 hover:opacity-90 transition-opacity",
              })}
            >
              Create a Group
            </Link>
            <Link
              href="/groups"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className:
                  "border-border hover:border-rose/40 hover:bg-rose/5 text-foreground px-8 transition-all",
              })}
            >
              Find a Group
            </Link>
          </div>
        </div>
      </section>

      {/* Divider line */}
      <div className="container mx-auto px-4">
        <div className="border-t border-border" />
      </div>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <div className="grid gap-px md:grid-cols-3 rounded-xl border border-border overflow-hidden bg-border">
          {[
            {
              title: "No Sign-up Required",
              desc: "Create a group and start splitting right away. Share the code with friends.",
              detail:
                "Just create a group, share its unique code, add members, and start tracking expenses.",
            },
            {
              title: "Flexible Splitting",
              desc: "Split equally, by exact amounts, or by percentage.",
              detail:
                "Not everyone eats the same amount of pizza. Choose how each expense gets divided.",
            },
            {
              title: "Smart Settlements",
              desc: "Minimized payments to settle up efficiently.",
              detail:
                "Our algorithm simplifies who owes whom, so you make the fewest transfers possible.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-card p-8 transition-colors hover:bg-accent group"
            >
              <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-rose transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-mauve leading-relaxed mb-3">
                {feature.desc}
              </p>
              <p className="text-sm text-mauve/60 leading-relaxed">
                {feature.detail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
