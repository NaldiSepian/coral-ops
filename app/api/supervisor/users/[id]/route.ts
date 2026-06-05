import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Only Supervisors can update users" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // Get request body
    const { nama, peran, lisensi_teknisi } = await request.json();

    // Validate input
    if (!nama || !peran) {
      return NextResponse.json(
        { error: "Missing required fields: nama, peran" },
        { status: 400 }
      );
    }

    // Validate peran
    const validRoles = ["Supervisor", "Manager", "Teknisi"];
    if (!validRoles.includes(peran)) {
      return NextResponse.json(
        { error: "Invalid role. Must be Supervisor, Manager, or Teknisi" },
        { status: 400 }
      );
    }

    // Validate lisensi_teknisi for Teknisi role
    if (peran === "Teknisi") {
      const validLisensi = ["Level 1", "Level 2", "Level 3"];
      if (!lisensi_teknisi || !validLisensi.includes(lisensi_teknisi)) {
        return NextResponse.json(
          { error: "Teknisi must have a valid lisensi_teknisi (Level 1, Level 2, or Level 3)" },
          { status: 400 }
        );
      }
    }

    // Update profile in database
    const updateData: any = {
      nama,
      peran: peran as "Supervisor" | "Manager" | "Teknisi",
    };

    // Add lisensi_teknisi for Teknisi role
    if (peran === "Teknisi") {
      updateData.lisensi_teknisi = lisensi_teknisi;
    } else {
      // Clear lisensi_teknisi for non-Teknisi roles
      updateData.lisensi_teknisi = null;
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profil")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedProfile,
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Only Supervisors can delete users" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    // Check if user exists and is not deleted
    const { data: existingUser, error: checkError } = await supabase
      .from("profil")
      .select("nama")
      .eq("id", userId)
      .eq("is_deleted", false)
      .single();

    if (checkError || !existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // HARD DELETE: Delete from both profil and auth.users
      console.log(`Performing hard delete for user ${userId}`);

      // Delete from profil table first
      const { error: profileDeleteError } = await supabase
        .from("profil")
        .delete()
        .eq("id", userId);

      if (profileDeleteError) {
        console.error("Error hard deleting profile:", profileDeleteError);
        return NextResponse.json(
          { error: "Failed to hard delete user profile" },
          { status: 500 }
        );
      }

      // Delete from auth.users
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        console.error("Error deleting auth user:", authDeleteError);
        // Note: Profile already deleted, but auth user deletion failed
        return NextResponse.json(
          { error: "Profile deleted but failed to delete auth user" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "User hard deleted successfully (auth + profile)",
        type: "hard_delete",
      });
    } else {
      // SOFT DELETE: Default behavior
      const { error: deleteError } = await supabase
        .from("profil")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (deleteError) {
        console.error("Error soft deleting profile:", deleteError);
        return NextResponse.json(
          { error: "Failed to soft delete user" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "User soft deleted successfully",
        type: "soft_delete",
      });
    }

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}