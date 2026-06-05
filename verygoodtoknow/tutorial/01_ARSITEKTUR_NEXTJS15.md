# 01 — Arsitektur Next.js 15
> Memahami fondasi modern yang digunakan dalam membangun Coral-Ops.

Coral-Ops dibangun menggunakan **Next.js 15**, versi terbaru dari framework React yang membawa perubahan besar dalam cara kita menangani data dan komponen.

---

## 🏗️ Struktur Direktori Utama

Proyek ini mengikuti struktur standar Next.js App Router:

```text
coral-ops/
├── app/                # Induk dari semua route dan logika halaman
│   ├── api/            # Serverless Functions (Backend API)
│   │   └── bwm/        # API untuk perhitungan gaji BWM
│   ├── views/          # Halaman utama aplikasi (Manager, SPV, Teknisi)
│   │   └── manager/    # Dashboard Manager & Penggajian BWM
├── components/         # Komponen UI (reusable)
├── lib/                # Utilitas dan konfigurasi
│   └── bwm/            # Core Engine BWM (LP Solver, Calculator)
└── public/             # Aset statis (Logo, Gambar)
```

---

## ⚛️ Server vs Client Components

Salah satu konsep terpenting di Next.js 15 adalah pemisahan antara komponen yang berjalan di server dan di browser.

### 1. Server Components (Default)
Secara default, semua file di dalam folder `app/` adalah Server Components. 
- **Kelebihan**: Lebih cepat, lebih aman (bisa akses database langsung), dan ukuran JavaScript yang dikirim ke browser lebih kecil.
- **Contoh**: `app/views/manager/page.tsx` biasanya adalah server component yang melakukan fetching data dari API.

### 2. Client Components
Ditandai dengan direktif `"use client"` di baris paling atas file. Digunakan untuk komponen yang butuh interaktivitas.
- **Digunakan untuk**: Form, tombol klik, penggunaan hook seperti `useState` atau `useEffect`, dan peta (Leaflet).
- **Contoh**: `components/penugasan/create-penugasan/step-1-spk.tsx` karena membutuhkan input dari user.

---

## 🎨 Design System: shadcn/ui + Tailwind

Coral-Ops tidak membuat komponen UI dari nol. Kita menggunakan **shadcn/ui** yang dikombinasikan dengan **Tailwind CSS**.

- **shadcn/ui**: Bukan library komponen biasa, tapi sekumpulan komponen yang kodenya bisa kita modifikasi langsung di folder `components/ui`.
- **Tailwind CSS**: Memberikan fleksibilitas styling menggunakan class-class utility langsung di HTML/JSX.
- **Lucide React**: Library ikon yang konsisten digunakan di seluruh aplikasi.

---

## 🛠️ TypeScript: Type Safety

Seluruh kode menggunakan **TypeScript**. Ini memastikan bahwa data yang dikirim antara frontend dan backend memiliki struktur yang jelas, mengurangi bug saat runtime.

- Interface untuk data penting didefinisikan secara eksplisit.
- Membantu auto-complete saat coding di VS Code.

---

**Lanjut ke Bab berikutnya:**
[02 — Supabase dan Autentikasi](./02_SUPABASE_DAN_AUTH.md)
