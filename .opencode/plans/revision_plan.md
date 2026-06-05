# Revision Plan — Workflow Laporan & BWM

## Latar Belakang

Sistem saat ini memungkinkan teknisi laporan secara independen, tapi ada beberapa masalah:

1. **`kehadiran_teknisi`** — tabel sudah di-drop, absensi tidak ada
2. **Mismatch column** — `calculateMetrics()` filter pakai `teknisi_id` tapi kolom DB adalah `pelapor_id`
3. **C2 bug** — ngecek `status` (progress), bukan `status_validasi`
4. **C3 copy** — hanya copy dari C1, belum implementasi sendiri
5. **Default 100** — teknisi tanpa laporan dapat C1=C2=C3=100 otomatis (tidak fair)
6. **Reminder global** — ngecek "apa ada laporan?" global, bukan per-teknisi

### Kondisi Database Aktual (dicek 29 Mei 2026)

| Table | Rows | Status |
|-------|------|--------|
| `profil` | 15 | ✅ |
| `penugasan` | 10 | ✅ (status: Aktif, Selesai, Dibatalkan) |
| `penugasan_teknisi` | 22 | ✅ |
| `laporan_progres` | 19 | ✅ (kolom: `pelapor_id`, `status_progres`, `status_validasi`) |
| `perpanjangan_penugasan` | 3 | ✅ |
| `alat` | 40 | ✅ |
| `peminjaman_alat` | 33 | ✅ (kolom: `peminjam_id`, `is_returned`) |
| `preferensi_bwm` | 1 | ✅ (aktif: Preferensi Q2 2026) |
| `perhitungan_bwm` | 14 | ✅ (kolom: c1-c5, v1-v5, w1-w5, skor_akhir, tunjangan_didapat) |
| `gaji_teknisi` | 14 | ✅ (kolom: tunjangan_jabatan, bonus_bwm, total_gaji) |
| `tunjangan_lisensi` | 3 | ✅ (Level 1/2/3) |
| `bukti_laporan` | 27 | ✅ |
| `notifikasi` | 53 | ✅ |
| **`kehadiran_teknisi`** | **—** | **❌ Tidak ada** |

---

## ⭐ Opsi Terpilih: A — Individual Reporting

**Setiap teknisi yang ditugaskan WAJIB submit laporan progress sendiri-sendiri per periode.**

Tidak pakai absensi (`kehadiran_teknisi`), tidak pakai laporan wakil. BWM hitung per-teknisi dari data laporan masing-masing.

### Kriteria BWM (5 kriteria — tetap)

| Kode | Nama | Sumber Data | Keterangan |
|------|------|-------------|------------|
| c1 | Kecepatan Penyelesaian | `laporan_progres` per-teknisi | % laporan dikirim sebelum deadline |
| c2 | Kualitas Laporan | `laporan_progres` per-teknisi | % laporan dengan `status_validasi = Disetujui` |
| c3 | Kepatuhan Pelaporan | `laporan_progres` per-teknisi | % laporan dikirim sesuai jadwal (beda logic dari C1) |
| c4 | Proaktivitas Kendala | `perpanjangan_penugasan` | Jumlah kendala dilaporkan (per-teknisi) |
| c5 | Kompetensi Teknisi | `profil.lisensi_teknisi` | Level lisensi → nominal |

---

### Detail C3 — Kepatuhan Pelaporan

C3 harus beda dari C1. Logika:

```
c3_kepatuhan = (laporan_dikirim_sesuai_jadwal / total_laporan_diharapkan) × 100
```

- `total_laporan_diharapkan` = berdasarkan `frekuensi_laporan` (Harian/Mingguan) dan durasi penugasan
- `laporan_dikirim_sesuai_jadwal` = laporan yang `tanggal_laporan` sesuai dengan jadwal yang diharapkan
- Contoh: Penugasan 5 hari, frekuensi Harian → total laporan = 5. Teknisi kirim 4 laporan → C3 = 80

C1 membedakan antara laporan yang dikirim SEBELUM vs SESUDAH deadline. C3 hanya cek apakah jumlah laporan sesuai dengan jumlah yang diharapkan.

---

### Perubahan yang Diperlukan

#### 1. Database
Tidak ada perubahan skema. Tabel sudah support.

| Kolom | Status |
|-------|--------|
| `laporan_progres.pelapor_id` | ✅ Ada |
| `laporan_progres.status_progres` | ✅ Ada |
| `laporan_progres.status_validasi` | ✅ Ada |
| `perhitungan_bwm.c1..c5` | ✅ Ada |
| `gaji_teknisi.bonus_bwm` | ✅ Ada |

#### 2. API Laporan (`app/api/bwm/perhitungan/route.ts`)

| Fix | Detail |
|-----|--------|
| **`teknisi_id` → `pelapor_id`** | `calculateMetrics()` query `.eq("teknisi_id", teknisiId)` harus ganti jadi `.eq("pelapor_id", teknisiId)` |
| **C2: `status` → `status_validasi`** | `l.status === "Disetujui"` harus `l.status_validasi === "Disetujui"` |
| **Implementasi C3** | Hitung jumlah laporan aktual vs jumlah yang diharapkan dalam rentang penugasan |

#### 3. UI Technician

| Perbaikan | Detail |
|-----------|--------|
| **Timeline laporan** | Tampilkan nama pelapor di setiap entri laporan |
| **Reminder** | Cek per-teknisi: "apakah **saya** sudah lapor hari ini?" bukan global |
| **Laporkan Progres** | Pastikan dialog submit untuk user yang login (sudah, cek `userId` prop) |

#### 4. UI Supervisor (`views/spv/`)

| Perbaikan | Detail |
|-----------|--------|
| **Validasi Laporan** | Tampilkan filter per-teknisi, lihat laporan siapa yang belum divalidasi |
| **Daftar Laporan** | Kolom pelapor (nama teknisi) ditampilkan jelas |
| **Flow Selesai** | Validasi bahwa semua teknisi sudah laporan + semua laporan disetujui |

#### 5. BWM Engine

| Perbaikan | Detail |
|-----------|--------|
| **C1** | Fix filter `pelapor_id` (existing logic sudah benar, hanya filter typo) |
| **C2** | Fix status check ke `status_validasi` |
| **C3** | Implementasi logic independent (lihat detail di atas) |

---

### Flow Alat (Peminjaman & Pengembalian) — Opsi A

Alat bersifat **per-penugasan, bukan per-teknisi**. Flow-nya:

1. **Supervisor assign alat** → masuk `peminjaman_alat` dengan `peminjam_id = supervisor_id`
2. **Teknisi ambil alat di gudang** → foto alat diambil (opsional, bisa supervisor atau teknisi)
3. **Teknisi gunakan alat bersama** — alat dipakai tim, tidak tracking individual
4. **Teknisi kembalikan alat** → `is_returned = true`, siapa pun bisa kembalikan
5. **Sistem restore stok** → `stok_tersedia += jumlah`

**Kesimpulan:** Alat tidak perlu berubah. `peminjam_id` tetap fleksibel (siapa yang secara fisik ambil/kembalikan). Tidak perlu tracking alat per-teknisi karena alat bersifat tim.

---

### Flow Laporan — Opsi A (Detail)

```
Hari kerja
  │
  ├─ Teknisi A → submit laporan progres (pelapor_id = A)
  ├─ Teknisi B → submit laporan progres (pelapor_id = B)
  ├─ Teknisi C → submit laporan progres (pelapor_id = C)
  │
  └─ Supervisor validasi masing-masing laporan
       ├─ Laporan A: Disetujui / Ditolak
       ├─ Laporan B: Disetujui / Ditolak
       └─ Laporan C: Disetujui / Ditolak

Setelah semua laporan disetujui
  └─ Supervisor approve penugasan selesai

Manager trigger BWM
  └─ Hitung C1-C5 per-teknisi dari laporannya masing-masing
  └─ Normalisasi batch + LP solver + WSM
  └─ Bonus per-teknisi
```

---

### Roadmap Implementasi

| Step | Area | Estimasi |
|------|------|----------|
| 1 | **API** — Fix `calculateMetrics()`: `teknisi_id` → `pelapor_id` | 1 hari |
| 2 | **API** — Fix C2: `status` → `status_validasi` | 0.5 hari |
| 3 | **API** — Implementasi C3 independent | 1 hari |
| 4 | **UI Teknisi** — Reminder per-teknisi | 0.5 hari |
| 5 | **UI Teknisi** — Label pelapor di timeline | 0.5 hari |
| 6 | **UI Supervisor** — Filter per-teknisi di validasi | 1 hari |
| 7 | **Testing** — Unit test BWM + integration | 1 hari |
| | **Total** | **~5.5 hari** |
