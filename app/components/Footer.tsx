"use client";
import { ThemeSwitcher } from "@/components/theme-switcher";

interface FooterProps {
  year: number;
}

export default function Footer({ year }: FooterProps) {
  return (
    <footer className="w-full bg-background border-t border-border text-center text-xs text-muted-foreground py-3 mt-8 relative">
      &copy; {year} CoralOps. All rights reserved.
      <div className="absolute right-4 bottom-3">
        <ThemeSwitcher />
      </div>
    </footer>
  );
}
