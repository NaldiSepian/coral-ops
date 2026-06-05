/**
 * BWM Demo Script — Pembuktian Perhitungan untuk Dosen
 *
 * Contoh: 3 Teknisi Berbeda Level dalam 1 Penugasan
 *
 * Jalankan: npx tsx lib/bwm/demo.ts
 */

import {
  parsePreferensi,
  calculateWSM,
  calculateTunjangan,
  formatBWMResult,
  batchCalculateBWM,
  solveBWM,
  minMaxNormalize,
  calculateCR,
  validateVectors,
  validateConsistency,
  CRITERIA_RANGES,
  calculateBatchRanges,
} from "./index";
import type { BWMInput, BWMResult } from "./types";

// ============================================================
// 1. PREFERENSI MANAGER
// ============================================================
console.log("=".repeat(70));
console.log("BWM DEMO — 3 TEKNISI BEDA LEVEL KOMPETENSI");
console.log("=".repeat(70));
console.log("\n📋 PENUGASAN: Perawatan Sistem Jaringan");
console.log("   Plafon Bonus: Rp 1.500.000");
console.log("   Deadline: 31 Mei 2026 (selesai pas deadline)");

console.log("\n" + "-".repeat(70));
console.log("1. PREFERENSI MANAGER");
console.log("-".repeat(70));

const preferensiDB = {
  id: "pref-001",
  nama: "Preferensi Q1 2026",
  best_criteria: "c1", // Best = Kecepatan
  worst_criteria: "c5", // Worst = Kompetensi
  // BO: Best-to-Others (seberapa penting C1 dibanding yang lain)
  bo_c1: 1, // Best vs itself = 1
  bo_c2: 2,
  bo_c3: 3,
  bo_c4: 5,
  bo_c5: 9, // Best vs Worst
  // OW: Others-to-Worst (seberapa penting yang lain dibanding C5)
  ow_c1: 5,
  ow_c2: 4,
  ow_c3: 3,
  ow_c4: 2,
  ow_c5: 1, // Worst vs itself = 1
};

console.log("\n   Best Criteria  : C1 (Kecepatan)");
console.log("   Worst Criteria : C5 (Kompetensi)");
console.log("\n   Best-to-Others (BO):");
console.log(`     C1(Best)=1   C2=${preferensiDB.bo_c2}   C3=${preferensiDB.bo_c3}   C4=${preferensiDB.bo_c4}   C5(Worst)=${preferensiDB.bo_c5}`);
console.log("\n   Others-to-Worst (OW):");
console.log(`     C1=${preferensiDB.ow_c1}   C2=${preferensiDB.ow_c2}   C3=${preferensiDB.ow_c3}   C4=${preferensiDB.ow_c4}   C5(Worst)=1`);

// ============================================================
// 2. PARSE PREFERENSI & VALIDASI
// ============================================================
const parsedPref = parsePreferensi(preferensiDB);

const validationErrors = validateVectors(
  parsedPref.boVector,
  parsedPref.owVector,
  parsedPref.bestCriteria,
  parsedPref.worstCriteria,
);

console.log("\n   Validasi Vektor:");
if (validationErrors.length === 0) {
  console.log("     ✅ Semua vektor valid");
} else {
  validationErrors.forEach((err) => console.log(`     ❌ ${err}`));
}

// ============================================================
// 3. LP SOLVER — BOBOT OPTIMAL
// ============================================================
console.log("\n" + "-".repeat(70));
console.log("2. LP SOLVER — MENCARI BOBOT OPTIMAL");
console.log("-".repeat(70));

const lpResult = solveBWM(
  parsedPref.bestCriteria,
  parsedPref.worstCriteria,
  parsedPref.boVector,
  parsedPref.owVector,
);

console.log(`\n   Solver: ${lpResult.converged ? "✅ Konvergen" : "❌ Tidak konvergen"}`);
console.log(`   Iterasi: ${lpResult.iterations}`);

const weights = lpResult.weights;
const CRITERIA_LABELS = ["C1 (Kecepatan)", "C2 (Kualitas)", "C3 (Kepatuhan)", "C4 (Proaktivitas)", "C5 (Kompetensi)"];
console.log("\n   Bobot Optimal:");
weights.forEach((w, i) => {
  console.log(`     ${CRITERIA_LABELS[i]} = ${(w * 100).toFixed(2)}%`);
});
console.log(`     ${"-".repeat(30)}`);
console.log(`     Total         = ${weights.reduce((a, b) => a + b, 0).toFixed(4)}`);

// ============================================================
// 4. CONSISTENCY RATIO
// ============================================================
console.log("\n" + "-".repeat(70));
console.log("3. CONSISTENCY RATIO (CR)");
console.log("-".repeat(70));

const aBW = parsedPref.boVector[parsedPref.worstCriteria]; // a_BW = 9
const cr = calculateCR(lpResult.xiStar, parsedPref.bestCriteria, parsedPref.worstCriteria, aBW);
const consistencyCheck = validateConsistency(cr);

console.log(`   ξ* (Xi Star)  = ${lpResult.xiStar.toFixed(6)}`);
console.log(`   a_BW          = ${aBW}`);
console.log(`   CR            = ${cr.toFixed(4)}`);
console.log(`   Threshold     = 0.10`);
console.log(`   Status        = ${consistencyCheck.isConsistent ? "✅ " + consistencyCheck.message : "❌ " + consistencyCheck.message}`);

// ============================================================
// 5. NILAI MENTAH 3 TEKNISI
// ============================================================
console.log("\n" + "-".repeat(70));
console.log("4. DATA 3 TEKNISI — NILAI MENTAH (RAW VALUES)");
console.log("-".repeat(70));

// Kasus: penugasan 3 hari, frekuensi harian, selesai pas deadline
const baseRawValues = {
  c1_kecepatan: 50,   // Pas deadline → baseline 50
  c2_kualitas: 100,    // Semua laporan approved
  c3_kepatuhan: 33,    // 1 dari 3 hari lapor
  c4_proaktivitas: 1,  // 1 kendala disetujui
  c5_kompetensi: 0,    // Akan diisi per level
};

const teknisiData = [
  { id: "tek-001", nama: "User Pertama", level: "Level 1", lisensi: "Level 1", c5: 500000 },
  { id: "tek-002", nama: "User Kedua",   level: "Level 2", lisensi: "Level 2", c5: 1000000 },
  { id: "tek-003", nama: "User Ketiga",  level: "Level 3", lisensi: "Level 3", c5: 1500000 },
];

console.log("\n   Penjelasan C1 (Kecepatan):");
console.log("     Selesai pas deadline (31/5/2026)");
console.log("     sisaHari = end_date - tanggal_selesai_actual = 0");
console.log("     C1 = 50 + (0 × 10) = 50");

console.log("\n   Penjelasan C2 (Kualitas):");
console.log("     Semua laporan disetujui → 100% approved");
console.log("     C2 = (100/100) × 100 = 100");

console.log("\n   Penjelasan C3 (Kepatuhan):");
console.log("     Penugasan 3 hari, frekuensi harian → expected = 3");
console.log("     Masing-masing lapor 1 hari unik");
console.log("     C3 = (1/3) × 100 = 33");

console.log("\n   Penjelasan C4 (Proaktivitas):");
console.log("     1 kendala disetujui dalam penugasan (global)");
console.log("     C4 = 1");

console.log("\n   Tabel Nilai Mentah:");
console.log("   ┌──────────┬──────┬──────┬──────┬──────┬────────────┐");
console.log("   │ User     │  C1  │  C2  │  C3  │  C4  │    C5      │");
console.log("   ├──────────┼──────┼──────┼──────┼──────┼────────────┤");
teknisiData.forEach((t) => {
  const raw = { ...baseRawValues, c5_kompetensi: t.c5 };
  console.log(`   │ ${t.nama.padEnd(8)} │ ${String(raw.c1_kecepatan).padStart(4)} │ ${String(raw.c2_kualitas).padStart(4)} │ ${String(raw.c3_kepatuhan).padStart(4)} │ ${String(raw.c4_proaktivitas).padStart(4)} │ ${String(raw.c5_kompetensi).padStart(10)} │`);
});
console.log("   └──────────┴──────┴──────┴──────┴──────┴────────────┘");

// ============================================================
// 6. NORMALISASI
// ============================================================
console.log("\n" + "-".repeat(70));
console.log("5. NORMALISASI (MIN-MAX KE SKALA 0-100)");
console.log("-".repeat(70));

// Static ranges
console.log("\n   A. Static Range:");
console.log(`      C1: V1 = ((50 - 0) / (100 - 0)) × 100 = 50.00`);
console.log(`      C4: V4 = ((1 - 0) / (20 - 0)) × 100 = 5.00`);

// Dynamic ranges - batch
const allRawValues = teknisiData.map((t) => ({
  ...baseRawValues,
  c5_kompetensi: t.c5,
}));
const batchRanges = calculateBatchRanges(allRawValues);

console.log("\n   B. Dynamic Range (dari batch):");
console.log(`      C2: min=${batchRanges.c2.min}  max=${batchRanges.c2.max}  → semua sama, V2 = 100`);
console.log(`      C3: min=${batchRanges.c3.min}  max=${batchRanges.c3.max}  → semua sama, V3 = 100`);
console.log(`      C5: min=${batchRanges.c5.min}  max=${batchRanges.c5.max}`);
console.log("");
teknisiData.forEach((t) => {
  const v5 = minMaxNormalize(t.c5, batchRanges.c5.min, batchRanges.c5.max);
  console.log(`      ${t.nama} (C5=${t.c5}): V5 = ((${t.c5} - ${batchRanges.c5.min}) / (${batchRanges.c5.max} - ${batchRanges.c5.min})) × 100 = ${v5.toFixed(2)}`);
});

console.log("\n   Tabel Normalisasi:");
console.log("   ┌──────────┬───────┬───────┬───────┬───────┬───────┐");
console.log("   │ User     │  V1   │  V2   │  V3   │  V4   │  V5   │");
console.log("   ├──────────┼───────┼───────┼───────┼───────┼───────┤");
teknisiData.forEach((t) => {
  const v5 = minMaxNormalize(t.c5, batchRanges.c5.min, batchRanges.c5.max);
  console.log(`   │ ${t.nama.padEnd(8)} │ 50.00 │ 100.00│ 100.00│ 5.00  │ ${v5.toFixed(2).padStart(5)} │`);
});
console.log("   └──────────┴───────┴───────┴───────┴───────┴───────┘");

// ============================================================
// 7. BUILD BWM INPUTS & BATCH CALCULATE
// ============================================================
const bwmInputs: BWMInput[] = teknisiData.map((t) => ({
  teknisiId: t.id,
  penugasanId: 1,
  rawValues: {
    ...baseRawValues,
    c5_kompetensi: t.c5,
  },
  plafonBonus: 1500000,
}));

const batchResults = batchCalculateBWM(bwmInputs, parsedPref);

// ============================================================
// 8. DETAIL SKOR AKHIR (WSM) PER TEKNISI
// ============================================================
console.log("\n" + "-".repeat(70));
console.log("6. SKOR AKHIR — WEIGHTED SUM MODEL (WSM)");
console.log("-".repeat(70));

const wsmLabels = ["C1 (40.90%)", "C2 (24.83%)", "C3 (18.50%)", "C4 (9.93%)", "C5 (5.84%)"];

batchResults.forEach((br, idx) => {
  const t = teknisiData[idx];
  const r = br.result;
  const vArr = [
    r.normalizedValues.v1,
    r.normalizedValues.v2,
    r.normalizedValues.v3,
    r.normalizedValues.v4,
    r.normalizedValues.v5,
  ];

  console.log(`\n   🧑 ${t.nama} (${t.level}) — C5 = ${t.c5}`);
  console.log(`   ${"-".repeat(50)}`);
  wsmLabels.forEach((label, i) => {
    const contribution = weights[i] * vArr[i];
    console.log(`   ${label}: ${weights[i].toFixed(4)} × ${vArr[i].toFixed(2)} = ${contribution.toFixed(2)}`);
  });
  console.log(`   ${"-".repeat(50)}`);
  console.log(`   SKOR AKHIR = ${r.skorAkhir.toFixed(2)}`);
});

// ============================================================
// 9. TUJANGAN
// ============================================================
console.log("\n" + "-".repeat(70));
console.log("7. TUJANGAN (ABSOLUTE SCORING)");
console.log("-".repeat(70));
console.log("\n   Rumus: Tunjangan = (Skor / 100) × Plafon");
console.log("   Plafon: Rp 1.500.000");

console.log("\n   ┌──────────┬────────┬──────────────────┬──────────────┐");
console.log("   │ User     │ Skor   │ Perhitungan       │ Tunjangan    │");
console.log("   ├──────────┼────────┼──────────────────┼──────────────┤");
batchResults.forEach((br, idx) => {
  const t = teknisiData[idx];
  const r = br.result;
  const perhitungan = `(${r.skorAkhir.toFixed(2)}/100) × 1.500.000`;
  const tunjanganStr = `Rp ${r.tunjanganDidapat.toLocaleString("id-ID")}`;
  console.log(`   │ ${t.nama.padEnd(8)} │ ${r.skorAkhir.toFixed(2).padStart(6)} │ ${perhitungan.padEnd(16)} │ ${tunjanganStr.padStart(12)} │`);
});
console.log("   └──────────┴────────┴──────────────────┴──────────────┘");

const totalTunjangan = batchResults.reduce((sum, br) => sum + br.result.tunjanganDidapat, 0);
console.log(`\n   TOTAL TUJANGAN: Rp ${totalTunjangan.toLocaleString("id-ID")}`);

// ============================================================
// 10. FORMATTED RESULT
// ============================================================
console.log("\n" + "-".repeat(70));
console.log("8. HASIL TERFORMAT (FORMATTED RESULT)");
console.log("-".repeat(70));

batchResults.forEach((br, idx) => {
  const t = teknisiData[idx];
  const formatted = formatBWMResult(br.result);
  console.log(`\n   🧑 ${t.nama} (${t.level})`);
  console.log(`   ${"-".repeat(40)}`);
  console.log(`   Bobot       : ${JSON.stringify(formatted.weights)}`);
  console.log(`   Normalisasi : ${JSON.stringify(formatted.normalizedValues)}`);
  console.log(`   ξ*          : ${formatted.xiStar}`);
  console.log(`   CR          : ${formatted.cr}`);
  console.log(`   Konsisten   : ${formatted.isConsistent}`);
  console.log(`   Skor Akhir  : ${formatted.skorAkhir}`);
  console.log(`   Tunjangan   : ${formatted.tunjanganDidapat}`);
});

// ============================================================
// 11. SUMMARY
// ============================================================
console.log("\n" + "=".repeat(70));
console.log("RINGKASAN AKHIR");
console.log("=".repeat(70));
console.log("");
console.log("   ┌──────────┬────────┬──────────────┬──────────┐");
console.log("   │ User     │ Level  │ Skor         │ Tunjangan│");
console.log("   ├──────────┼────────┼──────────────┼──────────┤");
batchResults.forEach((br, idx) => {
  const t = teknisiData[idx];
  const r = br.result;
  const skorStr = r.skorAkhir.toFixed(2);
  const tunjanganStr = `Rp ${r.tunjanganDidapat.toLocaleString("id-ID")}`;
  console.log(`   │ ${t.nama.padEnd(8)} │ ${t.level.padEnd(6)} │ ${skorStr.padStart(12)} │ ${tunjanganStr.padStart(8)} │`);
});
console.log("   └──────────┴────────┴──────────────┴──────────┘");
console.log(`\n   Consistency Ratio (CR): ${cr.toFixed(4)} (${consistencyCheck.isConsistent ? "Konsisten ✅" : "Tidak Konsisten ❌"})`);
console.log(`\n   📌 Kesimpulan:`);
console.log(`      Perbedaan skor hanya dari C5 (Kompetensi) karena C1-C4 identik.`);
console.log(`      Bobot C5 = 5.84% (Worst) → dampak ke skor maksimal 5.84 poin.`);
console.log(`      Tunjangan dihitung ABSOLUTE: (Skor/100) × Plafon.`);
console.log(`      Level 3 = ${batchResults[2].result.tunjanganDidapat.toLocaleString("id-ID")} (${batchResults[2].result.skorAkhir.toFixed(2)}% plafon)`);
console.log(`      Level 2 = ${batchResults[1].result.tunjanganDidapat.toLocaleString("id-ID")} (${batchResults[1].result.skorAkhir.toFixed(2)}% plafon)`);
console.log(`      Level 1 = ${batchResults[0].result.tunjanganDidapat.toLocaleString("id-ID")} (${batchResults[0].result.skorAkhir.toFixed(2)}% plafon)`);
