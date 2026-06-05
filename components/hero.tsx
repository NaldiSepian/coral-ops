import { NextLogo } from "./next-logo";
import { SupabaseLogo } from "./supabase-logo";

export function Hero() {
  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="flex justify-center items-center">
        <img src="https://coral.web.id/wp-content/uploads/2024/01/cropped-icon.png" alt="Coral Logo" width={100} />
      </div>
      <h3 className="sr-only">CoralOps</h3>
      <p className="text-2xl lg:text-xl !leading-tight mx-auto max-w-xl text-center">
        CoralOps: Digitalisasi Operasional Lapangan
      </p>
      <p className="text-3xl lg:text-2xl text-center">
        <a
          href="https://coral.web.id"
          target="_blank"
          className="font-bold hover:underline"
          rel="noreferrer"
        >
          CV Coral
        </a>
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  ); 
}
