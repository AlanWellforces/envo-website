import { Container } from "@/components/layout/container";

export default function HomePage() {
  return (
    <Container className="py-16 sm:py-24">
      <div className="flex flex-col gap-6 max-w-2xl">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Phase 2a · scaffold
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          ENVO website scaffold
        </h1>
        <p className="text-lg text-muted-foreground">
          Placeholder homepage. Proves the Next.js + Tailwind v4 + shadcn/ui
          setup builds and typechecks cleanly. Real homepage gets ported from
          the c-version design in Phase 2b.
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 pt-4 border-t">
          <li>· Next.js 16 App Router + TypeScript</li>
          <li>· Tailwind CSS v4 (CSS-first @theme)</li>
          <li>· shadcn/ui</li>
          <li>· Payload CMS — pending</li>
        </ul>
      </div>
    </Container>
  );
}
