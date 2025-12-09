
import { createClient } from "@/lib/supabase/server";

export async function getUserRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  // Query profil table to get role
  const { data, error } = await supabase
    .from("profil")
    .select("peran")
    .eq("id", user.id)
    .single();
  if (error || !data) return null;
  return data.peran;
}

export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  // Query profil table to get nama and peran
  const { data, error } = await supabase
    .from("profil")
    .select("nama, peran")
    .eq("id", user.id)
    .single();
  if (error || !data) return null;
  return { nama: data.nama, peran: data.peran };
}
