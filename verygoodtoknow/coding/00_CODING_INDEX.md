# 🛠️ CORAL-OPS — Coding Tutorial
> Panduan praktis langkah-demi-langkah membangun fitur Coral-Ops dari sisi teknis.

Jika **Tutorial Book** menjelaskan "apa" dan "mengapa", **Coding Tutorial** ini menjelaskan "bagaimana" cara mengimplementasikannya di dalam kode. Ikuti urutan ini untuk membangun aplikasi dari nol.

---

## 🚀 Alur Pengembangan (Development Flow)

```text
STEP 1: DATABASE LAYER
01_DATABASE_DAN_SCHEMA.md
└─ Menyiapkan tabel PostgreSQL & RLS

STEP 2: INFRASTRUCTURE
02_INTEGRASI_SUPABASE_CLIENT.md
└─ Konfigurasi @supabase/ssr & Middleware

STEP 3: BACKEND API
03_PEMBUATAN_API_ROUTES.md
└─ Membuat endpoint GET, POST, & Logic

STEP 4: FRONTEND UI
04_FORM_DAN_COMPONENTS.md
└─ Membangun UI dengan shadcn/ui & Forms

STEP 5: SPECIAL FEATURES
05_INTEGRASI_MAPS_LEAFLET.md
└─ Implementasi Geolocation & Maps

STEP 6: ADVANCED LOGIC
06_LOGIKA_BWM_ENGINE.md
└─ Coding Kalkulator BWM & LP Solver
```

---

## 📖 Daftar Modul Coding

| # | Modul | Fokus Pengembangan |
|---|-------|-------------------|
| 1 | [01_DATABASE_DAN_SCHEMA.md](./01_DATABASE_DAN_SCHEMA.md) | SQL, Tables, Relations, RLS |
| 2 | [02_INTEGRASI_SUPABASE_CLIENT.md](./02_INTEGRASI_SUPABASE_CLIENT.md) | Auth, Env, Client/Server Supabase |
| 3 | [03_PEMBUATAN_API_ROUTES.md](./03_PEMBUATAN_API_ROUTES.md) | Next.js API, Validation, Transactions |
| 4 | [04_FORM_DAN_COMPONENTS.md](./04_FORM_DAN_COMPONENTS.md) | shadcn/ui, Form Hook, Server Actions |
| 5 | [05_INTEGRASI_MAPS_LEAFLET.md](./05_INTEGRASI_MAPS_LEAFLET.md) | Geolocation API, Leaflet Integration |
| 6 | [06_LOGIKA_BWM_ENGINE.md](./06_LOGIKA_BWM_ENGINE.md) | TS Logic, LP Solver, MCDM Calculator |

---

## 🛠️ Tools yang Diperlukan
1. **VS Code**: Editor utama.
2. **Supabase CLI**: Untuk mengelola database lokal (opsional).
3. **Postman / Insomnia**: Untuk testing API routes.
4. **Git**: Untuk version control.

---

_Ayo mulai coding dari langkah pertama!_
[01 — Database dan Schema](./01_DATABASE_DAN_SCHEMA.md)
