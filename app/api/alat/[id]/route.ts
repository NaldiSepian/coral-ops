import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
        { error: "Only Supervisors can update inventory" },
        { status: 403 }
      );
    }

    const { id: alatId } = await params;
    const alatIdNum = parseInt(alatId);

    if (isNaN(alatIdNum)) {
      return NextResponse.json(
        { error: "Invalid alat ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { nama, stok_total, tipe_alat, deskripsi, foto_url } = body;

    // Validation
    if (!nama || typeof nama !== 'string' || !nama.trim()) {
      return NextResponse.json(
        { error: "Nama alat harus diisi" },
        { status: 400 }
      );
    }

    if (!stok_total || typeof stok_total !== 'number' || stok_total < 0) {
      return NextResponse.json(
        { error: "Stok total harus berupa angka positif" },
        { status: 400 }
      );
    }

    // Check if alat exists and get current data
    const { data: existingAlat, error: checkError } = await supabase
      .from("alat")
      .select("*")
      .eq("id", alatIdNum)
      .eq("is_deleted", false)
      .single();

    if (checkError || !existingAlat) {
      return NextResponse.json(
        { error: "Alat tidak ditemukan" },
        { status: 404 }
      );
    }

    // Maintain consistency between total, borrowed, and available
    const borrowed = existingAlat.stok_total - existingAlat.stok_tersedia;
    if (stok_total < borrowed) {
      return NextResponse.json(
        { error: `Stok total tidak boleh kurang dari jumlah yang sedang dipinjam (${borrowed})` },
        { status: 400 }
      );
    }

    const newStokTersedia = stok_total - borrowed;

    // Update alat
    const { data: updatedAlat, error: updateError } = await supabase
      .from("alat")
      .update({
        nama: nama.trim(),
        stok_total: stok_total,
        stok_tersedia: newStokTersedia,
        tipe_alat: tipe_alat || null,
        deskripsi: deskripsi || null,
        foto_url: foto_url || existingAlat.foto_url,
      })
      .eq("id", alatIdNum)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating alat:", updateError);
      return NextResponse.json(
        { error: "Failed to update alat" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedAlat);

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
        { error: "Only Supervisors can delete inventory" },
        { status: 403 }
      );
    }

    const { id: alatId } = await params;
    const alatIdNum = parseInt(alatId);

    if (isNaN(alatIdNum)) {
      return NextResponse.json(
        { error: "Invalid alat ID" },
        { status: 400 }
      );
    }

    // Check if alat exists
    const { data: existingAlat, error: checkError } = await supabase
      .from("alat")
      .select("*")
      .eq("id", alatIdNum)
      .eq("is_deleted", false)
      .single();

    if (checkError || !existingAlat) {
      return NextResponse.json(
        { error: "Alat tidak ditemukan" },
        { status: 404 }
      );
    }

    // Soft delete alat
    const { error: deleteError } = await supabase
      .from("alat")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", alatIdNum);

    if (deleteError) {
      console.error("Error soft deleting alat:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete alat" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Alat berhasil dihapus",
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}