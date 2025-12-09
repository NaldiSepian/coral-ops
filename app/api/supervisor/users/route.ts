import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is Supervisor
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is Supervisor
    const { data: profile, error: profileError } = await supabase
      .from("profil")
      .select("peran")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.peran !== "Supervisor") {
      return NextResponse.json(
        { error: "Only Supervisors can add users" },
        { status: 403 }
      );
    }

    // Get request body
    const { email, password, nama, peran, lisensi_teknisi } = await request.json();

    // Validate input
    if (!email || !password || !nama || !peran) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, nama, peran" },
        { status: 400 }
      );
    }

    // Validate peran - only Teknisi allowed
    if (peran !== "Teknisi") {
      return NextResponse.json(
        { error: "Invalid role. Only Teknisi role is allowed" },
        { status: 400 }
      );
    }

    // Validate lisensi_teknisi for Teknisi
    if (peran === "Teknisi" && (!lisensi_teknisi || !["Level 1", "Level 2", "Level 3"].includes(lisensi_teknisi))) {
      return NextResponse.json(
        { error: "Lisensi teknisi harus dipilih (Level 1, Level 2, atau Level 3)" },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto confirm email
    });

    if (createUserError) {
      console.error("Error creating user:", createUserError);
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    // Create profile in database
    const { error: profileInsertError } = await supabase
      .from("profil")
      .insert({
        id: authData.user.id,
        nama,
        peran: peran as "Teknisi",
        lisensi_teknisi: lisensi_teknisi,
      });

    if (profileInsertError) {
      console.error("Error creating profile:", profileInsertError);
      // If profile creation fails, we should delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        nama,
        peran,
      },
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}