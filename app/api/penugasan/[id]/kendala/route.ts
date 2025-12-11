import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ['Cuaca', 'Akses', 'Teknis', 'Lain'] as const;

type KendalaType = typeof ALLOWED_TYPES[number];

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

    const { id } = await params;
    const penugasanId = Number(id);
    if (Number.isNaN(penugasanId)) {
      return NextResponse.json({ error: "Invalid assignment id" }, { status: 400 });
    }

    const body = await request.json();
    const {
      alasan,
      durasi_menit,
      tipe_kendala,
      foto_url
    } = body;

    if (!alasan || !durasi_menit || durasi_menit <= 0) {
      return NextResponse.json({ error: "Alasan dan durasi harus diisi" }, { status: 400 });
    }

    // Validasi maksimal 7 hari (10080 menit)
    const maxMinutes = 7 * 24 * 60;
    if (durasi_menit > maxMinutes) {
      return NextResponse.json({ error: "Durasi perpanjangan maksimal 7 hari" }, { status: 400 });
    }

    const kendalaType: KendalaType = ALLOWED_TYPES.includes(tipe_kendala)
      ? tipe_kendala
      : 'Lain';

    const { data: assignmentLink, error: assignmentError } = await supabase
      .from('penugasan_teknisi')
      .select('penugasan_id')
      .eq('penugasan_id', penugasanId)
      .eq('teknisi_id', user.id)
      .single();

    if (assignmentError || !assignmentLink) {
      return NextResponse.json({ error: "Assignment not found or not assigned" }, { status: 404 });
    }

    const { data: penugasan, error: penugasanError } = await supabase
      .from('penugasan')
      .select('id, end_date, supervisor_id')
      .eq('id', penugasanId)
      .single();

    if (penugasanError || !penugasan) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const { data: kendala, error: insertError } = await supabase
      .from('perpanjangan_penugasan')
      .insert({
        penugasan_id: penugasanId,
        pemohon_id: user.id,
        alasan,
        foto_url,
        durasi_menit,
        durasi_diminta: `${durasi_menit} minutes`,
        tipe_kendala: kendalaType,
        deadline_before: penugasan.end_date,
        status: 'Menunggu'
      })
      .select('*')
      .single();

    if (insertError || !kendala) {
      console.error('Failed to create kendala request:', insertError);
      return NextResponse.json({ error: "Failed to submit kendala" }, { status: 500 });
    }

    await supabase.from('notifikasi').insert({
      penerima_id: penugasan.supervisor_id,
      pesan: `Kendala baru diajukan untuk penugasan #${penugasanId}`,
      status: 'Belum Dibaca'
    });

    await supabase.from('log_aktivitas').insert({
      pengguna_id: user.id,
      aksi: 'Ajukan Kendala',
      deskripsi: `Durasi ${Math.round(durasi_menit / (24 * 60))} hari untuk penugasan ${penugasanId}`
    });

    return NextResponse.json({ message: "Kendala dikirim", kendala });
  } catch (err) {
    console.error('Unexpected error in POST /api/penugasan/[id]/kendala:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
