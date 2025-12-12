import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Parse WKT POINT to coordinates
function parseWKTPoint(wkt: string): [number, number] | null {
  if (!wkt || typeof wkt !== 'string') return null;
  
  const match = wkt.match(/POINT\(([^ ]+) ([^)]+)\)/);
  if (!match) return null;
  
  const longitude = parseFloat(match[1]);
  const latitude = parseFloat(match[2]);
  
  if (isNaN(longitude) || isNaN(latitude)) return null;
  
  return [latitude, longitude];
}

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

    const { id: reportId } = await params;

    const reportIdNum = Number(reportId);
    if (Number.isNaN(reportIdNum)) {
      return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
    }

    // First get the report to find the assignment ID
    const { data: reportData, error: reportError } = await supabase
      .from("laporan_progres")
      .select("*, penugasan_id")
      .eq("id", reportIdNum)
      .single();

    if (reportError || !reportData) {
      console.error("Report not found:", reportError);
      return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
    }

    const penugasanId = reportData.penugasan_id;

    // Check if user is assigned to this penugasan
    const { data: assignmentLink, error: assignmentLinkError } = await supabase
      .from('penugasan_teknisi')
      .select('penugasan_id')
      .eq('penugasan_id', penugasanId)
      .eq('teknisi_id', user.id)
      .single();

    if (assignmentLinkError || !assignmentLink) {
      console.error("User not assigned to this penugasan:", { penugasanId, userId: user.id });
      return NextResponse.json({ error: "Assignment not found or not assigned" }, { status: 404 });
    }

    // Get the specific progress report with related data
    console.log("Fetching report with:", { reportIdNum, penugasanId });

    const { data: report, error: reportFetchError } = await supabase
      .from("laporan_progres")
      .select(`
        *,
        titik_gps,
        bukti_laporan(*)
      `)
      .eq("id", reportIdNum)
      .eq("penugasan_id", penugasanId)
      .single();

    if (reportFetchError) {
      console.error("Error fetching report:", reportFetchError);
      console.error("Report error details:", { reportIdNum, penugasanId, error: reportFetchError });
      return NextResponse.json(
        { error: "Laporan tidak ditemukan" },
        { status: 404 }
      );
    }

    console.log("Report found:", report?.id);

    // Get assignment basic info
    const { data: assignment, error: assignmentError } = await supabase
      .from("penugasan")
      .select(`
        id,
        judul,
        lokasi,
        lokasi_text: lokasi::varchar,
        alat:peminjaman_alat(
          id,
          alat_id,
          jumlah,
          is_returned,
          alat:alat(*)
        )
      `)
      .eq("id", penugasanId)
      .single();

    if (assignmentError) {
      console.error("Error fetching assignment:", assignmentError);
      return NextResponse.json(
        { error: "Penugasan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Process bukti_laporan pairs (now 1 row per pair with before_foto_url and after_foto_url)
    const pairs = report.bukti_laporan?.map((item: any) => ({
      id: item.id,
      pair_key: item.pair_key,
      judul: item.judul,
      deskripsi: item.deskripsi,
      before_foto_url: item.before_foto_url,
      after_foto_url: item.after_foto_url
    })) || [];

    // Get tool photos from peminjaman_alat (foto_ambil_url)
    const { data: toolPhotos, error: toolPhotosError } = await supabase
      .from("peminjaman_alat")
      .select(`
        alat_id,
        foto_ambil_url,
        alat!alat_id(*)
      `)
      .eq("penugasan_id", penugasanId)
      .not("foto_ambil_url", "is", null);

    if (toolPhotosError) {
      console.error("Error fetching tool photos:", toolPhotosError);
    }

    // Get return tool photos from peminjaman_alat (foto_kembali_url)
    const { data: returnToolPhotos, error: returnToolPhotosError } = await supabase
      .from("peminjaman_alat")
      .select(`
        alat_id,
        foto_kembali_url,
        alat!alat_id(*)
      `)
      .eq("penugasan_id", penugasanId)
      .not("foto_kembali_url", "is", null);

    if (returnToolPhotosError) {
      console.error("Error fetching return tool photos:", returnToolPhotosError);
    }

    // Process tool photos for first report
    const toolPhotosData = (toolPhotos || []).map((tp: any) => ({
      alat_id: tp.alat_id,
      foto_url: tp.foto_ambil_url || '',
      alat: tp.alat
    }));

    // Process return tool photos
    const returnToolPhotosData = (returnToolPhotos || []).map((rtp: any) => ({
      alat_id: rtp.alat_id,
      foto_url: rtp.foto_kembali_url || '',
      alat: rtp.alat
    }));

    const coords = report.titik_gps ? parseWKTPoint(report.titik_gps) : null;
    const processedReport = {
      ...report,
      // Parse titik_gps to latitude/longitude if exists
      latitude: coords ? coords[0] : null,
      longitude: coords ? coords[1] : null,
      pairs: pairs,
      tool_photos: toolPhotosData,
      return_tool_photos: returnToolPhotosData
    };

    return NextResponse.json({
      data: {
        report: processedReport,
        assignment: assignment
      }
    });

  } catch (error) {
    console.error("Error in report detail API:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }
}