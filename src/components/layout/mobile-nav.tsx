import Link from "next/link";
import { NAV_LINKS } from "./main-nav";

export function MobileNav() {
  return (
    <nav className="md:hidden">
      <details className="group">
        <summary className="cursor-pointer list-none p-2 text-sm font-medium">
          Menu
        </summary>
        <ul className="absolute left-0 right-0 mt-2 border-t bg-background shadow-sm">
          {NAV_LINKS.map((link) => (
            <li key={link.href} className="border-b last:border-b-0">
              <Link
                href={link.href}
                className="block px-4 py-3 text-sm font-medium hover:bg-muted"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}
