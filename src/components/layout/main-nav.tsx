import Link from "next/link";

const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/applications", label: "Applications" },
  { href: "/solutions", label: "Solutions" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
];

export function MainNav() {
  return (
    <nav className="hidden md:flex items-center gap-6">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export { NAV_LINKS };
