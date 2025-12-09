"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return <span onClick={logout}>Logout</span>;
}
