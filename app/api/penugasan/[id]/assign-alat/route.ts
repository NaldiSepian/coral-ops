// API Routes untuk Assign/Remove Alat
// =============================================================================
// POST /api/penugasan/[id]/assign-alat - Assign alat ke penugasan
// - Body: { alat_assignments: [{ alat_id: number, jumlah: number }] }
// - Validasi stok cukup untuk setiap alat
// - Kurangi stok_tersedia di tabel alat
// - Insert ke tabel peminjaman_alat dengan status 'assigned'
// - Pastikan penugasan milik supervisor dan status 'draft' atau 'scheduled'
// - Return: success message dengan details assigned
//
// DELETE /api/penugasan/[id]/assign-alat - Remove alat dari penugasan
// - Body: { alat_id: number }
// - Return stok ke tabel alat (tambah stok_tersedia)
// - Delete record di peminjaman_alat
// - Validasi ownership penugasan
// - Return: success message
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: penugasanId } = await params;
    const penugasanIdNumber = parseInt(penugasanId, 10);

    if (Number.isNaN(penugasanIdNumber)) {
      return NextResponse.json({ error: "Invalid penugasan id" }, { status: 400 });
    }

    // Validate penugasan ownership dan status
    const { data: penugasan, error: penugasanError } = await supabase
      .from('penugasan')
      .select('supervisor_id, status')
      .eq('id', penugasanIdNumber)
      .single();

    if (penugasanError || !penugasan) {
      return NextResponse.json({ error: "Penugasan not found" }, { status: 404 });
    }

    // Check ownership
    if (penugasan.supervisor_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check status
    if (penugasan.status !== 'Aktif' && penugasan.status !== 'Menunggu Validasi') {
      return NextResponse.json({ error: "Can only assign to active or pending validation penugasan" }, { status: 400 });
    }

    // Parse body
    const body = await request.json();
    const { alat_assignments } = body; // [{ alat_id, jumlah }]

    // Validate alat_assignments
    if (!alat_assignments || !Array.isArray(alat_assignments) || alat_assignments.length === 0) {
      return NextResponse.json({ error: "alat_assignments array is required and cannot be empty" }, { status: 400 });
    }

    // Validate each alat assignment
    for (const assignment of alat_assignments) {
      const { alat_id, jumlah } = assignment;

      if (!alat_id || !jumlah || jumlah <= 0) {
        return NextResponse.json({ error: "Each assignment must have valid alat_id and jumlah > 0" }, { status: 400 });
      }

      // Check alat exists dan stok cukup
      const { data: alat, error: alatError } = await supabase
        .from('alat')
        .select('nama, stok_tersedia')
        .eq('id', alat_id)
        .eq('is_deleted', false)
        .single();

      if (alatError || !alat) {
        return NextResponse.json({ error: `Alat with id ${alat_id} not found` }, { status: 400 });
      }

      if (alat.stok_tersedia < jumlah) {
        return NextResponse.json({
          error: `Insufficient stock for alat ${alat.nama}. Available: ${alat.stok_tersedia}, Requested: ${jumlah}`
        }, { status: 400 });
      }
    }

    // Process assignments
    const assignmentResults = [];

    for (const assignment of alat_assignments) {
      const { alat_id, jumlah } = assignment;

      // Get current stock and update
      const { data: currentAlat, error: getError } = await supabase
        .from('alat')
        .select('stok_tersedia')
        .eq('id', alat_id)
        .single();

      if (getError || !currentAlat) {
        return NextResponse.json({ error: "Failed to get current stock" }, { status: 500 });
      }

      const newStock = currentAlat.stok_tersedia - jumlah;

      const { error: updateError } = await supabase
        .from('alat')
        .update({ stok_tersedia: newStock })
        .eq('id', alat_id);

      if (updateError) {
        console.error('Error updating stock:', updateError);
        return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
      }

      // Check if peminjaman already exists for this alat
      const { data: existingPeminjaman, error: existingError } = await supabase
        .from('peminjaman_alat')
        .select('id, jumlah, is_returned')
        .eq('penugasan_id', penugasanIdNumber)
        .eq('alat_id', alat_id)
        .maybeSingle();

      if (existingError) {
        console.error('Error checking existing peminjaman:', existingError);
        return NextResponse.json({ error: "Failed to verify existing peminjaman" }, { status: 500 });
      }

      if (existingPeminjaman && !existingPeminjaman.is_returned) {
        const newJumlah = existingPeminjaman.jumlah + jumlah;
        const { data: updatedPeminjaman, error: updatePeminjamanError } = await supabase
          .from('peminjaman_alat')
          .update({ jumlah: newJumlah })
          .eq('id', existingPeminjaman.id)
          .select(`
            *,
            alat!peminjaman_alat_alat_id_fkey(nama)
          `)
          .single();

        if (updatePeminjamanError || !updatedPeminjaman) {
          console.error('Error updating existing peminjaman:', updatePeminjamanError);
          return NextResponse.json({ error: "Failed to update peminjaman" }, { status: 500 });
        }

        assignmentResults.push({
          ...updatedPeminjaman,
          jumlah_assigned: jumlah,
          total_jumlah: newJumlah
        });
      } else {
        // Insert peminjaman_alat baru
        const { data: peminjaman, error: insertError } = await supabase
          .from('peminjaman_alat')
          .insert({
            penugasan_id: penugasanIdNumber,
            alat_id,
            jumlah,
            peminjam_id: user.id,
            is_returned: false
          })
          .select(`
            *,
            alat!peminjaman_alat_alat_id_fkey(nama)
          `)
          .single();

        if (insertError) {
          console.error('Error creating peminjaman:', insertError);
          // Rollback stok changes
          const { data: rollbackAlat } = await supabase
            .from('alat')
            .select('stok_tersedia')
            .eq('id', alat_id)
            .single();

          if (rollbackAlat) {
            await supabase
              .from('alat')
              .update({ stok_tersedia: rollbackAlat.stok_tersedia + jumlah })
              .eq('id', alat_id);
          }
          return NextResponse.json({ error: "Failed to create peminjaman" }, { status: 500 });
        }

        assignmentResults.push({
          ...peminjaman,
          jumlah_assigned: jumlah
        });
      }
    }

    return NextResponse.json({
      message: `Successfully assigned ${assignmentResults.length} alat`,
      assignments: assignmentResults
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/penugasan/[id]/assign-alat:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: penugasanId } = await params;
    const penugasanIdNumber = parseInt(penugasanId, 10);

    if (Number.isNaN(penugasanIdNumber)) {
      return NextResponse.json({ error: "Invalid penugasan id" }, { status: 400 });
    }

    // Parse body to get alat_id
    const body = await request.json();
    const { alat_id } = body;

    if (!alat_id) {
      return NextResponse.json({ error: "alat_id is required" }, { status: 400 });
    }

    // Validate penugasan ownership
    const { data: penugasan, error: penugasanError } = await supabase
      .from('penugasan')
      .select('supervisor_id')
      .eq('id', penugasanIdNumber)
      .single();

    if (penugasanError || !penugasan) {
      return NextResponse.json({ error: "Penugasan not found" }, { status: 404 });
    }

    // Check ownership
    if (penugasan.supervisor_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get peminjaman record
    const { data: peminjaman, error: peminjamanError } = await supabase
      .from('peminjaman_alat')
      .select('jumlah, is_returned')
      .eq('penugasan_id', penugasanIdNumber)
      .eq('alat_id', alat_id)
      .single();

    // Check if exists dan belum returned
    if (peminjamanError || !peminjaman) {
      return NextResponse.json({ error: "Peminjaman not found" }, { status: 404 });
    }

    if (peminjaman.is_returned) {
      return NextResponse.json({ error: "Alat already returned" }, { status: 400 });
    }

    // Return stok ke alat
    const { data: currentAlat } = await supabase
      .from('alat')
      .select('stok_tersedia')
      .eq('id', alat_id)
      .single();

    if (currentAlat) {
      const { error: updateError } = await supabase
        .from('alat')
        .update({ stok_tersedia: currentAlat.stok_tersedia + peminjaman.jumlah })
        .eq('id', alat_id);

      if (updateError) {
        console.error('Error updating stock:', updateError);
        return NextResponse.json({ error: "Failed to return stock" }, { status: 500 });
      }
    }

    // Delete peminjaman record
    const { error: deleteError } = await supabase
      .from('peminjaman_alat')
      .delete()
      .eq('penugasan_id', penugasanIdNumber)
      .eq('alat_id', alat_id);

    if (deleteError) {
      console.error('Error deleting peminjaman:', deleteError);
      return NextResponse.json({ error: "Failed to remove alat assignment" }, { status: 500 });
    }

    // Return success
    return NextResponse.json({ message: "Alat removed successfully" });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/penugasan/[id]/assign-alat:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}