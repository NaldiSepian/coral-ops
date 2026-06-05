/**
 * API Route untuk Perhitungan BWM
 *
 * Manager-only: Trigger perhitungan BWM dan lihat hasil
 *
 * @module app/api/bwm/perhitungan
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { batchCalculateBWM, parsePreferensi } from "@/lib/bwm";
import type { BWMInput } from "@/lib/bwm";

/**
 * Check authentication and return user info
 */
async function requireAuth(): Promise<{
  user: { id: string };
  role: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("profil")
    .select("peran")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    throw new Error("Gagal mengambil data user");
  }

  return { user, role: data.peran };
}

/**
 * GET - List perhitungan dengan filter
 * Query params: penugasan_id, status, teknisi_id
 */
export async function GET(request: NextRequest) {
  try {
    const { user, role } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const penugasanId = searchParams.get("penugasan_id");
    const status = searchParams.get("status");
    // Jika Manager, bisa filter teknisi_id dari query. Jika Teknisi, paksa pakai ID mereka.
    const teknisiId =
      role === "Manager" ? searchParams.get("teknisi_id") : user.id;

    const supabase = await createClient();
    let query = supabase.from("perhitungan_bwm").select(`
        *,
        teknisi:teknisi_id (id, nama, lisensi_teknisi),
        preferensi:preferensi_id (id, nama, best_criteria, worst_criteria)
      `);

    if (penugasanId) {
      query = query.eq("penugasan_id", parseInt(penugasanId));
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (teknisiId) {
      query = query.eq("teknisi_id", teknisiId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching perhitungan:", error);
      return NextResponse.json(
        { error: "Gagal mengambil data perhitungan" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    if (err instanceof Error) {
      const status = err.message === "Unauthorized" ? 401 : 403;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error("Unexpected error in GET perhitungan:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST - Trigger perhitungan BWM untuk penugasan
 * Body: { penugasan_id: number, preferensi_id?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { role } = await requireAuth();
    if (role !== "Manager") {
      throw new Error("Hanya Manager yang dapat melakukan aksi ini");
    }

    const body = await request.json();
    const { penugasan_id, preferensi_id } = body;

    if (!penugasan_id || typeof penugasan_id !== "number") {
      return NextResponse.json(
        { error: "penugasan_id harus diisi dan berupa number" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // 1. Cek penugasan exists dan sudah selesai
    const { data: penugasan, error: penugasanError } = await supabase
      .from("penugasan")
      .select("id, status, end_date, plafon_bonus, bwm_status")
      .eq("id", penugasan_id)
      .single();

    if (penugasanError || !penugasan) {
      return NextResponse.json(
        { error: "Penugasan tidak ditemukan" },
        { status: 404 },
      );
    }

    if (penugasan.status !== "Selesai") {
      return NextResponse.json(
        { error: "Penugasan belum selesai, tidak dapat menghitung BWM" },
        { status: 400 },
      );
    }

    // 2. Get preferensi aktif atau yang di-request
    let preferensiId = preferensi_id;
    if (!preferensiId) {
      const { data: activePreferensi } = await supabase
        .from("preferensi_bwm")
        .select("id")
        .eq("is_active", true)
        .single();

      if (!activePreferensi) {
        return NextResponse.json(
          {
            error:
              "Tidak ada preferensi aktif. Silakan pilih preferensi atau aktifkan salah satu.",
          },
          { status: 400 },
        );
      }
      preferensiId = activePreferensi.id;
    }

    // 3. Get preferensi detail
    const { data: preferensi, error: preferensiError } = await supabase
      .from("preferensi_bwm")
      .select("*")
      .eq("id", preferensiId)
      .single();

    if (preferensiError || !preferensi) {
      return NextResponse.json(
        { error: "Preferensi tidak ditemukan" },
        { status: 404 },
      );
    }

    // 4. Get semua teknisi di penugasan ini
    const { data: teknisiAssignments, error: teknisiError } = await supabase
      .from("penugasan_teknisi")
      .select("teknisi_id")
      .eq("penugasan_id", penugasan_id);

    if (teknisiError) {
      console.error("Error fetching teknisi assignments:", teknisiError);
      return NextResponse.json(
        { error: "Gagal mengambil data teknisi" },
        { status: 500 },
      );
    }

    if (!teknisiAssignments || teknisiAssignments.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada teknisi di penugasan ini" },
        { status: 400 },
      );
    }

    // Get detail profil teknisi
    const teknisiIds = teknisiAssignments.map((a) => a.teknisi_id);
    console.log("DEBUG - Teknisi IDs from assignments:", teknisiIds);

    const { data: profilData, error: profilError } = await supabase
      .from("profil")
      .select("id, nama, lisensi_teknisi")
      .in("id", teknisiIds);

    console.log("DEBUG - Profil data:", profilData, "Error:", profilError);

    if (profilError) {
      console.error("Error fetching teknisi data:", profilError);
      return NextResponse.json(
        { error: `Gagal mengambil data profil teknisi: ${profilError.message}` },
        { status: 500 },
      );
    }

    if (!profilData || profilData.length === 0) {
      console.error("No profil data found for teknisi IDs:", teknisiIds);
      return NextResponse.json(
        { error: "Data profil teknisi tidak ditemukan. Mungkin ada masalah dengan data teknisi." },
        { status: 500 },
      );
    }

    // Buat map teknisi_id -> teknisi data
    const teknisiMap = new Map(profilData.map((t) => [t.id, t]));

    // 5. Get tunjangan lisensi untuk mapping level -> nilai
    const { data: tunjanganData } = await supabase
      .from("tunjangan_lisensi")
      .select("level, tunjangan_jabatan");

    const tunjanganMap = new Map(
      tunjanganData?.map((t) => [t.level, t.tunjangan_jabatan]) || [],
    );

    // 6. Hitung metrik untuk SEMUA teknisi dulu (kumpulkan raw values)
    const parsedPref = parsePreferensi(preferensi);
    const bwmInputs: BWMInput[] = [];
    const teknisiData: Array<{
      id: string;
      nama: string;
      lisensi_teknisi: string;
      metrics: any;
      error?: string;
    }> = [];

    for (const assignment of teknisiAssignments) {
      const teknisi = teknisiMap.get(assignment.teknisi_id);

      if (!teknisi) {
        console.warn(`Teknisi ${assignment.teknisi_id} tidak ditemukan di profil`);
        continue;
      }

      try {
        // Hitung metrik dari data aktual
        const metrics = await calculateMetrics(
          supabase,
          penugasan_id,
          teknisi.id,
          tunjanganMap,
        );

        const input: BWMInput = {
          teknisiId: teknisi.id,
          penugasanId: penugasan_id,
          rawValues: metrics,
          plafonBonus: penugasan.plafon_bonus || 2000000, // Default 2jt kalau null
        };

        bwmInputs.push(input);
        teknisiData.push({
          id: teknisi.id,
          nama: teknisi.nama,
          lisensi_teknisi: teknisi.lisensi_teknisi,
          metrics,
        });
      } catch (calcError) {
        teknisiData.push({
          id: teknisi.id,
          nama: teknisi.nama,
          lisensi_teknisi: teknisi.lisensi_teknisi,
          metrics: null,
          error:
            calcError instanceof Error ? calcError.message : "Unknown error",
        });
      }
    }

    // 7. Batch calculate BWM dengan dynamic normalization
    // Ini yang benar secara metodologi: min/max dari seluruh batch
    const batchResults = batchCalculateBWM(bwmInputs, parsedPref);

    // 8. Save hasil ke database
    const results = [];
    const errors = [];

    for (let i = 0; i < batchResults.length; i++) {
      const batchResult = batchResults[i];
      const teknisi = teknisiData[i];

      if (batchResult.error) {
        errors.push({ teknisi_id: teknisi.id, error: batchResult.error });
        continue;
      }

      const result = batchResult.result;
      const metrics = teknisi.metrics;

      try {
        const { data: saved, error: saveError } = await supabase
          .from("perhitungan_bwm")
          .upsert(
            {
              penugasan_id: penugasan_id,
              teknisi_id: teknisi.id,
              preferensi_id: preferensiId,
              // Nilai mentah
              c1_kecepatan: metrics.c1_kecepatan,
              c2_kualitas: metrics.c2_kualitas,
              c3_kepatuhan: metrics.c3_kepatuhan,
              c4_proaktivitas: metrics.c4_proaktivitas,
              c5_kompetensi: metrics.c5_kompetensi,
              // Normalisasi (dynamic dari batch)
              v1: result.normalizedValues.v1,
              v2: result.normalizedValues.v2,
              v3: result.normalizedValues.v3,
              v4: result.normalizedValues.v4,
              v5: result.normalizedValues.v5,
              // Bobot
              w1: result.weights.w1,
              w2: result.weights.w2,
              w3: result.weights.w3,
              w4: result.weights.w4,
              w5: result.weights.w5,
              // Konsistensi
              xi_star: result.xiStar,
              cr: result.cr,
              // Hasil
              skor_akhir: result.skorAkhir,
              tunjangan_didapat: result.tunjanganDidapat,
              status: "draft",
            },
            {
              onConflict: "penugasan_id,teknisi_id",
              ignoreDuplicates: false,
            },
          )
          .select()
          .single();

        if (saveError) {
          errors.push({ teknisi_id: teknisi.id, error: saveError.message });
        } else {
          results.push({ teknisi, result, saved });
        }
      } catch (saveError) {
        errors.push({
          teknisi_id: teknisi.id,
          error:
            saveError instanceof Error ? saveError.message : "Unknown error",
        });
      }
    }

    // Update status penugasan
    await supabase
      .from("penugasan")
      .update({ bwm_status: "draft" })
      .eq("id", penugasan_id);

    return NextResponse.json({
      success: true,
      penugasan_id: penugasan_id,
      teknisi_count: teknisiAssignments.length,
      calculated: results.length,
      errors: errors.length > 0 ? errors : undefined,
      data: results,
    });
  } catch (err) {
    if (err instanceof Error) {
      const status = err.message === "Unauthorized" ? 401 : 403;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error("Unexpected error in POST perhitungan:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Hitung metrik untuk teknisi dari data aktual
 */
async function calculateMetrics(
  supabaseClient: Awaited<ReturnType<typeof createClient>>,
  penugasanId: number,
  teknisiId: string,
  tunjanganMap: Map<string, number>,
): Promise<{
  c1_kecepatan: number;
  c2_kualitas: number;
  c3_kepatuhan: number;
  c4_proaktivitas: number;
  c5_kompetensi: number;
}> {
  const supabase = supabaseClient;
  // 1. Get info penugasan untuk due date dan frekuensi
  const { data: penugasanData } = await supabase
    .from("penugasan")
    .select("end_date, start_date, frekuensi_laporan, tanggal_selesai_actual")
    .eq("id", penugasanId)
    .single();

  const dueDate = penugasanData?.end_date;

  // 2. Get laporan dari teknisi ini untuk penugasan ini (menggunakan pelapor_id)
  const { data: laporanList } = await supabase
    .from("laporan_progres")
    .select("id, created_at, status_validasi, tanggal_laporan")
    .eq("penugasan_id", penugasanId)
    .eq("pelapor_id", teknisiId);

  // Jika tidak ada laporan sama sekali, semua kriteria laporan bernilai 0
  if (!laporanList || laporanList.length === 0) {
    // C4: Proaktivitas - jumlah kendala disetujui di penugasan (per tim)
    const { count: kendalaCount } = await supabase
      .from("perpanjangan_penugasan")
      .select("*", { count: "exact", head: true })
      .eq("penugasan_id", penugasanId)
      .eq("status", "Disetujui");

    const c4_proaktivitas = kendalaCount || 0;

    // C5: Kompetensi - nilai dari tunjangan lisensi
    const { data: teknisiData } = await supabase
      .from("profil")
      .select("lisensi_teknisi")
      .eq("id", teknisiId)
      .single();

    const c5_kompetensi =
      tunjanganMap.get(teknisiData?.lisensi_teknisi || "Level 1") || 500000;

    return {
      c1_kecepatan: 0,
      c2_kualitas: 0,
      c3_kepatuhan: 0,
      c4_proaktivitas,
      c5_kompetensi,
    };
  }

  // C1: Kecepatan - selisih tanggal_selesai_actual vs end_date
  // Semakin cepat penugasan selesai dari deadline, semakin tinggi skor
  // Skema: pas deadline = 50 (base), lebih awal bonus sampai 100, telat = 0
  let c1_kecepatan = 0;
  const selesaiDate = penugasanData?.tanggal_selesai_actual
    ? new Date(penugasanData.tanggal_selesai_actual)
    : null;

  if (dueDate && penugasanData?.start_date && selesaiDate) {
    const startDate = new Date(penugasanData.start_date);
    const endDate = new Date(dueDate);

    // Total durasi penugasan dalam hari
    const totalDurasi = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    // Sisa hari setelah selesai sebelum deadline (positif = lebih awal)
    const sisaHari = (endDate.getTime() - selesaiDate.getTime()) / (1000 * 60 * 60 * 24);

    if (totalDurasi > 0) {
      if (sisaHari >= 0) {
        // Pas deadline = 50, lebih awal +10 per hari, max 5 hari = 100
        c1_kecepatan = Math.min(100, Math.round(50 + sisaHari * 10));
      }
      // sisaHari < 0 (telat): c1 tetap 0
    }
  }
  // Kalau tanggal_selesai_actual null (data lama sebelum migration), c1 tetap 0

  // C2: Kualitas - % laporan approved tanpa revisi (menggunakan status_validasi)
  let c2_kualitas = 0;
  if (laporanList.length > 0) {
    const approvedCount = laporanList.filter(
      (l) => l.status_validasi === "Disetujui",
    ).length;
    c2_kualitas = Math.round((approvedCount / laporanList.length) * 100);
  }

  // C3: Kepatuhan - % laporan on-time vs expected
  let c3_kepatuhan = 0;
  if (laporanList.length > 0 && penugasanData?.start_date) {
    const startDate = new Date(penugasanData.start_date);
    const endDate = dueDate ? new Date(dueDate) : new Date();
    
    // Selisih hari inklusif
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Hitung total laporan yang diharapkan
    let totalExpected = 1;
    if (penugasanData.frekuensi_laporan === "Harian") {
      totalExpected = diffDays;
    } else if (penugasanData.frekuensi_laporan === "Mingguan") {
      totalExpected = Math.ceil(diffDays / 7);
    }
    if (totalExpected <= 0) totalExpected = 1;
    
    // Hitung hari lapor unik dalam rentang penugasan
    const uniqueDates = new Set<string>();
    laporanList.forEach((l: { tanggal_laporan?: string }) => {
      if (l.tanggal_laporan) {
        uniqueDates.add(l.tanggal_laporan);
      }
    });
    
    const actualReportDays = uniqueDates.size;
    c3_kepatuhan = Math.min(100, Math.round((actualReportDays / totalExpected) * 100));
  }

  // C4: Proaktivitas - jumlah kendala disetujui di penugasan (per tim, bukan per teknisi)
  // Karena proaktivitas pelaporan kendala berdampak ke seluruh tim (mundurkan deadline)
  const { count: kendalaCount } = await supabase
    .from("perpanjangan_penugasan")
    .select("*", { count: "exact", head: true })
    .eq("penugasan_id", penugasanId)
    .eq("status", "Disetujui");

  const c4_proaktivitas = kendalaCount || 0;

  // C5: Kompetensi - nilai dari tunjangan lisensi
  const { data: teknisiData } = await supabase
    .from("profil")
    .select("lisensi_teknisi")
    .eq("id", teknisiId)
    .single();

  const c5_kompetensi =
    tunjanganMap.get(teknisiData?.lisensi_teknisi || "Level 1") || 500000;

  return {
    c1_kecepatan,
    c2_kualitas,
    c3_kepatuhan,
    c4_proaktivitas,
    c5_kompetensi,
  };
}
