#!/usr/bin/env tsx
/**
 * BWM CLI — Perhitungan BWM Langsung dari Sistem
 *
 * Menjalankan perhitungan BWM yang SAMA dengan yang dijalankan dari UI,
 * langsung dari database (Supabase), dengan output detail ke terminal.
 *
 * Penggunaan:
 *   npx tsx --env-file=.env.local scripts/bwm-calculate.ts <penugasan_id>
 *
 * Contoh:
 *   npx tsx --env-file=.env.local scripts/bwm-calculate.ts 1
 */

import { createClient } from "@supabase/supabase-js";
import {
  batchCalculateBWM,
  parsePreferensi,
  solveBWM,
  calculateCR,
  validateConsistency,
  validateVectors,
  minMaxNormalize,
  calculateBatchRanges,
  calculateWSM,
} from "../lib/bwm";
import type { BWMInput } from "../lib/bwm";

// ==============================
// 1. ARGUMEN
// ==============================
const penugasanId = Number(process.argv[2]);

if (!penugasanId || Number.isNaN(penugasanId)) {
  console.error("Usage: npx tsx --env-file=.env.local scripts/bwm-calculate.ts <penugasan_id>");
  process.exit(1);
}

console.log("=".repeat(72));
console.log(" BWM CALCULATION CLI — SISTEM LANGSUNG");
console.log("=".repeat(72));
console.log(`\n Penugasan ID: ${penugasanId}`);

// ==============================
// 2. SUPABASE CLIENT
// ==============================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase credentials not found. Make sure .env.local is loaded.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log(" ✅ Supabase connected");

// ==============================
// 3. MAIN
// ==============================
async function main() {
  try {
    // ---- 3a. Cek Penugasan ----
    console.log("\n" + "-".repeat(72));
    console.log("1. DATA PENUGASAN");
    console.log("-".repeat(72));

    const { data: penugasan, error: penugasanErr } = await supabase
      .from("penugasan")
      .select("id, judul, kategori, status, start_date, end_date, plafon_bonus, bwm_status, tanggal_selesai_actual")
      .eq("id", penugasanId)
      .single();

    if (penugasanErr || !penugasan) {
      console.error(`❌ Penugasan #${penugasanId} tidak ditemukan: ${penugasanErr?.message}`);
      process.exit(1);
    }

    console.log(`   Judul      : ${penugasan.judul}`);
    console.log(`   Kategori   : ${penugasan.kategori}`);
    console.log(`   Status     : ${penugasan.status}`);
    console.log(`   Mulai      : ${penugasan.start_date}`);
    console.log(`   Deadline   : ${penugasan.end_date}`);
    console.log(`   Selesai    : ${penugasan.tanggal_selesai_actual || "Belum"}`);
    console.log(`   Plafon     : Rp ${(penugasan.plafon_bonus || 0).toLocaleString("id-ID")}`);
    console.log(`   BWM Status : ${penugasan.bwm_status || "belum_dihitung"}`);

    if (penugasan.status !== "Selesai") {
      console.warn(`\n   ⚠️  Penugasan belum selesai. Perhitungan hanya untuk simulasi.`);
    }

    // ---- 3b. Teknisi ----
    console.log("\n" + "-".repeat(72));
    console.log("2. TEKNISI DALAM PENUGASAN");
    console.log("-".repeat(72));

    const { data: assignments } = await supabase
      .from("penugasan_teknisi")
      .select("teknisi_id")
      .eq("penugasan_id", penugasanId);

    if (!assignments || assignments.length === 0) {
      console.error("❌ Tidak ada teknisi dalam penugasan ini.");
      process.exit(1);
    }

    const teknisiIds = assignments.map((a) => a.teknisi_id);

    const { data: profilList } = await supabase
      .from("profil")
      .select("id, nama, lisensi_teknisi")
      .in("id", teknisiIds);

    if (!profilList || profilList.length === 0) {
      console.error("❌ Data profil teknisi tidak ditemukan.");
      process.exit(1);
    }

    console.log(`   Total: ${profilList.length} teknisi`);
    console.log("");
    profilList.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.nama.padEnd(20)} ${p.lisensi_teknisi || "N/A"}`);
    });

    // ---- 3c. Tunjangan Lisensi ----
    const { data: tunjanganData } = await supabase
      .from("tunjangan_lisensi")
      .select("level, tunjangan_jabatan");

    const tunjanganMap = new Map(
      tunjanganData?.map((t) => [t.level, t.tunjangan_jabatan]) || [],
    );

    console.log("\n   Tunjangan Lisensi:");
    tunjanganMap.forEach((val, key) => {
      console.log(`   ${key.padEnd(12)} Rp ${val.toLocaleString("id-ID")}`);
    });

    // ---- 3d. Preferensi Aktif ----
    console.log("\n" + "-".repeat(72));
    console.log("3. PREFERENSI BWM");
    console.log("-".repeat(72));

    const { data: preferensi } = await supabase
      .from("preferensi_bwm")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!preferensi) {
      console.error("❌ Tidak ada preferensi aktif.");
      process.exit(1);
    }

    console.log(`   Nama         : ${preferensi.nama}`);
    console.log(`   Best (C)     : ${preferensi.best_criteria}`);
    console.log(`   Worst (C)    : ${preferensi.worst_criteria}`);

    const CRITERIA_NAMES_MAP: Record<string, string> = {
      c1: "C1 Kecepatan", c2: "C2 Kualitas", c3: "C3 Kepatuhan",
      c4: "C4 Proaktivitas", c5: "C5 Kompetensi",
    };

    console.log(`\n   BO Vector (Best-to-Others):`);
    ["c1", "c2", "c3", "c4", "c5"].forEach((c) => {
      const val = (preferensi as any)[`bo_${c}`];
      const label = preferensi.best_criteria === c ? `${CRITERIA_NAMES_MAP[c]} (Best)` : CRITERIA_NAMES_MAP[c];
      console.log(`     ${label.padEnd(25)} = ${val}`);
    });

    console.log(`\n   OW Vector (Others-to-Worst):`);
    ["c1", "c2", "c3", "c4", "c5"].forEach((c) => {
      const val = (preferensi as any)[`ow_${c}`];
      const label = preferensi.worst_criteria === c ? `${CRITERIA_NAMES_MAP[c]} (Worst)` : CRITERIA_NAMES_MAP[c];
      console.log(`     ${label.padEnd(25)} = ${val}`);
    });

    // Validasi preferensi
    const parsedPref = parsePreferensi(preferensi);
    const prefErrors = validateVectors(parsedPref.boVector, parsedPref.owVector, parsedPref.bestCriteria, parsedPref.worstCriteria);
    if (prefErrors.length > 0) {
      prefErrors.forEach((e) => console.log(`   ⚠️  ${e}`));
    }

    // ---- 3e. LP Solver ----
    console.log("\n" + "-".repeat(72));
    console.log("4. LP SOLVER — BOBOT OPTIMAL");
    console.log("-".repeat(72));

    const lpResult = solveBWM(
      parsedPref.bestCriteria,
      parsedPref.worstCriteria,
      parsedPref.boVector,
      parsedPref.owVector,
    );

    console.log(`   Method   : ${lpResult.converged ? "Newton-Raphson" : "Gradient Descent"}`);
    console.log(`   Iterasi  : ${lpResult.iterations}`);
    console.log(`   ξ*       : ${lpResult.xiStar.toFixed(6)}`);

    console.log("");
    lpResult.weights.forEach((w, i) => {
      const label = Object.values(CRITERIA_NAMES_MAP)[i];
      console.log(`   ${label.padEnd(20)} = ${(w * 100).toFixed(2)}%`);
    });
    console.log(`   ${"─".repeat(30)}`);
    console.log(`   Total            = ${lpResult.weights.reduce((a, b) => a + b, 0).toFixed(4)}`);

    const aBW = parsedPref.boVector[parsedPref.worstCriteria];
    const cr = calculateCR(lpResult.xiStar, parsedPref.bestCriteria, parsedPref.worstCriteria, aBW);
    const consistencyCheck = validateConsistency(cr);

    console.log(`\n   CR       : ${cr.toFixed(4)} (threshold: 0.10)`);
    console.log(`   Status   : ${consistencyCheck.isConsistent ? `✅ ${consistencyCheck.message}` : `❌ ${consistencyCheck.message}`}`);

    // ---- 3f. Hitung Metrics per Teknisi ----
    console.log("\n" + "-".repeat(72));
    console.log("5. PERHITUNGAN METRIK PER TEKNISI");
    console.log("-".repeat(72));

    const bwmInputs: BWMInput[] = [];
    const teknisiDetail: Array<{
      nama: string;
      level: string;
      metrics: Record<string, number>;
    }> = [];

    const dueDate = penugasan.end_date;
    const selesaiDateStr = penugasan.tanggal_selesai_actual;

    for (const profil of profilList) {
      console.log(`\n   --- ${profil.nama} (${profil.lisensi_teknisi || "N/A"}) ---`);

      // C1: Kecepatan
      let c1 = 0;
      if (dueDate && penugasan.start_date && selesaiDateStr) {
        const start = new Date(penugasan.start_date);
        const end = new Date(dueDate);
        const selesai = new Date(selesaiDateStr);
        const totalDurasi = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        const sisaHari = (end.getTime() - selesai.getTime()) / (1000 * 60 * 60 * 24);

        if (totalDurasi > 0 && sisaHari >= 0) {
          c1 = Math.min(100, Math.round(50 + sisaHari * 10));
        }
      }
      console.log(`   C1 Kecepatan : ${c1} ${selesaiDateStr ? `(selesai ${selesaiDateStr})` : "(belum selesai)"}`);

      // C2, C3: Laporan
      const { data: laporanList } = await supabase
        .from("laporan_progres")
        .select("id, status_validasi, tanggal_laporan")
        .eq("penugasan_id", penugasanId)
        .eq("pelapor_id", profil.id);

      const laporan = laporanList || [];

      // C2: Kualitas
      let c2 = 0;
      if (laporan.length > 0) {
        const approved = laporan.filter((l) => l.status_validasi === "Disetujui").length;
        c2 = Math.round((approved / laporan.length) * 100);
      }
      console.log(`   C2 Kualitas  : ${c2} (${laporan.filter((l) => l.status_validasi === "Disetujui").length}/${laporan.length} approved)`);

      // C3: Kepatuhan
      let c3 = 0;
      if (laporan.length > 0 && penugasan.start_date) {
        const startDate = new Date(penugasan.start_date);
        const endDate = dueDate ? new Date(dueDate) : new Date();
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        let totalExpected = 1;
        const { data: freq } = await supabase
          .from("penugasan")
          .select("frekuensi_laporan")
          .eq("id", penugasanId)
          .single();

        if (freq?.frekuensi_laporan === "Harian") {
          totalExpected = diffDays;
        } else if (freq?.frekuensi_laporan === "Mingguan") {
          totalExpected = Math.ceil(diffDays / 7);
        }
        if (totalExpected <= 0) totalExpected = 1;

        const uniqueDates = new Set(laporan.map((l) => l.tanggal_laporan).filter(Boolean));
        c3 = Math.min(100, Math.round((uniqueDates.size / totalExpected) * 100));
        console.log(`   C3 Kepatuhan : ${c3} (${uniqueDates.size}/${totalExpected} hari lapor)`);
      } else {
        console.log(`   C3 Kepatuhan : ${c3} (tidak ada laporan)`);
      }

      // C4: Proaktivitas (global)
      const { count: kendalaCount } = await supabase
        .from("perpanjangan_penugasan")
        .select("*", { count: "exact", head: true })
        .eq("penugasan_id", penugasanId)
        .eq("status", "Disetujui");
      const c4 = kendalaCount || 0;
      console.log(`   C4 Proaktivitas : ${c4} kendala disetujui`);

      // C5: Kompetensi
      const c5 = tunjanganMap.get(profil.lisensi_teknisi || "Level 1") || 500000;
      console.log(`   C5 Kompetensi : Rp ${c5.toLocaleString("id-ID")} (${profil.lisensi_teknisi})`);

      const metrics = { c1_kecepatan: c1, c2_kualitas: c2, c3_kepatuhan: c3, c4_proaktivitas: c4, c5_kompetensi: c5 };
      bwmInputs.push({
        teknisiId: profil.id,
        penugasanId,
        rawValues: metrics,
        plafonBonus: penugasan.plafon_bonus || 2000000,
      });
      teknisiDetail.push({
        nama: profil.nama,
        level: profil.lisensi_teknisi || "N/A",
        metrics,
      });
    }

    // ---- 3g. Normalisasi ----
    console.log("\n" + "-".repeat(72));
    console.log("6. NORMALISASI MIN-MAX");
    console.log("-".repeat(72));

    const allRaw = bwmInputs.map((i) => i.rawValues);
    const ranges = calculateBatchRanges(allRaw);

    console.log("\n   A. Static Range:");
    console.log(`      C1: 0-100    → V1 = ((C1 - 0) / 100) × 100`);
    console.log(`      C4: 0-20     → V4 = ((C4 - 0) / 20) × 100`);

    console.log("\n   B. Dynamic Range (dari batch):");
    console.log(`      C2: min=${ranges.c2.min}  max=${ranges.c2.max}`);
    console.log(`      C3: min=${ranges.c3.min}  max=${ranges.c3.max}`);
    console.log(`      C5: min=${ranges.c5.min.toLocaleString("id-ID")}  max=${ranges.c5.max.toLocaleString("id-ID")}`);

    console.log("\n   Tabel Normalisasi:");
    const header = `   ${"Teknisi".padEnd(22)} ${"C1".padEnd(6)} ${"C2".padEnd(6)} ${"C3".padEnd(6)} ${"C4".padEnd(6)} ${"C5".padEnd(6)}`;
    console.log(`   ${"─".repeat(header.length)}`);
    console.log(header);
    console.log(`   ${"─".repeat(header.length)}`);

    teknisiDetail.forEach((td) => {
      const m = td.metrics;
      const v1 = minMaxNormalize(m.c1_kecepatan, 0, 100);
      const v4 = minMaxNormalize(m.c4_proaktivitas, 0, 20);
      const v2 = minMaxNormalize(m.c2_kualitas, ranges.c2.min, ranges.c2.max);
      const v3 = minMaxNormalize(m.c3_kepatuhan, ranges.c3.min, ranges.c3.max);
      const v5 = minMaxNormalize(m.c5_kompetensi, ranges.c5.min, ranges.c5.max);
      console.log(`   ${td.nama.padEnd(22)} ${v1.toFixed(2).padEnd(6)} ${v2.toFixed(2).padEnd(6)} ${v3.toFixed(2).padEnd(6)} ${v4.toFixed(2).padEnd(6)} ${v5.toFixed(2).padEnd(6)}`);
    });

    // ---- 3h. Batch BWM Calculation ----
    console.log("\n" + "-".repeat(72));
    console.log("7. SKOR AKHIR (WSM)");
    console.log("-".repeat(72));

    const batchResults = batchCalculateBWM(bwmInputs, parsedPref);

    console.log(`\n   ${"Teknisi".padEnd(22)} ${"C1".padEnd(10)} ${"C2".padEnd(10)} ${"C3".padEnd(10)} ${"C4".padEnd(10)} ${"C5".padEnd(10)} ${"SKOR".padEnd(10)}`);
    console.log(`   ${"─".repeat(80)}`);

    batchResults.forEach((br, i) => {
      if (br.error) {
        console.log(`   ${teknisiDetail[i].nama.padEnd(22)} ❌ ${br.error}`);
        return;
      }
      const r = br.result;
      const w = r.weights;
      const v = r.normalizedValues;
      const c1c = (w.w1 * v.v1);
      const c2c = (w.w2 * v.v2);
      const c3c = (w.w3 * v.v3);
      const c4c = (w.w4 * v.v4);
      const c5c = (w.w5 * v.v5);
      console.log(`   ${teknisiDetail[i].nama.padEnd(22)} ${c1c.toFixed(2).padEnd(10)} ${c2c.toFixed(2).padEnd(10)} ${c3c.toFixed(2).padEnd(10)} ${c4c.toFixed(2).padEnd(10)} ${c5c.toFixed(2).padEnd(10)} ${r.skorAkhir.toFixed(2).padEnd(10)}`);
    });

    // ---- 3i. Tunjangan ----
    console.log("\n" + "-".repeat(72));
    console.log("8. TUJANGAN (ABSOLUTE SCORING)");
    console.log("-".repeat(72));

    console.log(`\n   Plafon: Rp ${(penugasan.plafon_bonus || 0).toLocaleString("id-ID")}`);
    console.log(`   Rumus : (Skor / 100) × Plafon`);

    console.log(`\n   ${"Teknisi".padEnd(22)} ${"Skor".padEnd(10)} ${"Tunjangan".padEnd(20)} ${"% Plafon".padEnd(10)}`);
    console.log(`   ${"─".repeat(65)}`);

    let totalTunjangan = 0;
    batchResults.forEach((br, i) => {
      if (br.error) return;
      const r = br.result;
      totalTunjangan += r.tunjanganDidapat;
      const pct = (r.tunjanganDidapat / (penugasan.plafon_bonus || 1)) * 100;
      console.log(`   ${teknisiDetail[i].nama.padEnd(22)} ${r.skorAkhir.toFixed(2).padEnd(10)} Rp ${r.tunjanganDidapat.toLocaleString("id-ID").padEnd(15)} ${pct.toFixed(2)}%`);
    });
    console.log(`   ${"─".repeat(65)}`);
    console.log(`   ${"TOTAL".padEnd(22)} ${"".padEnd(10)} Rp ${totalTunjangan.toLocaleString("id-ID").padEnd(15)}`);

    // ---- 3j. Ringkasan ----
    console.log("\n" + "=".repeat(72));
    console.log(" RINGKASAN");
    console.log("=".repeat(72));
    console.log(`\n Penugasan : ${penugasan.judul}`);
    console.log(` Teknisi   : ${teknisiDetail.length} orang`);
    console.log(` CR        : ${cr.toFixed(4)} (${consistencyCheck.isConsistent ? "Konsisten ✅" : "Tidak Konsisten ❌"})`);
    console.log(` Total Tunjangan : Rp ${totalTunjangan.toLocaleString("id-ID")}`);
    console.log(`\n Perbedaan skor antar teknisi berasal dari C5 (Kompetensi).`);
    console.log(` C1-C4 identik karena dalam penugasan yang sama.`);
    console.log(` Tunjangan dihitung ABSOLUTE: (Skor/100) × Plafon.`);

  } catch (err) {
    console.error("\n❌ Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main().then(() => {
  console.log("\n✅ Selesai.\n");
});
