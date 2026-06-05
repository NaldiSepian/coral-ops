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

    // Check if user is manager
    const { data: userProfile, error: profileError } = await supabase
      .from('profil')
      .select('peran')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.peran !== 'Manager') {
      return NextResponse.json({ error: "Access denied. Manager role required." }, { status: 403 });
    }

    const { id } = await params;

    const reportIdNum = Number(id);
    if (Number.isNaN(reportIdNum)) {
      return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
    }

    // Get the specific progress report with related data
    const { data: reportData, error: reportDataError } = await supabase
      .from("laporan_progres")
      .select(`
        *,
        penugasan_id,
        teknisi:pelapor_id(
          nama,
          peran
        ),
        penugasan:penugasan_id(
          id,
          judul,
          kategori,
          supervisor_id,
          status,
          is_deleted,
          lokasi
        ),
        validator:divalidasi_oleh(
          nama,
          peran
        ),
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
      `)
      .eq("id", reportIdNum)
      .single();

    if (reportDataError || !reportData) {
      console.error("Report not found:", reportDataError);
      return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
    }

    // Get tool photos from peminjaman_alat (foto_ambil / foto_kembali JSONB)
    const { data: toolLoans, error: toolPhotosError } = await supabase
      .from("peminjaman_alat")
      .select(`
        alat_id,
        foto_ambil,
        foto_kembali,
        alat:alat_id(
          nama,
          tipe_alat
        )
      `)
      .eq("penugasan_id", reportData.penugasan_id);

    if (toolPhotosError) {
      console.error("Error fetching tool photos:", toolPhotosError);
    }

    // Flatten JSONB arrays
    const toolPhotosData = (toolLoans || []).flatMap((loan: any) => {
      if (!loan.foto_ambil || !Array.isArray(loan.foto_ambil)) return [];
      return loan.foto_ambil.map((f: any) => ({
        alat_id: loan.alat_id,
        foto_url: f.url,
        created_at: f.created_at,
        uploaded_by: f.uploaded_by,
        alat: loan.alat
      }));
    });

    const returnToolPhotosData = (toolLoans || []).flatMap((loan: any) => {
      if (!loan.foto_kembali || !Array.isArray(loan.foto_kembali)) return [];
      return loan.foto_kembali.map((f: any) => ({
        alat_id: loan.alat_id,
        foto_url: f.url,
        created_at: f.created_at,
        uploaded_by: f.uploaded_by,
        alat: loan.alat
      }));
    });

    // Transform the data to match the expected format
    const transformedData = {
      id: reportData.id,
      penugasan_id: reportData.penugasan_id,
      pelapor_id: reportData.pelapor_id,
      tanggal_laporan: reportData.tanggal_laporan,
      status_progres: reportData.status_progres,
      persentase_progres: reportData.persentase_progres,
      foto_url: reportData.foto_url,
      catatan: reportData.catatan,
      status_validasi: reportData.status_validasi,
      divalidasi_oleh: reportData.divalidasi_oleh,
      divalidasi_pada: reportData.divalidasi_pada,
      catatan_validasi: reportData.catatan_validasi,
      titik_gps: reportData.titik_gps,
      created_at: reportData.created_at,
      updated_at: reportData.updated_at,
      pelapor: reportData.teknisi,
      penugasan: reportData.penugasan,
      validator: reportData.validator,
      bukti_laporan: reportData.bukti_laporan || [],
      tool_photos: toolPhotosData,
      return_tool_photos: returnToolPhotosData
    };

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    console.error('Unexpected error in GET /api/manager/laporan/[id]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}