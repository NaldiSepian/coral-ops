# 📚 CORAL-OPS — Tutorial Book
> Panduan lengkap memahami sistem manajemen operasional CV. Coral berbasis Next.js 15 dan Supabase.

Dokumen ini adalah **indeks utama** dari tutorial book Coral-Ops. Tutorial ini dirancang untuk membantu pengembang memahami bagaimana membangun aplikasi manajemen lapangan yang kompleks dengan fitur GPS, foto bukti, dan alur validasi.

---

## 🗺️ Peta Belajar (Learning Path)

```
CORE ARCHITECTURE                   BUSINESS LOGIC
─────────────────                   ──────────────
01_ARSITEKTUR_NEXTJS15.md           04_ALUR_KERJA_PENUGASAN.md
  └─ Next.js 15 App Router            └─ Wizard Create Penugasan
  └─ React 19 & TypeScript            └─ Assign Teknisi & Alat
  └─ shadcn/ui Components             └─ Inventory Management

02_SUPABASE_DAN_AUTH.md             05_PELAPORAN_DAN_VALIDASI.md
  └─ Supabase SSR Integration         └─ Progres Laporan (Teknisi)
  └─ Role-Based Access (RLS)          └─ Foto Before/After Pair
  └─ Middleware Guard                 └─ Validation Workflow (SPV)

03_DATABASE_SCHEMA_DAN_API.md       06_MAPS_DAN_STORAGE.md
  └─ PostGIS (Geolocation)            └─ Leaflet Maps Integration
  └─ Next.js API Routes               └─ Supabase Storage (Photos)
  └─ PostgreSQL Schema                └─ PDF Report Generation

07_PENGGAJIAN_METODE_BWM.md
  └─ Best-Worst Method (BWM)
  └─ LP Solver & Consistency
  └─ Perhitungan Tunjangan
```

---

## 📖 Daftar Bab

| # | File | Topik Utama | Estimasi |
|---|------|-------------|----------|
| 1 | [01_ARSITEKTUR_NEXTJS15.md](./01_ARSITEKTUR_NEXTJS15.md) | App Router, Server Components, shadcn/ui | 30 menit |
| 2 | [02_SUPABASE_DAN_AUTH.md](./02_SUPABASE_DAN_AUTH.md) | Auth Flow, Middleware, Role Access | 25 menit |
| 3 | [03_DATABASE_SCHEMA_DAN_API.md](./03_DATABASE_SCHEMA_DAN_API.md) | Schema PostgreSQL, API Routes, Geolocation | 40 menit |
| 4 | [04_ALUR_KERJA_PENUGASAN.md](./04_ALUR_KERJA_PENUGASAN.md) | Form Wizard, Penjadwalan, Logistik | 35 menit |
| 5 | [05_PELAPORAN_DAN_VALIDASI.md](./05_PELAPORAN_DAN_VALIDASI.md) | Evidence Reporting, Approval Flow | 45 menit |
| 6 | [06_MAPS_DAN_STORAGE.md](./06_MAPS_DAN_STORAGE.md) | Leaflet, Storage Bucket, PDF Lib | 30 menit |
| 7 | [07_PENGGAJIAN_METODE_BWM.md](./07_PENGGAJIAN_METODE_BWM.md) | BWM Logic, LP Solver, Payroll | 45 menit |
| 8 | [GLOSARIUM.md](./GLOSARIUM.md) | Istilah teknis & singkatan proyek | 10 menit |

**Total estimasi: ±4.5 jam belajar aktif.**

---

## 🧠 Prasyarat
- **Next.js 14/15**: Paham perbedaan `page.tsx` dan `layout.tsx`.
- **TypeScript**: Paham interface dan type safety.
- **Supabase**: Dasar-dasar CRUD dan konsep Auth.
- **Tailwind CSS**: Dasar-dasar utility-first styling.

---

## 💡 Cara Membaca Tutorial Ini
1. **Ikuti urutan**: Mulai dari Bab 1 untuk pondasi, lalu lanjut ke Bab 2 & 3 untuk data layer.
2. **Lihat Kode**: Sambil membaca, buka folder `app/`, `components/`, dan `lib/` untuk melihat implementasi nyatanya.
3. **Praktek**: Cobalah melakukan perubahan kecil pada UI atau logika API untuk melihat efeknya.

_Coral-Ops Tutorial Book — Dokumentasi Teknis Internal._
