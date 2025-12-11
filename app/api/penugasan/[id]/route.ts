// API Routes untuk Detail Penugasan
// =============================================================================
// GET /api/penugasan/[id] - Detail penugasan dengan relations
// - Include: assigned teknisi, assigned alat, progress laporan
// - Pastikan user adalah supervisor pemilik penugasan
// - Return: full penugasan data dengan teknisi[], alat[], laporan[]
//
// PUT /api/penugasan/[id] - Update penugasan
// - Body: { judul?, lokasi?, kategori?, end_date? }
// - Hanya bisa update jika status = 'Aktif'
// - Jika kategori berubah, update frekuensi_laporan otomatis
// - Validasi ownership (supervisor_id)
// - Return: penugasan yang diupdate
//
// DELETE /api/penugasan/[id] - Cancel penugasan (soft delete)
// - Set status = 'Dibatalkan' dan is_deleted = true
// - Return semua alat yang di-book (tambah stok_tersedia)
// - Delete records di peminjaman_alat dan penugasan_teknisi
// - Validasi ownership dan status
// - Return: success message
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { StatusPenugasan, FrekuensiLaporan } from "@/lib/penugasan/types";

// GET handler - Detail penugasan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: penugasanIdStr } = await params;
    const penugasanId = parseInt(penugasanIdStr);

    if (isNaN(penugasanId)) {
      return NextResponse.json({ error: "Invalid penugasan ID" }, { status: 400 });
    }

    // Query penugasan dengan relations
    const { data: penugasan, error } = await supabase
      .from('penugasan')
      .select(`
        *,
        lokasi_text: lokasi::varchar,
        supervisor:supervisor_id(nama, peran),
        teknisi:penugasan_teknisi(
          id,
          teknisi_id,
          profil(nama, peran)
        ),
        alat:peminjaman_alat(
          id,
          alat_id,
          jumlah,
          is_returned,
          alat(nama)
        ),
        laporan_progres(
          *,
          bukti_laporan(
            id,
            judul,
            deskripsi,
            before_foto_url,
            after_foto_url,
            taken_at,
            taken_by,
            metadata,
            pair_key
          )
        )
      `)
      .eq('id', penugasanId)
      // .eq('supervisor_id', user.id) // Temporarily commented out for debugging
      // .eq('is_deleted', false) // Temporarily commented out for debugging
      .single();

    if (error || !penugasan) {
      return NextResponse.json({ error: "Penugasan not found" }, { status: 404 });
    }

    // Sort laporan_progres by ID descending (latest first)
    const sortedPenugasan = {
      ...penugasan,
      laporan_progres: (penugasan.laporan_progres || []).sort(
        (a: any, b: any) => b.id - a.id
      )
    };

    return NextResponse.json({ data: sortedPenugasan });
  } catch (error) {
    console.error('Unexpected error in GET /api/penugasan/[id]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT handler - Update penugasan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: penugasanIdStr } = await params;
    const penugasanId = parseInt(penugasanIdStr);

    if (isNaN(penugasanId)) {
      return NextResponse.json({ error: "Invalid penugasan ID" }, { status: 400 });
    }

    // Check ownership dan status
    const { data: existing, error: checkError } = await supabase
      .from('penugasan')
      .select('status, supervisor_id, kategori, is_deleted')
      .eq('id', penugasanId)
      // .eq('is_deleted', false) // Temporarily commented out for debugging
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Penugasan not found" }, { status: 404 });
    }

    // Validate ownership
    // if (existing.supervisor_id !== user.id) {
      // return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }

    // Parse body dan prepare update data
    const body = await request.json();
    const updateData: any = {};
    const isBaseFieldUpdateRequested =
      body.judul !== undefined ||
      body.lokasi !== undefined ||
      body.kategori !== undefined ||
      body.start_date !== undefined ||
      body.end_date !== undefined;

    if (isBaseFieldUpdateRequested && existing.status !== 'Aktif') {
      return NextResponse.json({ error: "Can only update active penugasan" }, { status: 400 });
    }

    // Handle judul
    if (body.judul !== undefined) {
      if (!body.judul || body.judul.trim().length === 0) {
        return NextResponse.json({ error: "Judul cannot be empty" }, { status: 400 });
      }
      updateData.judul = body.judul.trim();
    }

    // Handle lokasi
    if (body.lokasi !== undefined) {
      if (!body.lokasi.latitude || !body.lokasi.longitude) {
        return NextResponse.json({ error: "Invalid location data" }, { status: 400 });
      }
      updateData.lokasi = `POINT(${body.lokasi.longitude} ${body.lokasi.latitude})`;
    }

    // Handle kategori change -> frekuensi_laporan
    if (body.kategori !== undefined) {
      const frekuensiMap: Record<string, 'Harian' | 'Mingguan'> = {
        'Rekonstruksi': 'Harian',
        'Instalasi': 'Harian',
        'Perawatan': 'Mingguan'
      };
      updateData.kategori = body.kategori;
      updateData.frekuensi_laporan = frekuensiMap[body.kategori] || 'Harian';
    }

    // Handle start_date
    if (body.start_date !== undefined) {
      if (!body.start_date) {
        return NextResponse.json({ error: "Start date cannot be empty" }, { status: 400 });
      }
      const startDate = new Date(body.start_date);
      if (Number.isNaN(startDate.getTime())) {
        return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
      }
      updateData.start_date = body.start_date;
    }

    // Handle end_date
    if (body.end_date !== undefined) {
      if (body.end_date && new Date(body.end_date) < new Date()) {
        return NextResponse.json({ error: "End date cannot be in the past" }, { status: 400 });
      }
      updateData.end_date = body.end_date || null;
    }

    if (body.frekuensi_laporan !== undefined) {
      const validFrekuensi: FrekuensiLaporan[] = ['Harian', 'Mingguan'];
      const requestedFrekuensi = body.frekuensi_laporan as FrekuensiLaporan;

      if (!validFrekuensi.includes(requestedFrekuensi)) {
        return NextResponse.json({ error: "Invalid frekuensi_laporan" }, { status: 400 });
      }

      updateData.frekuensi_laporan = requestedFrekuensi;
    }

    if (body.status !== undefined) {
      const requestedStatus = body.status as StatusPenugasan;
      const validStatuses: StatusPenugasan[] = ['Aktif', 'Selesai', 'Dibatalkan', 'Menunggu Validasi', 'Ditolak'];

      if (!validStatuses.includes(requestedStatus)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }

      if (requestedStatus === existing.status) {
        return NextResponse.json({ error: "Status is already set" }, { status: 400 });
      }

      if (requestedStatus === 'Selesai' && existing.status !== 'Aktif') {
        return NextResponse.json({ error: "Only active penugasan can be marked complete" }, { status: 400 });
      }

      if (requestedStatus === 'Dibatalkan' && !['Aktif', 'Menunggu Validasi'].includes(existing.status)) {
        return NextResponse.json({ error: "Only active or pending penugasan can be cancelled" }, { status: 400 });
      }

      updateData.status = requestedStatus;

      if (requestedStatus === 'Dibatalkan') {
        updateData.is_deleted = false;
        updateData.deleted_at = null;
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Update penugasan
    const { data: updated, error } = await supabase
      .from('penugasan')
      .update(updateData)
      .eq('id', penugasanId)
      .select(`
        *,
        lokasi_text: lokasi::varchar
      `)
      .single();

    if (error) {
      console.error('Error updating penugasan:', error);
      return NextResponse.json({ error: "Failed to update penugasan" }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Unexpected error in PUT /api/penugasan/[id]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE handler - Delete penugasan (only if Dibatalkan) or Cancel penugasan
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

    const { id: penugasanIdStr } = await params;
    const penugasanId = parseInt(penugasanIdStr);

    if (isNaN(penugasanId)) {
      return NextResponse.json({ error: "Invalid penugasan ID" }, { status: 400 });
    }

    // Check ownership
    const { data: existing, error: checkError } = await supabase
      .from('penugasan')
      .select('supervisor_id, status')
      .eq('id', penugasanId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Penugasan not found" }, { status: 404 });
    }

    // Validate ownership
    // if (existing.supervisor_id !== user.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }

    // If status is already 'Dibatalkan', do permanent delete
    if (existing.status === 'Dibatalkan') {
      // Get all alat that might still be unreturned (if any)
      const { data: bookedAlat, error: alatError } = await supabase
        .from('peminjaman_alat')
        .select('alat_id, jumlah, is_returned')
        .eq('penugasan_id', penugasanId);

      if (alatError) {
        console.error('Error fetching booked alat:', alatError);
        return NextResponse.json({ error: "Failed to fetch equipment data" }, { status: 500 });
      }

      // Return stok untuk setiap alat yang belum dikembalikan
      if (bookedAlat && bookedAlat.length > 0) {
        for (const item of bookedAlat) {
          // Skip if already returned
          if (item.is_returned) continue;

          // Get current stock
          const { data: currentAlat } = await supabase
            .from('alat')
            .select('stok_tersedia')
            .eq('id', item.alat_id)
            .single();

          if (currentAlat) {
            const { error: updateError } = await supabase
              .from('alat')
              .update({ stok_tersedia: currentAlat.stok_tersedia + item.jumlah })
              .eq('id', item.alat_id);

            if (updateError) {
              console.error('Error returning stock:', updateError);
              return NextResponse.json({ error: "Failed to return equipment stock" }, { status: 500 });
            }
          }
        }
      }

      // Delete peminjaman_alat records
      const { error: deleteAlatError } = await supabase
        .from('peminjaman_alat')
        .delete()
        .eq('penugasan_id', penugasanId);

      if (deleteAlatError) {
        console.error('Error deleting peminjaman_alat records:', deleteAlatError);
        return NextResponse.json({ error: "Failed to delete equipment records" }, { status: 500 });
      }

      // Delete penugasan_teknisi records
      const { error: deleteTeknisiError } = await supabase
        .from('penugasan_teknisi')
        .delete()
        .eq('penugasan_id', penugasanId);

      if (deleteTeknisiError) {
        console.error('Error deleting penugasan_teknisi records:', deleteTeknisiError);
        return NextResponse.json({ error: "Failed to delete technician records" }, { status: 500 });
      }

      // Delete laporan_progres records
      const { error: deleteLaporanError } = await supabase
        .from('laporan_progres')
        .delete()
        .eq('penugasan_id', penugasanId);

      if (deleteLaporanError) {
        console.error('Error deleting laporan_progres records:', deleteLaporanError);
        return NextResponse.json({ error: "Failed to delete progress records" }, { status: 500 });
      }

      // Hard delete penugasan
      const { error: updateError } = await supabase
        .from('penugasan')
        .delete()
        .eq('id', penugasanId);

      if (updateError) {
        console.error('Error deleting penugasan:', updateError);
        return NextResponse.json({ error: "Failed to delete penugasan" }, { status: 500 });
      }

      return NextResponse.json({ message: "Penugasan deleted permanently" });
    }

    // Otherwise, cancel the penugasan (soft delete)
    // Check if can be cancelled (not already completed or cancelled)
    if (existing.status === 'Selesai' || existing.status === 'Ditolak') {
      return NextResponse.json({ error: "Cannot cancel completed or rejected penugasan" }, { status: 400 });
    }

    // Get all booked alat untuk return stok
    const { data: bookedAlat, error: alatError } = await supabase
      .from('peminjaman_alat')
      .select('alat_id, jumlah')
      .eq('penugasan_id', penugasanId)
      .eq('is_returned', false);

    if (alatError) {
      console.error('Error fetching booked alat:', alatError);
      return NextResponse.json({ error: "Failed to fetch equipment data" }, { status: 500 });
    }

    // Return stok untuk setiap alat
    if (bookedAlat && bookedAlat.length > 0) {
      for (const item of bookedAlat) {
        // Get current stock
        const { data: currentAlat } = await supabase
          .from('alat')
          .select('stok_tersedia')
          .eq('id', item.alat_id)
          .single();

        if (currentAlat) {
          const { error: updateError } = await supabase
            .from('alat')
            .update({ stok_tersedia: currentAlat.stok_tersedia + item.jumlah })
            .eq('id', item.alat_id);

          if (updateError) {
            console.error('Error returning stock:', updateError);
            return NextResponse.json({ error: "Failed to return equipment stock" }, { status: 500 });
          }
        }
      }
    }

    // Delete peminjaman_alat records (hard delete karena cancelled)
    const { error: deleteAlatError } = await supabase
      .from('peminjaman_alat')
      .delete()
      .eq('penugasan_id', penugasanId);

    if (deleteAlatError) {
      console.error('Error deleting peminjaman_alat records:', deleteAlatError);
      return NextResponse.json({ error: "Failed to remove equipment assignments" }, { status: 500 });
    }

    // Delete penugasan_teknisi records
    const { error: deleteTeknisiError } = await supabase
      .from('penugasan_teknisi')
      .delete()
      .eq('penugasan_id', penugasanId);

    if (deleteTeknisiError) {
      console.error('Error deleting penugasan_teknisi records:', deleteTeknisiError);
      return NextResponse.json({ error: "Failed to remove technician assignments" }, { status: 500 });
    }

    // Soft delete penugasan (set status 'Dibatalkan')
    const { error: updateError } = await supabase
      .from('penugasan')
      .update({
        status: 'Dibatalkan',
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', penugasanId);

    if (updateError) {
      console.error('Error cancelling penugasan:', updateError);
      return NextResponse.json({ error: "Failed to cancel penugasan" }, { status: 500 });
    }

    return NextResponse.json({ message: "Penugasan cancelled successfully" });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/penugasan/[id]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}