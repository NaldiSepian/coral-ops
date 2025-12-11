import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Check if user is supervisor
    const { data: profil } = await supabase
      .from('profil')
      .select('peran')
      .eq('id', user.id)
      .single();

    if (!profil || profil.peran !== 'Supervisor') {
      return NextResponse.json({ error: "Only supervisors can access this" }, { status: 403 });
    }

    const { id } = await params;

    const reportIdNum = Number(id);
    if (Number.isNaN(reportIdNum)) {
      return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
    }

    // Get the specific progress report with related data for supervisor validation
    const { data: report, error: reportError } = await supabase
      .from("laporan_progres")
      .select(`
        *,
        penugasan:penugasan!inner(
          id,
          judul,
          kategori,
          supervisor_id,
          status,
          is_deleted,
          lokasi
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
        ),
        bukti_laporan(*)
      `)
      .eq("id", reportIdNum)
      .eq("penugasan.supervisor_id", user.id)
      .eq("penugasan.is_deleted", false)
      .single();

    if (reportError || !report) {
      console.error("Report not found:", reportError);
      return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
    }

    // Get assignment tools information
    const { data: assignment, error: assignmentError } = await supabase
      .from("penugasan")
      .select(`
        id,
        judul,
        kategori,
        supervisor_id,
        status,
        is_deleted,
        lokasi,
        alat:peminjaman_alat(
          id,
          alat_id,
          jumlah,
          is_returned,
          alat:alat(*)
        )
      `)
      .eq("id", report.penugasan_id)
      .eq("supervisor_id", user.id)
      .single();

    if (assignmentError) {
      console.error("Error fetching assignment:", assignmentError);
      return NextResponse.json(
        { error: "Penugasan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Process bukti_laporan to match expected format
    const processedBuktiLaporan = [];
    if (report.bukti_laporan && Array.isArray(report.bukti_laporan)) {
      // Group by pair_key
      const groupedByPair: { [key: string]: any } = {};

      report.bukti_laporan.forEach((item: any) => {
        const pairKey = item.pair_key || `pair_${item.id}`;
        if (!groupedByPair[pairKey]) {
          groupedByPair[pairKey] = {
            id: item.id,
            pair_key: pairKey,
            judul: item.judul,
            deskripsi: item.deskripsi,
            before_foto_url: item.before_foto_url || item.foto_url,
            after_foto_url: item.after_foto_url || item.foto_url,
            taken_at: item.taken_at,
            taken_by: item.taken_by,
            metadata: item.metadata
          };
        }
      });

      processedBuktiLaporan.push(...Object.values(groupedByPair));
    }

    // Get tool photos from peminjaman_alat (foto_ambil_url and foto_kembali_url)
    const { data: toolPhotos, error: toolPhotosError } = await supabase
      .from("peminjaman_alat")
      .select(`
        id,
        alat_id,
        foto_ambil_url,
        foto_kembali_url,
        alat:alat(*)
      `)
      .eq("penugasan_id", report.penugasan_id)
      .not("foto_ambil_url", "is", null);

    if (toolPhotosError) {
      console.error("Error fetching tool photos:", toolPhotosError);
    }

    // Process tool photos
    const toolPhotosData = (toolPhotos || []).map((tp: any) => ({
      id: tp.id,
      alat_id: tp.alat_id,
      foto_url: tp.foto_ambil_url,
      alat: tp.alat
    }));

    // Process return tool photos
    const returnToolPhotosData = (toolPhotos || [])
      .filter((tp: any) => tp.foto_kembali_url && tp.foto_kembali_url.trim() !== '')
      .map((tp: any) => ({
        id: tp.id,
        alat_id: tp.alat_id,
        foto_url: tp.foto_kembali_url,
        alat: tp.alat
      }));

    // Prepare the response data
    const responseData = {
      ...report,
      bukti_laporan: processedBuktiLaporan,
      tool_photos: toolPhotosData,
      return_tool_photos: returnToolPhotosData
    };

    return NextResponse.json({
      data: responseData
    });

  } catch (error) {
    console.error("Error in supervisor report detail API:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }
}