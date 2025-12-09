"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Header fixed di atas */}
      <nav className="w-full flex justify-center bg-background/80 backdrop-blur-sm border-b border-border py-4 px-4 fixed top-0 z-10">
        <div className="w-full max-w-md flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-primary">CoralOps</h1>
          </div>
          <div className="flex items-center">
            <a href="https://coral.web.id" target="_blank" className="text-primary hover:text-primary/90 text-sm font-medium">
              coral.web.id
            </a>
          </div>
        </div>
      </nav>

      {/* Main content dengan padding top untuk header */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-8">
          <img 
              src="/icon.png"  
              alt="CoralOps Logo"
              width={80}
              height={80}
              className="mx-auto mb-4"
              loading="eager"
              decoding="sync"
            />
        <div className="flex flex-col gap-6 items-center text-center max-w-md">
          <div>
          
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Sistem Operasional Lapangan
            </h2>
            <p className="text-lg text-muted-foreground">
              CV. Coral
            </p>
          </div>

          <p className="text-base text-muted-foreground leading-relaxed">
            Laporan teknisi real-time, tracking lokasi akurat, monitoring proyek live untuk pekerja lapangan profesional.
          </p>

          <Button size="lg" className="w-full max-w-xs">
            <Link href="/auth/login" className="w-full">Masuk ke Sistem</Link>
          </Button>
        </div>
      </div>

      {/* Footer di bawah */}
      <footer className="w-full flex items-center justify-center bg-background/60 backdrop-blur-sm border-t border-border py-4 px-4">
        <div className="w-full max-w-md flex justify-between items-center text-xs text-muted-foreground">
          <p>Developed by Naldi Septian</p>
          <ThemeSwitcher />
        </div>
      </footer>
    </main>
  );
}
