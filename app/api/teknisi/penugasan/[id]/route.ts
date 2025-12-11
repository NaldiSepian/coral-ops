// API Route untuk Detail Penugasan (Teknisi)
// =============================================================================
// GET /api/teknisi/penugasan/[id] - Detail penugasan untuk teknisi
// - Include: supervisor, teknisi, alat, laporan_progres, kehadiran, perpanjangan
// - Validasi: teknisi harus assigned ke penugasan ini
// - Return: full penugasan data dengan semua relations
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Helper function to extract latitude/longitude from PostGIS EWKB hex string
function extractCoordinatesFromEWKB(hexString: string): { latitude: number; longitude: number } | null {
  if (!hexString || typeof hexString !== 'string') return null;
  
  const normalized = hexString.trim();
  if (normalized.length < 34 || normalized.length % 2 !== 0) return null;

  try {
    const buffer = new ArrayBuffer(normalized.length / 2);
    const bytes = new Uint8Array(buffer);

    for (let i = 0; i < normalized.length; i += 2) {
      bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
    }

    const view = new DataView(buffer);
    const littleEndian = view.getUint8(0) === 1;
    let offset = 1;

    const type = view.getUint32(offset, littleEndian);
    offset += 4;

    const hasSrid = (type & 0x20000000) !== 0;
    const geometryType = type & 0xFF;
    
    if (geometryType !== 1) return null; // Not a POINT

    if (hasSrid) {
      offset += 4; // Skip SRID
    }

    if (offset + 16 > view.byteLength) return null;

    const longitude = view.getFloat64(offset, littleEndian);
    offset += 8;
    const latitude = view.getFloat64(offset, littleEndian);

    return { latitude, longitude };
  } catch (error) {
    console.warn('Failed to parse EWKB coordinate:', error);
    return null;
  }
}

// GET handler - Detail penugasan untuk teknisi
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

    const { id: penugasanIdStr } = await params;
    const penugasanId = parseInt(penugasanIdStr);

    if (isNaN(penugasanId)) {
      return NextResponse.json({ error: "Invalid penugasan ID" }, { status: 400 });
    }

    // Validasi bahwa user adalah teknisi yang assigned ke penugasan ini
    const { data: assignmentCheck, error: checkError } = await supabase
      .from('penugasan_teknisi')
      .select('id')
      .eq('penugasan_id', penugasanId)
      .eq('teknisi_id', user.id)
      .single();

    if (checkError || !assignmentCheck) {
      return NextResponse.json({ error: "Access denied. You are not assigned to this penugasan." }, { status: 403 });
    }

    // Query penugasan dengan semua relations
    const { data: penugasan, error } = await supabase
      .from('penugasan')
      .select(`
        *,
        lokasi_text: lokasi::varchar,
        supervisor:profil!supervisor_id(nama, peran),
        teknisi:penugasan_teknisi(
          id,
          teknisi_id,
          profil!teknisi_id(nama, peran)
        ),
        alat:peminjaman_alat(
          id,
          alat_id,
          jumlah,
          is_returned,
          alat!alat_id(nama, foto_url, tipe_alat)
        ),
        laporan_progres(
          id,
          tanggal_laporan,
          status_progres,
          persentase_progres,
          catatan,
          foto_url,
          created_at,
          titik_gps,
          status_validasi,
          divalidasi_oleh,
          divalidasi_pada,
          catatan_validasi,
          bukti_laporan(
            id,
            judul,
            deskripsi,
            before_foto_url,
            after_foto_url,
            pair_key
          )
        ),
        perpanjangan_penugasan(
          id,
          status,
          alasan
        )
      `)
      .eq('id', penugasanId)
      .eq('is_deleted', false)
      .single();

    if (error) {
      console.error('Supabase query error in GET /api/teknisi/penugasan/[id]:', error);
      return NextResponse.json({ error: "Failed to fetch penugasan: " + error.message }, { status: 500 });
    }

    if (!penugasan) {
      return NextResponse.json({ error: "Penugasan not found" }, { status: 404 });
    }

    // Sort laporan_progres by ID descending (latest first)
    if (penugasan.laporan_progres && Array.isArray(penugasan.laporan_progres)) {
      penugasan.laporan_progres = penugasan.laporan_progres.sort(
        (a: any, b: any) => b.id - a.id
      );
    }

    // Extract coordinates from laporan_progres titik_gps (EWKB format)
    if (penugasan.laporan_progres && Array.isArray(penugasan.laporan_progres)) {
      penugasan.laporan_progres = penugasan.laporan_progres.map((report: any) => {
        if (report.titik_gps) {
          const coords = extractCoordinatesFromEWKB(report.titik_gps);
          if (coords) {
            return {
              ...report,
              latitude: coords.latitude,
              longitude: coords.longitude,
            };
          }
        }
        return {
          ...report,
          latitude: null,
          longitude: null,
        };
      });
    }

    return NextResponse.json({ data: penugasan });
  } catch (error) {
    console.error('Unexpected error in GET /api/teknisi/penugasan/[id]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}