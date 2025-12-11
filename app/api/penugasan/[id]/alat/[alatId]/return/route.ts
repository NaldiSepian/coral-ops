import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; alatId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, alatId } = await params;
    const penugasanId = Number(id);
    const alatIdNumber = Number(alatId);

    if (Number.isNaN(penugasanId) || Number.isNaN(alatIdNumber)) {
      return NextResponse.json({ error: "Invalid identifiers" }, { status: 400 });
    }

    const body = await request.json();
    const { foto_url, jumlah_dikembalikan } = body;

    if (!foto_url) {
      return NextResponse.json({ error: "Foto pengembalian wajib diunggah" }, { status: 400 });
    }

    const { data: assignmentLink, error: assignmentError } = await supabase
      .from('penugasan_teknisi')
      .select('penugasan_id')
      .eq('penugasan_id', penugasanId)
      .eq('teknisi_id', user.id)
      .single();

    if (assignmentError || !assignmentLink) {
      return NextResponse.json({ error: "Assignment not found or not assigned" }, { status: 404 });
    }

    const { data: peminjaman, error: peminjamanError } = await supabase
      .from('peminjaman_alat')
      .select('id, jumlah, is_returned')
      .eq('penugasan_id', penugasanId)
      .eq('alat_id', alatIdNumber)
      .single();

    if (peminjamanError || !peminjaman) {
      return NextResponse.json({ error: "Peminjaman alat tidak ditemukan" }, { status: 404 });
    }

    if (peminjaman.is_returned) {
      return NextResponse.json({ error: "Alat sudah dikembalikan" }, { status: 400 });
    }

    // Default to full return if jumlah_dikembalikan not provided
    const returnQuantity = jumlah_dikembalikan !== undefined ? Number(jumlah_dikembalikan) : peminjaman.jumlah;

    if (returnQuantity <= 0 || returnQuantity > peminjaman.jumlah) {
      return NextResponse.json({ error: `Jumlah pengembalian harus antara 1 sampai ${peminjaman.jumlah}` }, { status: 400 });
    }

    // Update peminjaman based on return quantity
    const isFullReturn = returnQuantity === peminjaman.jumlah;
    const updateData: any = {
      returned_at: new Date().toISOString(),
      foto_kembali_url: foto_url
    };

    if (isFullReturn) {
      updateData.is_returned = true;
    } else {
      // For partial return, reduce the quantity
      updateData.jumlah = peminjaman.jumlah - returnQuantity;
    }

    const { error: updatePeminjamanError } = await supabase
      .from('peminjaman_alat')
      .update(updateData)
      .eq('id', peminjaman.id);

    if (updatePeminjamanError) {
      console.error('Failed to update peminjaman:', updatePeminjamanError);
      return NextResponse.json({ error: "Gagal menandai pengembalian" }, { status: 500 });
    }

    const { data: alatRow } = await supabase
      .from('alat')
      .select('stok_tersedia')
      .eq('id', alatIdNumber)
      .single();

    // Restock the returned quantity
    if (alatRow) {
      const { error: restockError } = await supabase
        .from('alat')
        .update({ stok_tersedia: alatRow.stok_tersedia + returnQuantity })
        .eq('id', alatIdNumber);

      if (restockError) {
        console.error('Failed to restock alat:', restockError);
      }
    }

    await supabase.from('log_aktivitas').insert({
      pengguna_id: user.id,
      aksi: 'Pengembalian Alat',
      deskripsi: `Alat ${alatIdNumber} dikembalikan ${returnQuantity} unit untuk penugasan ${penugasanId}${isFullReturn ? ' (selesai)' : ' (parsial)'}`
    });

    return NextResponse.json({ message: "Alat dikembalikan" });
  } catch (err) {
    console.error('Unexpected error in POST /api/penugasan/[id]/alat/[alatId]/return:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
