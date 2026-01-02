# Dokumentasi Project: Coral-Ops

## 📋 Ringkasan Project

**Coral-Ops** adalah sistem manajemen operasional digital untuk CV. Coral yang berfokus pada **manajemen penugasan teknisi lapangan** dengan fitur pelaporan real-time, tracking lokasi GPS, dan monitoring progres proyek.

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL dengan PostGIS (untuk geolocation)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (untuk foto/dokumen)
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Maps**: React Leaflet

---

## 🔁 Perubahan Terbaru (Changelog) — 17 Desember 2025

Ringkasan perubahan terbaru yang sudah diimplementasikan:

- UI/UX
  - Dashboard **Supervisor** & **Manager** sepenuhnya responsif (mobile/tablet/desktop) ✅
  - Perbaikan tampilan logo perusahaan agar mengisi kontainer (Next.js Image `fill`) 🖼️
  - Standarisasi label dan ikon (Wrench, Package untuk statistik alat) 🔧📦
  - Menambahkan metrik inventaris: **Sedang Dipakai** dan **Total Stok** di dashboard 🧾
  - Migrasi warna ke CSS variables (`--primary`, `--foreground`, `--muted-foreground`, `--destructive`) untuk dukungan theme switching 🎨
  - Penyederhanaan palet warna untuk kontras lebih baik ⚪️

- API & Backend
  - Penugasan API: tambah query params `sortBy`/`sortOrder` (default `created_at` desc) dan filter `kategori` ✅
  - Manager API: melihat semua penugasan tanpa filter supervisor, menambahkan relation `supervisor` dalam select 🧾
  - Penambahan endpoint validasi laporan supervisor (`GET /api/supervisor/laporan-validasi`, `POST /api/laporan/[id]/validasi`) ✔️

- Cleanup & Behavior changes
  - Menghapus tombol Print/Export dari header detail penugasan dan menghapus tab **Files** (komponen `penugasan-detail-files.tsx` dihapus) 🧹
- Menambahkan fitur download **PDF per laporan** (halaman 1: metadata; halaman 2+ fokus pada foto before/after). Tombol **Download** tersedia di tiap item laporan pada `components/penugasan/detail-penugasan/penugasan-detail-progress.tsx` (client-side, `jspdf` dependency ditambahkan). 📄✅
  - Penugasan list sekarang diurutkan newest first (`created_at` DESC) 🔃
  - Semua perubahan telah diuji: build OK, tidak ada TypeScript errors, server berjalan lokal ✅

Catatan: Perubahan ini sudah diverifikasi di environment development (`npm run dev`) pada 17 Desember 2025.

---

## 👥 Role & Hierarki Pengguna

Project ini memiliki **3 role utama** dengan hierarki sebagai berikut:

```
Manager (Pemilik/Direktur)
    ↓
Supervisor (Koordinator Lapangan)
    ↓
Teknisi (Pekerja Lapangan)
```

---

## 🎯 Fungsi & Tanggung Jawab Setiap Role

### 1. **MANAGER** (Level Tertinggi)

**Akses**: `/views/manager`

#### Fungsi Utama:
- **Overview & Dashboard**
  - Melihat semua penugasan dari semua supervisor
  - Monitoring performa operasional perusahaan
  - Laporan konsolidasi dari seluruh proyek

- **Laporan Komprehensif**
  - Akses ke semua laporan progres
  - Analisis data operasional
  - Export dan reporting untuk manajemen

- **View-Only Access**
  - Manager lebih fokus pada monitoring dan analisis
  - Tidak melakukan assignment langsung ke teknisi
  - Menerima notifikasi penting tentang status proyek

**Halaman Manager:**
```
/views/manager/
  ├── page.tsx         → Dashboard overview
  ├── overview/        → Statistik keseluruhan
  └── laporan/         → Laporan konsolidasi
```

---

### 2. **SUPERVISOR** (Koordinator Lapangan)

**Akses**: `/views/spv`

#### Fungsi Utama:

##### A. **Manajemen Penugasan** 📋
- **Membuat penugasan baru (SPK - Surat Perintah Kerja)**
  - Input judul penugasan
  - Pilih lokasi dengan GPS/map picker
  - Tentukan kategori: Rekonstruksi, Instalasi, atau Perawatan
  - Set tanggal mulai dan deadline
  - Frekuensi laporan: Harian atau Mingguan

- **Assign Teknisi ke Penugasan**
  - Pilih satu atau lebih teknisi
  - Relasi many-to-many (1 penugasan bisa punya banyak teknisi)

- **Assign Alat/Equipment**
  - Allocate tools dari inventory
  - System otomatis mengurangi stok tersedia
  - Track peminjaman alat (dengan foto ambil/kembali)

##### B. **Monitoring & Validasi** 🔍
- **Real-time Tracking**
  - Melihat status kehadiran teknisi (Belum Mulai, Sedang Dikerjakan, Selesai)
  - Tracking lokasi GPS saat teknisi mulai kerja
  - Monitoring progres harian/mingguan

- **Validasi Laporan**
  - Review laporan progres dari teknisi
  - Approve/reject perpanjangan deadline
  - Validasi foto before-after pekerjaan

##### C. **Manajemen Perpanjangan** ⏱️
- Menerima request perpanjangan dari teknisi
- Review alasan (Cuaca, Akses, Teknis, Lain)
- Approve atau reject dengan catatan
- Update deadline jika disetujui

##### D. **Manajemen User** 👤
- Tambah akun teknisi, supervisor, atau manager baru
- Edit profil user
- Soft delete (nonaktifkan) user

##### E. **Manajemen Inventaris** 🛠️
- CRUD alat/equipment
- Update stok total dan stok tersedia
- Track peminjaman dan pengembalian

**Halaman Supervisor:**
```
/views/spv/
  ├── page.tsx           → Dashboard supervisor
  ├── penugasan/         → List & CRUD penugasan
  ├── users/             → Manajemen user
  ├── inventaris/        → Manajemen alat
  └── laporan/           → Review & validasi laporan teknisi ← UPDATED!
      └── validasi/      → List laporan perlu validasi (NEW!)
```

**API Endpoints untuk Supervisor:**
- `GET /api/penugasan` - List penugasan milik supervisor
- `POST /api/penugasan` - Create penugasan baru
- `POST /api/penugasan/[id]/assign-teknisi` - Assign teknisi
- `POST /api/penugasan/[id]/assign-alat` - Assign alat
- `POST /api/penugasan/[id]/approve-selesai` - Final approve penugasan ← NEW!
- `GET /api/supervisor/laporan-validasi` - List laporan perlu validasi ← NEW!
- `POST /api/laporan/[id]/validasi` - Validasi laporan (approve/reject) ← NEW!
- `GET /api/laporan/[id]/validasi` - Get validation status ← NEW!
- `GET /api/supervisor/users` - List users
- `GET /api/alat` - List alat

---

### 3. **TEKNISI** (Pekerja Lapangan)

**Akses**: `/views/teknisi`

#### Fungsi Utama:

##### A. **Melihat Penugasan** 📱
- List semua penugasan yang di-assign ke dirinya
- Filter berdasarkan:
  - Status validasi (Aktif, Menunggu Validasi, Selesai, dll)
  - Status progres (Belum Mulai, Sedang Dikerjakan, Selesai)
  - Search by judul
- Lihat detail penugasan (lokasi, deadline, alat yang dipinjam)

##### B. **Mulai Kerja** 🚀
- **Start Work Dialog**
  - Teknisi harus "check-in" dengan GPS
  - System record:
    - `started_at`: timestamp mulai
    - `start_location`: koordinat GPS
  - Status kehadiran berubah jadi "Sedang Dikerjakan"

##### C. **Laporan Progres** 📊
- **Daily/Weekly Progress Report**
  - Upload foto progres
  - Input persentase penyelesaian (0-100%)
  - Pilih status: Menunggu, Sedang Dikerjakan, Hampir Selesai, Selesai
  - Tambah catatan/komentar
  - Koordinat GPS otomatis diambil

- **Foto Before-After (Bukti Selesai)**
  - Saat status "Selesai", wajib upload foto before-after
  - Foto dipasangkan (pair) dengan `pair_key` yang sama
  - Setiap pair bisa punya judul & deskripsi
  - Contoh: "Instalasi Kabel - Before", "Instalasi Kabel - After"

##### D. **Return Tools** 🔧
- Saat pekerjaan selesai, kembalikan alat
- Upload foto pengembalian
- System otomatis:
  - Update `is_returned = true`
  - Kembalikan stok ke inventory (`stok_tersedia` naik)

##### E. **Request Perpanjangan** ⏰
- **Kendala Dialog**
  - Pilih tipe kendala: Cuaca, Akses, Teknis, Lain
  - Tulis alasan detail
  - Upload foto bukti (opsional)
  - Request durasi tambahan (dalam menit)
  - Submit ke supervisor untuk approval

##### F. **Finish Work** ✅
- Saat semua selesai:
  - Upload laporan final
  - Return semua alat
  - System update status penugasan → "Menunggu Validasi"
  - Supervisor review dan approve

**Halaman Teknisi:**
```
/views/teknisi/
  ├── page.tsx           → List penugasan & filter
  ├── [id]/              → Detail penugasan spesifik
  ├── alat/              → List alat yang dipinjam
  └── laporan/           → History laporan
```

**API Endpoints untuk Teknisi:**
- `GET /api/teknisi/penugasan` - List penugasan assigned ke teknisi
- `POST /api/penugasan/[id]/start` - Mulai kerja (check-in GPS)
- `POST /api/penugasan/[id]/laporan` - Submit laporan progres
- `POST /api/penugasan/[id]/finish` - Finish work
- `POST /api/perpanjangan` - Request perpanjangan

---

## 🔁 Ringkasan Alur Bisnis (Flowchart) — Rapi & Terverifikasi

Mermaid diagram (visual) — fokus pada proses bisnis (tanpa API):

```mermaid
flowchart TD
  SUP[Supervisor]
  SUP --> CREATE[Buat Penugasan\n(SPK)\n- Pilih kategori, lokasi, tanggal]
  CREATE --> ASSIGN[Assign Teknisi & Alat\n- Cek stok, buat peminjaman]
  ASSIGN --> TECH[Teknisi ditugaskan]
  TECH --> START[Teknisi Mulai Kerja\n- GPS check-in]
  START --> WORK[Pelaksanaan Pekerjaan]
  WORK --> REPORT[Teknisi Submit Laporan\n(progress / before-after foto)]
  REPORT --> VALID{Supervisor Validasi?}
  VALID -->|Disetujui| FINAL{Laporan Final & Semua Final Disetujui?}
  FINAL -->|Ya| COMPLETE[Selesaikan Penugasan\n- Supervisor finalize]
  FINAL -->|Tidak| CONTINUE[Teruskan Pekerjaan]
  VALID -->|Ditolak| RESUBMIT[Teknisi Submit Ulang Laporan]
  RESUBMIT --> REPORT
  COMPLETE --> RETURN[Return Alat & Restock]
  RETURN --> CLOSED[Penugasan Selesai]
  CONTINUE --> WORK
  REPORT --> PERI{Perlu Perpanjangan?}
  PERI -->|Ya| REQ[Permintaan Perpanjangan oleh Teknisi]
  REQ --> DEC{Supervisor Approve Perpanjangan?}
  DEC -->|Approve| EXT[Update deadline → Lanjutkan pekerjaan]
  DEC -->|Reject| NOTIF[Notifikasi ke Teknisi]
  NOTIF --> REPORT
  MAN[Manager (view-only)] --> MON[Monitoring & Analisis]
  MON --> MAN
```

ASCII fallback (proses bisnis, ringkas):

```
Supervisor → Buat Penugasan (SPK)
  ↓
Assign Teknisi & Alat (cek stok → buat peminjaman)
  ↓
Teknisi Mulai Kerja (GPS check-in)
  ↓
Pelaksanaan Pekerjaan
  ↓
Teknisi Submit Laporan (progress / before-after)
  ↓
Supervisor Validasi:
  - Jika Disetujui:
    - Jika laporan final & semua final disetujui → Selesaikan Penugasan → Return Alat & Restock → Selesai
    - Jika bukan final → Lanjutkan pekerjaan
  - Jika Ditolak: Teknisi submit ulang (loop)

Tambahan: Teknisi bisa request perpanjangan → Supervisor approve/reject (jika approve update deadline)
Manager: view-only (monitoring & analisis)
```

**Lokasi file views (lengkap & komponen terkait):**

Akan tampil per role — setiap entri memuat path view dan komponen-komponen utama yang digunakan (sub-list dari `components/`):

- `app/views/layout.tsx` — Layout global untuk area `views`
  - Komponen terkait: `app/views/components/Navbar.tsx`, `app/views/components/Footer.tsx`

- `app/views/page.tsx` — Halaman index untuk area `views`

- Manager
  - `app/views/manager/page.tsx` — Manager dashboard overview
    - Komponen terkait: `components/dashboard/DashboardHeader.tsx`, `components/dashboard/StatCard.tsx`, `components/notification-bell.tsx`
  - `app/views/manager/penugasan/page.tsx` — Manager penugasan list
    - Komponen terkait: `components/penugasan/*` (listing cards, filters)
  - `app/views/manager/penugasan/[id]/page.tsx` — Manager penugasan detail (view-only)
    - Komponen terkait: `components/penugasan/detail-penugasan/penugasan-detail-header-manager.tsx`, `components/penugasan/detail-penugasan/penugasan-detail-progress-manager.tsx`, `components/laporan-detail/*`
  - `app/views/manager/laporan/[id]/page.tsx` — Manager laporan detail/list
    - Komponen terkait: `components/laporan-detail/*`

- Supervisor (SPV)
  - `app/views/spv/page.tsx` — Supervisor dashboard overview
    - Komponen terkait: `components/dashboard/DashboardHeader.tsx`, `components/dashboard/StatCard.tsx`
  - `app/views/spv/penugasan/page.tsx` — Supervisor penugasan list & create
    - Komponen terkait: `components/penugasan/create-penugasan/*` (`create-penugasan-wizard.tsx`, `step-1-spk.tsx`, `step-2-teknisi.tsx`, `step-3-alat.tsx`)
  - `app/views/spv/penugasan/[id]/page.tsx` — Supervisor penugasan detail (edit/assign)
    - Komponen terkait:
      - Header & actions: `components/penugasan/detail-penugasan/penugasan-detail-header.tsx`
      - Overview & sections: `components/penugasan/detail-penugasan/penugasan-detail-overview.tsx`, `penugasan-detail-teknisi.tsx`, `penugasan-detail-alat.tsx`, `penugasan-detail-progress.tsx`
      - Assign dialogs: `components/penugasan/assign/assign-teknisi-dialog.tsx`, `components/penugasan/assign/assign-alat-dialog.tsx`
      - Validasi laporan dialog: `components/penugasan/validasi-laporan-dialog.tsx`
  - `app/views/spv/laporan/page.tsx` & `app/views/spv/laporan/validasi/page.tsx` — Laporan & validasi
    - Komponen terkait: `components/validasi-laporan/LaporanList.tsx`, `components/validasi-laporan/ValidationDialog.tsx`, `components/laporan-detail/*`
  - `app/views/spv/inventaris/page.tsx` — Inventaris (alat)
    - Komponen terkait: `components/alat/alat-list.tsx`, `components/alat/add-alat-dialog.tsx`, `components/alat/edit-alat-dialog.tsx`

- Teknisi
  - `app/views/teknisi/page.tsx` — Teknisi dashboard / assignment list
    - Komponen terkait: `components/teknisi/assignment-card.tsx`, `components/notification-bell.tsx`
  - `app/views/teknisi/penugasan/[id]/page.tsx` — Teknisi penugasan detail (reporting)
    - Komponen terkait: `components/teknisi/penugasan-detail.tsx`, `components/teknisi/progress-dialog.tsx`, `components/teknisi/return-tools-dialog.tsx`, `components/teknisi/kendala-dialog.tsx`, `components/laporan-detail/*`
  - `app/views/teknisi/alat/page.tsx` — Daftar alat yang dipinjam
    - Komponen terkait: `components/alat/*`, `components/teknisi/return-tools-dialog.tsx`

- Users & Profil
  - `app/views/spv/users/page.tsx`, `app/views/manager/users/page.tsx` — User management
    - Komponen terkait: `components/user/users-list.tsx`, `components/user/add-user-dialog.tsx`, `components/user/edit-user-dialog.tsx`

- Shared / Utilities
  - Map & location components used across views: `components/shared/report-location-map.tsx`
  - Laporan detail components: `components/laporan-detail/*` (AssignedTechniciansCard, LocationCard, PhotoPairsCard, etc.)

**Lokasi file API (utama, diverifikasi di `app/`):**

- `app/api/penugasan/route.ts` — list/create penugasan (GET/POST)
- `app/api/penugasan/[id]/route.ts` — get/update specific penugasan
- `app/api/penugasan/[id]/assign-teknisi/route.ts` — assign teknisi
- `app/api/penugasan/[id]/assign-alat/route.ts` — assign alat / create peminjaman
- `app/api/penugasan/[id]/start/route.ts` — start work (GPS check-in)
- `app/api/penugasan/[id]/laporan/route.ts` — submit laporan progres
- `app/api/penugasan/[id]/approve-selesai/route.ts` — final approval to finish penugasan
- `app/api/penugasan/[id]/alat/[alatId]/return/route.ts` — return alat endpoint
- `app/api/laporan/[id]/route.ts` — laporan detail endpoints
- `app/api/laporan/[id]/validasi/route.ts` — endpoint for supervisor to validate laporan
- `app/api/supervisor/laporan-validasi/route.ts` — list laporan perlu validasi for supervisor
- `app/api/manager/penugasan/route.ts` — manager penugasan listing
- `app/api/manager/penugasan/[id]/route.ts` — manager view detail
- `app/api/manager/laporan/route.ts` — manager laporan listing
- `app/api/manager/laporan/[id]/route.ts` — manager laporan detail
- `app/api/alat/route.ts` — list/tools CRUD
- `app/api/alat/[id]/route.ts` — alat detail
- `app/api/perpanjangan/[id]/route.ts` — perpanjangan request handling
- `app/api/teknisi/penugasan/route.ts` — teknisi's assignment list
- `app/api/teknisi/penugasan/[id]/route.ts` — teknisi assignment detail
- `app/api/teknisi/laporan/[id]/route.ts` — teknisi laporan detail
- `app/api/upload/alat-foto/route.ts` — upload alat foto (storage)
- `app/api/notifikasi/route.ts` — notifikasi endpoints
- `app/api/profil/route.ts` — profil endpoints

Poin penting:
- Semua perubahan stok di-handle secara transaksi (SELECT FOR UPDATE).
- Notifikasi otomatis dikirim saat status berubah (laporan ditolak/disetujui, penugasan selesai).
- Endpoint kunci dicantumkan di setiap langkah untuk referensi cepat.

---

## **🔄 Alur Kerja Lengkap (Workflow) - UPDATED**

> **PENTING**: Setiap laporan progres dari teknisi **WAJIB divalidasi** oleh supervisor sebelum dianggap sah!

### **PHASE 1: Pembuatan Penugasan**

```
1. Supervisor masuk ke /views/spv/penugasan
2. Klik "Buat Penugasan Baru"
3. Wizard 3 Step:
   
   STEP 1 - Data SPK:
   ├── Input judul penugasan
   ├── Pilih lokasi (map picker dengan Leaflet)
   ├── Pilih kategori (Rekonstruksi/Instalasi/Perawatan)
   ├── Set start_date dan end_date
   └── Frekuensi laporan otomatis terset based on kategori
   
   STEP 2 - Assign Teknisi:
   ├── List teknisi available
   ├── Select multiple teknisi
   └── Teknisi bisa kerja bareng (team work)
   
   STEP 3 - Assign Alat:
   ├── Pilih alat dari inventory
   ├── Input jumlah yang dipinjam
   ├── System cek stok_tersedia >= jumlah
   ├── Upload foto saat ambil alat
   └── Stok otomatis dikurangi
   
4. Submit → Penugasan dibuat dengan status "Aktif"
5. System insert ke:
   ├── penugasan (record utama)
   ├── penugasan_teknisi (many-to-many)
   └── peminjaman_alat (tracking peminjaman)
```

---

### **PHASE 2: Teknisi Mulai Kerja**

```
1. Teknisi login & buka /views/teknisi
2. Lihat list penugasan yang di-assign
3. Klik penugasan → Detail page
4. Klik "Mulai Kerja"
   
   Start Work Dialog:
   ├── System request GPS permission
   ├── Capture koordinat lat/lng
   ├── POST /api/penugasan/[id]/start
   └── Insert/update ke kehadiran_teknisi:
       • started_at: now()
       • start_location: POINT(lng, lat)
       • status: "Sedang Dikerjakan"
       
5. Status di card berubah → "Sedang Dikerjakan"
```

---

### **PHASE 3: Laporan Progres Berkala**

```
Teknisi wajib lapor sesuai frekuensi (Harian/Mingguan)

1. Klik "Kirim Laporan Progres"
2. Progress Dialog:
   ├── Upload foto (max 5MB)
   ├── Input persentase (slider 0-100%)
   ├── Pilih status: Menunggu / Sedang Dikerjakan / Hampir Selesai / Selesai
   ├── Tulis catatan
   └── GPS otomatis diambil
   
3. Bukti Foto Before-After:
   ├── Wajib upload foto Before-After
   ├── Bisa multiple pairs (Instalasi Kabel, Cat Dinding, dll)
   └── Setiap pair:
       • Before photo
       • After photo
       • Judul pair
       • Deskripsi
   
4. Submit laporan:
   ├── POST /api/penugasan/[id]/laporan
   ├── Insert ke laporan_progres dengan status_validasi = "Menunggu"
   ├── Insert pairs ke bukti_laporan (jika selesai)
   ├── Notifikasi otomatis ke supervisor
   └── ⚠️ STATUS PENUGASAN TETAP "Aktif" (belum berubah)
```

---

### **PHASE 3.5: VALIDASI LAPORAN oleh Supervisor**

```
Supervisor harus validasi setiap laporan sebelum dianggap sah:

1. Supervisor buka dashboard → "Laporan Perlu Validasi"
   Badge merah muncul: "5 Laporan Menunggu"

2. List laporan dengan filter:
   ├── Status: Menunggu / Disetujui / Ditolak
   ├── Penugasan tertentu
   └── Sort by tanggal

3. Supervisor review laporan:
   ├── Lihat foto bukti (klik untuk zoom)
   ├── Cek GPS location (tampil di map)
   ├── Baca catatan teknisi
   └── Jika status "Selesai", lihat foto before-after

4. Supervisor decide:
   
   APPROVE (Disetujui):
   ├── POST /api/laporan/[id]/validasi
   ├── Body: { status_validasi: "Disetujui" }
   ├── Update laporan_progres:
   │   • status_validasi = "Disetujui"
   │   • divalidasi_oleh = supervisor_id
   │   • divalidasi_pada = now()
   └── Badge hijau: "✓ Disetujui"
   
   REJECT (Ditolak):
   ├── POST /api/laporan/[id]/validasi
   ├── Body: { 
   │     status_validasi: "Ditolak",
   │     catatan_validasi: "Foto kurang jelas, ulangi..."
   │   }
   ├── Update laporan_progres:
   │   • status_validasi = "Ditolak"
   │   • catatan_validasi = alasan penolakan
   ├── Notifikasi ke teknisi dengan alasan
   └── Teknisi harus submit laporan baru

5. Jika laporan final (status_progres="Selesai") disetujui:
   ├── System cek: Apakah semua laporan sudah disetujui?
   ├── Jika YA → status_penugasan = "Menunggu Validasi"
   └── Jika TIDAK → status tetap "Aktif"
```

---

### **PHASE 4: Pengembalian Alat**

```
Saat pekerjaan selesai atau alat tidak dipakai lagi:

1. Teknisi klik "Kembalikan Alat"
2. Return Tools Dialog:
   ├── List alat yang belum dikembalikan
   ├── Pilih alat yang mau dikembalikan
   ├── Upload foto kondisi alat saat dikembalikan
   └── Submit
   
3. System:
   ├── Update peminjaman_alat.is_returned = true
   ├── Update peminjaman_alat.returned_at = now()
   ├── Update peminjaman_alat.foto_kembali_url
   └── Kembalikan stok:
       UPDATE alat 
       SET stok_tersedia = stok_tersedia + jumlah
       WHERE id = alat_id
```

---

### **PHASE 5: Request Perpanjangan (Opsional)**

```
Jika teknisi butuh waktu lebih (kendala lapangan):

1. Klik "Laporkan Kendala"
2. Kendala Dialog:
   ├── Pilih tipe: Cuaca / Akses / Teknis / Lain
   ├── Tulis alasan detail
   ├── Upload foto (opsional)
   ├── Request durasi tambahan (menit)
   └── Submit
   
3. System:
   ├── POST /api/perpanjangan
   ├── Insert ke perpanjangan_penugasan
   ├── status = "Menunggu"
   └── Notifikasi ke supervisor
   
4. Supervisor review:
   ├── Buka list perpanjangan
   ├── Lihat alasan & foto
   └── Approve atau Reject:
       
       APPROVE:
       ├── Update perpanjangan_penugasan.status = "Disetujui"
       ├── Update penugasan.end_date += durasi
       ├── Update penugasan.is_extended = true
       └── Notifikasi ke teknisi
       
       REJECT:
       ├── Update perpanjangan_penugasan.status = "Ditolak"
       ├── Input alasan penolakan
       └── Notifikasi ke teknisi
```

---

### **PHASE 6: Final Approval Penugasan (UPDATED)**

```
Kondisi: Semua laporan sudah divalidasi, laporan final disetujui
Status penugasan: "Menunggu Validasi"

1. Supervisor buka detail penugasan
   ├── Lihat timeline semua laporan (semua status validasi)
   ├── Summary:
   │   • Total laporan: 7
   │   • Disetujui: 7 ✓
   │   • Ditolak: 0
   │   • Menunggu: 0
   └── Tombol: "Selesaikan Penugasan" (enabled)

2. Supervisor klik "Selesaikan Penugasan"
   ├── Konfirmasi dialog
   └── Submit

3. System validation:
   ├── RPC: cek_penugasan_siap_selesai(penugasan_id)
   ├── Cek: Semua laporan disetujui? ✓
   ├── Cek: Tidak ada laporan ditolak? ✓
   └── Cek: Ada minimal 1 laporan? ✓

4. POST /api/penugasan/[id]/approve-selesai
   ├── Update penugasan.status = "Selesai"
   ├── Update semua kehadiran_teknisi.status = "Selesai"
   ├── Log aktivitas
   └── Notifikasi ke semua teknisi & manager

5. Result:
   ├── Badge hijau: "✓ Selesai"
   ├── Penugasan locked (read-only)
   ├── Teknisi dapat notifikasi
   └── Manager bisa lihat di dashboard
```

---

### **IMPORTANT: Alur Jika Laporan Ditolak**

```
Scenario: Supervisor reject laporan karena foto blur/tidak sesuai

1. Supervisor tolak laporan:
   ├── status_validasi = "Ditolak"
   └── catatan: "Foto terlalu gelap, ambil ulang di siang hari"

2. Teknisi terima notifikasi:
   "Laporan Anda untuk penugasan 'X' ditolak. Alasan: ..."

3. Teknisi harus submit LAPORAN BARU:
   ├── Tidak bisa edit laporan yang ditolak
   ├── Buat laporan baru dengan tanggal yang sama
   ├── Upload foto baru yang lebih jelas
   └── Submit → status_validasi = "Menunggu" lagi

4. Supervisor validasi ulang:
   ├── Review laporan baru
   └── Approve atau reject lagi

5. Penugasan BARU bisa selesai jika:
   ✓ Semua laporan (termasuk yang baru) disetujui
   ✓ Tidak ada laporan yang masih ditolak/menunggu
```

---

## 🗄️ Database Schema (Tabel Utama)

### **1. profil** (extend auth.users)
```sql
- id (UUID) → Foreign key ke auth.users
- nama (VARCHAR)
- peran (ENUM: Supervisor, Manager, Teknisi)
- is_deleted (BOOLEAN)
```

### **2. penugasan** (SPK)
```sql
- id (SERIAL PRIMARY KEY)
- judul (VARCHAR)
- lokasi (GEOGRAPHY POINT) → GPS coordinates
- kategori (ENUM: Rekonstruksi, Instalasi, Perawatan)
- frekuensi_laporan (ENUM: Harian, Mingguan)
- supervisor_id (UUID) → FK to profil
- start_date, end_date (DATE)
- is_extended (BOOLEAN)
- status (ENUM: Aktif, Selesai, Dibatalkan, Menunggu Validasi, Ditolak)
- is_deleted (BOOLEAN)
```

### **3. penugasan_teknisi** (Many-to-Many)
```sql
- id (SERIAL PRIMARY KEY)
- penugasan_id (INT) → FK to penugasan
- teknisi_id (UUID) → FK to profil
- UNIQUE(penugasan_id, teknisi_id)
```

### **4. kehadiran_teknisi** (Tracking Start/Finish)
```sql
- id (SERIAL PRIMARY KEY)
- penugasan_id, teknisi_id
- started_at (TIMESTAMP)
- start_location (GEOGRAPHY POINT)
- last_checkin_at (TIMESTAMP)
- finished_at (TIMESTAMP)
- finish_location (GEOGRAPHY POINT)
- status (ENUM: Belum Mulai, Sedang Dikerjakan, Selesai)
```

### **5. alat** (Master Inventory)
```sql
- id (SERIAL PRIMARY KEY)
- nama (VARCHAR)
- stok_total (INT)
- stok_tersedia (INT)
- is_deleted (BOOLEAN)
```

### **6. peminjaman_alat** (Tool Borrowing)
```sql
- id (SERIAL PRIMARY KEY)
- penugasan_id, alat_id
- jumlah (INT)
- peminjam_id (UUID) → FK to profil
- foto_ambil_url, foto_kembali_url (TEXT) → Supabase Storage URL
- is_returned (BOOLEAN)
- returned_at (TIMESTAMP)
```

### **7. laporan_progres** (Progress Reports) - UPDATED
```sql
- id (SERIAL PRIMARY KEY)
- penugasan_id (INT)
- pelapor_id (UUID)
- tanggal_laporan (DATE)
- persentase_progres (INT 0-100)
- status_progres (ENUM: Menunggu, Sedang Dikerjakan, Hampir Selesai, Selesai)
- foto_url (TEXT)
- titik_gps (GEOGRAPHY POINT)
- catatan (TEXT)
- status_validasi (ENUM: Menunggu, Disetujui, Ditolak) ← NEW!
- divalidasi_oleh (UUID) → FK to profil ← NEW!
- divalidasi_pada (TIMESTAMP) ← NEW!
- catatan_validasi (TEXT) ← NEW!
```

### **8. bukti_laporan** (Before-After Photos)
```sql
- id (SERIAL PRIMARY KEY)
- laporan_id (INT) → FK to laporan_progres
- pair_key (UUID) → Group before & after
- tipe (ENUM: Before, After)
- judul, deskripsi (TEXT)
- foto_url (TEXT)
- taken_at (TIMESTAMP)
- taken_by (UUID)
- metadata (JSONB)
```

### **9. perpanjangan_penugasan** (Extension Requests)
```sql
- id (SERIAL PRIMARY KEY)
- penugasan_id (INT)
- pemohon_id (UUID) → Teknisi yang request
- tanggal_permintaan (TIMESTAMP)
- alasan (TEXT)
- foto_url (TEXT)
- durasi_diminta (INTERVAL)
- durasi_menit (INT)
- tipe_kendala (ENUM: Cuaca, Akses, Teknis, Lain)
- catatan_spv (TEXT)
- ditolak_alasan (TEXT)
- disetujui_oleh (UUID)
- disetujui_pada (TIMESTAMP)
- status (ENUM: Menunggu, Disetujui, Ditolak)
```

### **10. notifikasi**
```sql
- id (SERIAL PRIMARY KEY)
- penerima_id (UUID)
- pesan (TEXT)
- status (ENUM: Belum Dibaca, Dibaca)
```

### **11. log_aktivitas** (Audit Trail)
```sql
- id (SERIAL PRIMARY KEY)
- pengguna_id (UUID)
- aksi (VARCHAR)
- deskripsi (TEXT)
- created_at (TIMESTAMP)
```

---

## 🔐 Fitur Keamanan & Validasi

### **1. Authentication**
- Supabase Auth dengan email/password
- Row Level Security (RLS) di Supabase
- Middleware untuk protect routes

### **2. Authorization**
- Supervisor hanya bisa akses penugasan yang dibuat sendiri
- Teknisi hanya bisa akses penugasan yang di-assign ke dirinya
- Manager bisa view all (read-only)

### **3. Storage Security (Supabase Storage Policies)** 🔐

Bucket: `laporan-progres`

**Policy yang harus di-setup:**

```sql
-- 1. Teknisi upload foto laporan mereka sendiri
CREATE POLICY "Teknisi dapat upload laporan sendiri"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'laporan-progres' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Teknisi baca foto laporan mereka sendiri
CREATE POLICY "Teknisi dapat baca laporan sendiri"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'laporan-progres' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Supervisor & Manager bisa baca SEMUA foto ← PENTING!
CREATE POLICY "Supervisor dan Manager dapat baca semua laporan"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'laporan-progres' AND
  EXISTS (
    SELECT 1 FROM profil
    WHERE profil.id = auth.uid()
    AND profil.peran IN ('Supervisor', 'Manager')
  )
);

-- 4. Supervisor bisa delete foto (optional)
CREATE POLICY "Supervisor dapat delete foto laporan"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'laporan-progres' AND
  EXISTS (
    SELECT 1 FROM profil
    WHERE profil.id = auth.uid()
    AND profil.peran = 'Supervisor'
  )
);
```

### **4. GPS Validation**
- Start work wajib GPS
- Laporan progres otomatis capture GPS
- Validasi akurasi GPS (high accuracy mode)

### **5. File Upload**
- Upload ke Supabase Storage bucket
- Validasi:
  - Max 5MB per file
  - Accept: image/jpeg, image/png, image/webp
- Generate unique filename dengan timestamp
- Path structure: `{userId}/{assignmentId}/{timestamp}-{filename}`

### **6. Inventory Management**
- Transaction di database (prevent race condition)
- Function `pinjam_alat()` pakai `SELECT FOR UPDATE`
- Auto rollback jika stok tidak cukup

### **7. Laporan Validation** ✨ NEW!
- Setiap laporan wajib divalidasi supervisor
- Status validasi: Menunggu → Disetujui/Ditolak
- Notifikasi otomatis ke teknisi jika ditolak
- Penugasan baru bisa selesai jika semua laporan disetujui

---

## 📂 Struktur Project

```
coral-ops/
├── app/
│   ├── api/                    → API Routes
│   │   ├── penugasan/          → CRUD penugasan
│   │   ├── teknisi/            → Teknisi endpoints
│   │   ├── supervisor/         → Supervisor endpoints
│   │   ├── alat/               → Inventory management
│   │   └── perpanjangan/       → Extension requests
│   │
│   ├── views/                  → Protected pages
│   │   ├── manager/            → Manager dashboard
│   │   ├── spv/                → Supervisor pages
│   │   └── teknisi/            → Teknisi pages
│   │
│   ├── auth/                   → Auth pages
│   │   ├── login/
│   │   └── update-password/
│   │
│   └── protected/              → General protected area
│
├── components/
│   ├── penugasan/              → Assignment components
│   │   ├── create-penugasan/   → Wizard steps
│   │   ├── assign/             → Assign teknisi & alat
│   │   └── detail-penugasan/   → Detail views
│   │
│   ├── teknisi/                → Teknisi-specific components
│   │   ├── assignment-card.tsx
│   │   ├── start-work-dialog.tsx
│   │   ├── progress-dialog.tsx
│   │   ├── return-tools-dialog.tsx
│   │   └── kendala-dialog.tsx
│   │
│   ├── alat/                   → Inventory components
│   ├── user/                   → User management
│   └── ui/                     → shadcn/ui components
│
├── lib/
│   ├── supabase/               → Supabase clients
│   │   ├── client.ts           → Browser client
│   │   ├── server.ts           → Server client
│   │   └── admin.ts            → Admin client
│   │
│   ├── penugasan/              → Business logic
│   │   ├── types.ts            → TypeScript types
│   │   ├── constants.ts        → Constants
│   │   └── utils.ts            → Helper functions
│   │
│   └── auth.ts                 → Auth helpers
│
├── database/
│   └── database.sql            → Complete DB schema
│
└── public/                     → Static assets
```

---

## 🚀 Cara Menjalankan Project

### **1. Prerequisites**
```bash
- Node.js 18+
- PostgreSQL dengan PostGIS extension
- Supabase account
```

### **2. Setup Database**
```bash
1. Buat project baru di Supabase
2. Jalankan database/database.sql di SQL Editor
3. Enable PostGIS extension
```

### **3. Environment Variables**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### **4. Install & Run**
```bash
npm install
npm run dev
```

Project akan berjalan di `http://localhost:3000`

---

## 📊 Fitur Unggulan

### ✅ **GPS-Based Attendance**
- Check-in/check-out dengan koordinat GPS
- Validasi lokasi kerja
- History tracking

### ✅ **Real-time Progress Tracking**
- Update progres harian/mingguan
- Foto before-after otomatis dipasangkan
- Notifikasi ke supervisor

### ✅ **Smart Inventory Management**
- Auto deduct/return stok
- Photo documentation
- Concurrency-safe transactions

### ✅ **Flexible Extension System**
- Request perpanjangan dengan alasan
- Approval workflow
- Update deadline otomatis

### ✅ **Comprehensive Reporting**
- Progress reports dengan GPS & foto
- Manager dashboard untuk overview
- Export data (future feature)

---

## 🔮 Roadmap (Future Features)

- [ ] Push notifications (PWA)
- [ ] Offline mode untuk teknisi
- [ ] Export laporan ke PDF/Excel
- [ ] Dashboard analytics untuk manager
- [ ] QR code untuk alat
- [ ] Chat antar user
- [ ] Mobile app (React Native)

---

## 📝 Kesimpulan

**Coral-Ops** adalah sistem manajemen operasional yang **lengkap dan terstruktur** untuk perusahaan dengan pekerja lapangan. Dengan **3 role yang jelas** (Manager, Supervisor, Teknisi), sistem ini memfasilitasi:

1. **Supervisor** sebagai koordinator yang membuat & assign penugasan
2. **Teknisi** sebagai executor yang melaporkan progres real-time dengan GPS
3. **Manager** sebagai decision maker yang monitoring keseluruhan operasional

Sistem ini sudah **production-ready** dengan fitur keamanan, validasi, dan database yang robust menggunakan PostGIS untuk geolocation.

---

**Dibuat pada**: 7 Desember 2025  
**Tech Stack**: Next.js 15 + Supabase + PostgreSQL + PostGIS + Tailwind CSS
