import Link from "next/link";
import { Container } from "./container";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            ENVO
          </Link>
          <MainNav />
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
