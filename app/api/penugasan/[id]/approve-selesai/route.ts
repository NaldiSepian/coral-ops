import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/penugasan/[id]/approve-selesai
 * Supervisor final approve penugasan setelah semua laporan disetujui
 */
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

    // Cek role supervisor
    const { data: profil } = await supabase
      .from('profil')
      .select('peran')
      .eq('id', user.id)
      .single();

    if (!profil || profil.peran !== 'Supervisor') {
      return NextResponse.json({ error: "Only supervisors can approve completion" }, { status: 403 });
    }

    const { id } = await params;
    const penugasanId = Number(id);
    if (Number.isNaN(penugasanId)) {
      return NextResponse.json({ error: "Invalid assignment id" }, { status: 400 });
    }

    // Cek apakah supervisor adalah pemilik penugasan ini
    const { data: penugasan, error: penugasanError } = await supabase
      .from('penugasan')
      .select('supervisor_id, status, judul')
      .eq('id', penugasanId)
      .single();

    if (penugasanError || !penugasan) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (penugasan.supervisor_id !== user.id) {
      return NextResponse.json({ error: "You are not the supervisor of this assignment" }, { status: 403 });
    }

    if (penugasan.status === 'Selesai') {
      return NextResponse.json({ error: "Assignment already completed" }, { status: 400 });
    }

    // Cek apakah semua laporan sudah disetujui
    const { data: canFinish } = await supabase
      .rpc('cek_penugasan_siap_selesai', { p_penugasan_id: penugasanId });

    if (!canFinish) {
      return NextResponse.json({ 
        error: "Tidak bisa menyelesaikan penugasan. Pastikan semua laporan sudah disetujui dan tidak ada yang ditolak." 
      }, { status: 400 });
    }

    // Update status penugasan jadi Selesai
    const { error: updateError } = await supabase
      .from('penugasan')
      .update({ status: 'Selesai' })
      .eq('id', penugasanId);

    if (updateError) {
      console.error('Failed to complete assignment:', updateError);
      return NextResponse.json({ error: "Failed to complete assignment" }, { status: 500 });
    }

    // Log aktivitas
    await supabase.from('log_aktivitas').insert({
      pengguna_id: user.id,
      aksi: 'Selesaikan Penugasan',
      deskripsi: `Penugasan "${penugasan.judul}" (ID: ${penugasanId}) berhasil diselesaikan`
    });

    // Kirim notifikasi ke semua teknisi
    const { data: teknisiList } = await supabase
      .from('penugasan_teknisi')
      .select('teknisi_id')
      .eq('penugasan_id', penugasanId);

    if (teknisiList && teknisiList.length > 0) {
      const notifications = teknisiList.map(t => ({
        penerima_id: t.teknisi_id,
        pesan: `Penugasan "${penugasan.judul}" telah selesai dan disetujui oleh supervisor`
      }));

      await supabase.from('notifikasi').insert(notifications);
    }

    return NextResponse.json({
      success: true,
      message: "Penugasan berhasil diselesaikan"
    });

  } catch (err) {
    console.error('Unexpected error in POST /api/penugasan/[id]/approve-selesai:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
