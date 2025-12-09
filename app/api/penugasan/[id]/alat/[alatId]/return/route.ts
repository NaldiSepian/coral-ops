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
    const { foto_url } = body;

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

    const { error: updatePeminjamanError } = await supabase
      .from('peminjaman_alat')
      .update({
        is_returned: true,
        returned_at: new Date().toISOString(),
        foto_kembali_url: foto_url
      })
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

    if (alatRow) {
      const { error: restockError } = await supabase
        .from('alat')
        .update({ stok_tersedia: alatRow.stok_tersedia + peminjaman.jumlah })
        .eq('id', alatIdNumber);

      if (restockError) {
        console.error('Failed to restock alat:', restockError);
      }
    }

    await supabase.from('log_aktivitas').insert({
      pengguna_id: user.id,
      aksi: 'Pengembalian Alat',
      deskripsi: `Alat ${alatIdNumber} dikembalikan untuk penugasan ${penugasanId}`
    });

    return NextResponse.json({ message: "Alat dikembalikan" });
  } catch (err) {
    console.error('Unexpected error in POST /api/penugasan/[id]/alat/[alatId]/return:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
