"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/views/spv", label: "Supervisor" },
  { href: "/views/manager", label: "Manager" },
  { href: "/views/teknisi", label: "Teknisi" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="w-full bg-background/80 shadow-sm sticky top-0 z-30 border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Link href="/views" className="font-bold text-xl tracking-tight text-primary">
          CoralOps
        </Link>
        <div className="flex gap-2 md:gap-6 items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded transition-colors text-sm font-medium
                hover:bg-accent hover:text-accent-foreground
                ${pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-foreground"}
              `}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
