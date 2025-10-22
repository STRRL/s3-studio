import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 py-16 text-center text-foreground">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          s3 studio starter
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Next.js + Tailwind CSS + shadcn/ui
        </h1>
        <p className="text-balance text-lg text-muted-foreground sm:text-xl">
          A modern stack wired up and ready for your product UI with accessible,
          composable components.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg">Open Dashboard</Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="https://ui.shadcn.com/docs" target="_blank" rel="noreferrer">
            Browse Components
          </Link>
        </Button>
      </div>
    </main>
  );
}
