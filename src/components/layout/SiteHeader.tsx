import Link from "next/link";

const links = [
  { href: "/#work", label: "Trabajos" },
  { href: "/talent/apply", label: "Talento" },
  { href: "/client/models", label: "Área cliente" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
        <Link href="/" className="font-serif-display text-xl tracking-tight text-foreground">
          Vanessa Quijano
          <span className="mt-0.5 block text-xs font-sans font-normal tracking-[0.2em] text-muted">
            Maquillaje &amp; Producción
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
