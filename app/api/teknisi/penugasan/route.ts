import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const { data: penugasanList, error } = await supabase
      .from('penugasan')
      .select(`
        *,
        lokasi_text:lokasi::varchar,
        supervisor:supervisor_id!inner(nama, peran),
        assigned_member:penugasan_teknisi!inner (
          teknisi_id
        ),
        teknisi:penugasan_teknisi (
          id,
          teknisi_id,
          profil!penugasan_teknisi_teknisi_id_fkey(nama, peran)
        ),
        alat:peminjaman_alat(
          id,
          alat_id,
          jumlah,
          is_returned,
          foto_kembali_url,
          alat!peminjaman_alat_alat_id_fkey(nama)
        ),
        laporan_progres(
          id,
          tanggal_laporan,
          persentase_progres,
          status_progres,
          pelapor_id,
          status_validasi,
          divalidasi_oleh,
          divalidasi_pada,
          catatan_validasi,
          bukti:bukti_laporan(*)
        )
      `)
      .eq('assigned_member.teknisi_id', user.id)
      .eq('is_deleted', false)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching teknisi penugasan:', error);
      return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
    }

    const filtered = (penugasanList || []).map(item => ({
      ...item,
      laporan_progres: (item.laporan_progres || []).sort(
        (a: any, b: any) => b.id - a.id  // Sort by ID descending (newest first)
      )
    })).filter(item => {
      if (!statusFilter) return item.status === 'Aktif' || item.status === 'Selesai';
      return item.status === statusFilter;
    });

    // Debug: log the first assignment's latest report
    if (filtered.length > 0 && filtered[0].laporan_progres?.length > 0) {
      console.log('[API DEBUG] First assignment latest report:', {
        assignmentId: filtered[0].id,
        latestReport: filtered[0].laporan_progres[0]
      });
    }

    return NextResponse.json({ data: filtered });
  } catch (err) {
    console.error('Unexpected error in GET /api/teknisi/penugasan:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
