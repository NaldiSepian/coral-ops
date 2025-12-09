import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/supervisor/laporan-validasi
 * List semua laporan yang perlu divalidasi oleh supervisor yang login
 */
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: "Only supervisors can access this" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'Menunggu';
    const penugasanId = searchParams.get('penugasan_id');

    // Query laporan yang perlu validasi
    let query = supabase
      .from('laporan_progres')
      .select(`
        id,
        penugasan_id,
        pelapor_id,
        tanggal_laporan,
        persentase_progres,
        status_progres,
        foto_url,
        catatan,
        status_validasi,
        divalidasi_oleh,
        divalidasi_pada,
        catatan_validasi,
        created_at,
        penugasan:penugasan!inner(
          id,
          judul,
          kategori,
          supervisor_id,
          status,
          is_deleted
        ),
        pelapor:profil!laporan_progres_pelapor_id_fkey(
          id,
          nama,
          peran
        ),
        validator:profil!laporan_progres_divalidasi_oleh_fkey(
          id,
          nama,
          peran
        )
      `)
      .eq('penugasan.supervisor_id', user.id)
      .eq('penugasan.is_deleted', false)
      .order('created_at', { ascending: false });

    // Filter by status validasi
    if (status && ['Menunggu', 'Disetujui', 'Ditolak'].includes(status)) {
      query = query.eq('status_validasi', status);
    }

    // Filter by penugasan_id
    if (penugasanId) {
      const id = Number(penugasanId);
      if (!Number.isNaN(id)) {
        query = query.eq('penugasan_id', id);
      }
    }

    const { data: laporan, error } = await query;

    if (error) {
      console.error('Failed to fetch reports for validation:', error);
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }

    // Hitung statistik - laporan yang menunggu validasi dari penugasan milik supervisor
    let countQuery = supabase
      .from('laporan_progres')
      .select('*', { count: 'exact', head: true })
      .eq('status_validasi', 'Menunggu');

    // Apply same penugasan filter
    const { data: penugasanIds } = await supabase
      .from('penugasan')
      .select('id')
      .eq('supervisor_id', user.id)
      .eq('is_deleted', false);

    if (penugasanIds && penugasanIds.length > 0) {
      const ids = penugasanIds.map(p => p.id);
      countQuery = countQuery.in('penugasan_id', ids);
    }

    const { count: pending } = await countQuery;

    return NextResponse.json({
      data: laporan || [],
      stats: {
        pending: pending || 0
      }
    });

  } catch (err) {
    console.error('Unexpected error in GET /api/supervisor/laporan-validasi:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
