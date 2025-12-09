import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/laporan/[id]/validasi
 * Supervisor validasi laporan progres (approve/reject)
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
      return NextResponse.json({ error: "Only supervisors can validate reports" }, { status: 403 });
    }

    const { id } = await params;
    const laporanId = Number(id);
    if (Number.isNaN(laporanId)) {
      return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
    }

    const body = await request.json();
    const { status_validasi, catatan_validasi } = body;

    if (!status_validasi || !['Disetujui', 'Ditolak'].includes(status_validasi)) {
      return NextResponse.json({ error: "Status validasi harus Disetujui atau Ditolak" }, { status: 400 });
    }

    // Panggil function validasi_laporan
    const { data, error } = await supabase
      .rpc('validasi_laporan', {
        p_laporan_id: laporanId,
        p_supervisor_id: user.id,
        p_status_validasi: status_validasi,
        p_catatan_validasi: catatan_validasi || null
      });

    if (error) {
      console.error('Failed to validate report:', error);
      return NextResponse.json({ error: error.message || "Failed to validate report" }, { status: 500 });
    }

    if (data && data.length > 0 && !data[0].success) {
      return NextResponse.json({ error: data[0].message }, { status: 400 });
    }

    // Jika approve dan ini laporan final (status_progres = Selesai), cek apakah penugasan bisa diselesaikan
    if (status_validasi === 'Disetujui') {
      const { data: laporan } = await supabase
        .from('laporan_progres')
        .select('penugasan_id, status_progres')
        .eq('id', laporanId)
        .single();

      if (laporan && laporan.status_progres === 'Selesai') {
        // Cek apakah semua laporan sudah disetujui
        const { data: canFinish } = await supabase
          .rpc('cek_penugasan_siap_selesai', { p_penugasan_id: laporan.penugasan_id });

        if (canFinish) {
          // Update status penugasan jadi "Menunggu Validasi" untuk final approval
          await supabase
            .from('penugasan')
            .update({ status: 'Menunggu Validasi' })
            .eq('id', laporan.penugasan_id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: data && data[0]?.message || "Report validated successfully"
    });

  } catch (err) {
    console.error('Unexpected error in POST /api/laporan/[id]/validasi:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/laporan/[id]/validasi
 * Get validation status of a report
 */
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

    const { id } = await params;
    const laporanId = Number(id);
    if (Number.isNaN(laporanId)) {
      return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
    }

    const { data: laporan, error } = await supabase
      .from('laporan_progres')
      .select(`
        id,
        status_validasi,
        divalidasi_oleh,
        divalidasi_pada,
        catatan_validasi,
        validator:profil!laporan_progres_divalidasi_oleh_fkey(nama, peran)
      `)
      .eq('id', laporanId)
      .single();

    if (error || !laporan) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ data: laporan });

  } catch (err) {
    console.error('Unexpected error in GET /api/laporan/[id]/validasi:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
