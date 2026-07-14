import Link from "next/link";
import { Button } from "@repo/ui";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24">
      <div className="max-w-lg space-y-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Turbo Starter</h1>
        <p className="text-muted-foreground">
          NestJS API + Next.js web monorepo with auth, RBAC, and shared UI.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/login">
          <Button type="button">Sign in</Button>
        </Link>
        <Link href="/register">
          <Button type="button" variant="outline">
            Create account
          </Button>
        </Link>
        <Link href="/design-system">
          <Button type="button" variant="ghost">
            Design system
          </Button>
        </Link>
      </div>
    </main>
  );
}
