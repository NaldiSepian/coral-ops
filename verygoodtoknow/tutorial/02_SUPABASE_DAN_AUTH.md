# 02 — Supabase dan Autentikasi
> Bagaimana Coral-Ops menjaga keamanan data dan membagi hak akses pengguna.

Coral-Ops menggunakan **Supabase** sebagai solusi backend-as-a-service (BaaS) untuk menangani autentikasi, database, dan penyimpanan file.

---

## 🔐 Integrasi Supabase SSR

Karena kita menggunakan Next.js App Router, integrasi Supabase dilakukan menggunakan paket `@supabase/ssr`. Ini memungkinkan kita mengakses sesi user baik di **Server** maupun **Client**.

- **Server Client**: Digunakan di API Routes dan Server Components.
- **Browser Client**: Digunakan di Client Components (seperti halaman login).

Konfigurasi client ini dapat ditemukan di folder `lib/supabase/`.

---

## 👤 Role-Based Access Control (RBAC)

Coral-Ops memiliki tiga peran utama yang menentukan apa yang bisa dilihat dan dilakukan oleh user:

1. **MANAGER**
   - Hak akses tertinggi.
   - Bisa memantau semua penugasan dan laporan dari seluruh supervisor.
   - Tidak terlibat dalam teknis lapangan secara langsung.

2. **SUPERVISOR (SPV)**
   - Bertanggung jawab membuat penugasan (SPK).
   - Mengalokasikan teknisi dan alat.
   - Memvalidasi setiap laporan yang dikirim teknisi.

3. **TEKNISI**
   - Ujung tombak di lapangan.
   - Melihat daftar tugas yang diberikan kepadanya.
   - Mengirim laporan progres, foto bukti, dan mengembalikan alat.

Data peran ini disimpan di tabel `profil` yang terhubung dengan `auth.users` milik Supabase.

---

## 🛡️ Middleware Guard

Keamanan rute diatur melalui file `middleware.ts` di root proyek. 

- Setiap request akan diperiksa apakah user sudah login.
- Jika user belum login dan mencoba mengakses halaman internal (area `/views`), mereka akan otomatis dialihkan ke halaman login.
- Middleware juga menangani *refresh token* secara otomatis agar sesi user tetap aktif selama aplikasi dibuka.

---

## 🔐 Row Level Security (RLS)

Selain di level aplikasi (Middleware), keamanan data juga diperketat di level database menggunakan **Supabase RLS**.

- **Supervisor** hanya bisa mengedit data penugasan yang mereka buat sendiri.
- **Teknisi** hanya bisa melihat data penugasan di mana mereka ditugaskan.
- Kebijakan ini memastikan data tidak bocor antar pengguna meskipun mereka memiliki peran yang sama.

---

**Lanjut ke Bab berikutnya:**
[03 — Database Schema dan API](./03_DATABASE_SCHEMA_DAN_API.md)
