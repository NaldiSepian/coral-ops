
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import type { PropsWithChildren } from "react";
import { getUserProfile } from "@/lib/auth";

export default async function ViewsLayout({ children }: PropsWithChildren) {
  const profile = await getUserProfile();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar role={profile?.peran || null} nama={profile?.nama || "User"} />
      <main className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 w-full max-w-6xl mx-auto">{children}</main>
      <Footer year={2025} />
    </div>
  );
}
