import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/manager/penugasan-final-validasi
 * List penugasan yang menunggu final validasi dari manager
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cek role manager
    const { data: profil } = await supabase
      .from('profil')
      .select('peran')
      .eq('id', user.id)
      .single();

    if (!profil || profil.peran !== 'Manager') {
      return NextResponse.json({ error: "Only managers can access this" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Query penugasan yang menunggu validasi manager
    let query = supabase
      .from('penugasan')
      .select(`
        id,
        judul,
        kategori,
        supervisor_id,
        status,
        start_date,
        end_date,
        is_extended,
        created_at,
        divalidasi_manager_oleh,
        divalidasi_manager_pada,
        catatan_manager_validasi,
        supervisor:profil!penugasan_supervisor_id_fkey(
          id,
          nama,
          peran
        ),
        teknisi:penugasan_teknisi(
          id,
          teknisi_id,
          profil:profil!penugasan_teknisi_teknisi_id_fkey(
            id,
            nama,
            peran
          )
        ),
        laporan:laporan_progres(
          id,
          tanggal_laporan,
          status_progres,
          status_validasi,
          catatan,
          foto_url
        ),
        alat:peminjaman_alat(
          id,
          alat_id,
          jumlah,
          is_returned,
          alat:alat(
            id,
            nama
          )
        )
      `)
      .eq('status', 'Menunggu Validasi')
      .eq('is_deleted', false)
      .eq('divalidasi_manager_oleh', null)
      .order('created_at', { ascending: false });

    // Filter by search
    if (search) {
      query = query.or(`judul.ilike.%${search}%,supervisor.nama.ilike.%${search}%`);
    }

    const { data: penugasan, error } = await query;

    if (error) {
      console.error('Failed to fetch penugasan for manager validation:', error);
      return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }

    // Hitung statistik
    const totalPending = penugasan?.length || 0;

    return NextResponse.json({
      data: penugasan || [],
      stats: {
        total_pending: totalPending
      }
    });

  } catch (err) {
    console.error('Unexpected error in GET /api/manager/penugasan-final-validasi:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
