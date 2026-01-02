import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  nama: string;
  email: string;
  peran: string;
  created_at: string;
}

export function useAccount() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const fetchProfile = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push("/auth/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profil")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setMessage({ type: 'error', text: 'Gagal memuat data profil' });
        return;
      }

      setProfile({ ...profileData, email: user.email || "" });
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memuat data' });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (nama: string) => {
    if (!profile) return;

    setUpdating(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("profil")
        .update({ nama })
        .eq("id", profile.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profil berhasil diperbarui' });
      await fetchProfile(); // Refresh data
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memperbarui profil' });
    } finally {
      setUpdating(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    setUpdating(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password berhasil diperbarui' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memperbarui password' });
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    updating,
    message,
    setMessage,
    updateProfile,
    updatePassword,
  };
}