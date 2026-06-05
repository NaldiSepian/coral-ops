# Cek Database Supabase via Terminal

> Cara praktis query database Supabase langsung dari terminal tanpa dashboard.

## Prasyarat

- Node.js terinstall
- File `.env.local` berisi credential Supabase
- Package `@supabase/supabase-js` sudah ada di `node_modules`

---

## Method 1: Via Supabase JS Client (Paling Mudah)

### Setup

Buat file helper atau langsung pakai `node -e` dengan `--env-file`:

```bash
cd /mnt/d/job-besak/coral-ops
```

### One-liner Query

```bash
# Cek daftar tabel + jumlah row
node --env-file=.env.local -e "
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const tables = ['profil','penugasan','penugasan_teknisi','laporan_progres','perpanjangan_penugasan','alat','peminjaman_alat','notifikasi','preferensi_bwm','perhitungan_bwm','gaji_teknisi','tunjangan_lisensi','log_aktivitas','bukti_laporan'];
  for (const t of tables) {
    const { count, error } = await s.from(t).select('*', { count: 'exact', head: true });
    console.log(t + ': ' + (error ? 'ERROR - ' + error.message : count + ' rows'));
  }
})();
"
```

### Lihat Isi Tabel

```bash
# 5 baris pertama dari laporan_progres
node --env-file=.env.local -e "
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const { data } = await s.from('laporan_progres').select('*').limit(5);
  console.log(JSON.stringify(data, null, 2));
})();
"
```

### Lihat Struktur Kolom

```bash
node --env-file=.env.local -e "
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const { data } = await s.from('penugasan').select('*').limit(1);
  console.log(Object.keys(data[0]));
})();
"
```

### Query dengan Filter

```bash
node --env-file=.env.local -e "
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const { data } = await s.from('penugasan').select('*').eq('status', 'Aktif');
  console.log(JSON.stringify(data, null, 2));
})();
"
```

### Join Query

```bash
node --env-file=.env.local -e "
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const { data } = await s.from('laporan_progres')
    .select('id, status_progres, status_validasi, penugasan_id, pelapor_id, profil:pelapor_id(nama)')
    .limit(5);
  console.log(JSON.stringify(data, null, 2));
})();
"
```

---

## Method 2: Via psql (Direct PostgreSQL) — 🔒 Terkendala Password

Untuk project ini **tidak bisa** karena password DB tidak diketahui dan tidak ada akses reset.

Cara kalau suatu saat punya akses:

1. Buka https://supabase.com/dashboard
2. Pilih project: `lksckphyixsjvcjfnmjn`
3. Kiri: **Project Settings** → **Database**
4. Cari **Connection string** → **URI**
5. Copy URL-nya (ada password di dalamnya)

Format langsung:
```
postgresql://postgres:[PASSWORD]@db.lksckphyixsjvcjfnmjn.supabase.co:5432/postgres
```

Atau Session Pooler (port 6543):
```
postgresql://postgres.lksckphyixsjvcjfnmjn:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

Contoh query yang bisa dijalankan nanti:
```sql
-- Lihat semua tabel
\dt

-- Lihat struktur tabel
\d laporan_progres

-- Query data
SELECT id, penugasan_id, pelapor_id, status_progres, status_validasi
FROM laporan_progres
ORDER BY id DESC
LIMIT 10;

-- Cek enum types
SELECT typname, enumlabels
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid;

-- Join
SELECT lp.id, lp.status_progres, lp.status_validasi, p.nama AS pelapor
FROM laporan_progres lp
JOIN profil p ON lp.pelapor_id = p.id
LIMIT 5;
```

### Alternatif: Reset Password Database

Kalau butuh akses psql:
1. Dashboard Supabase → **Project Settings** → **Database**
2. Di bagian **Database Password** klik **Reset database password**
3. Password baru akan muncul — simpan

---

## Method 3: Via Supabase Dashboard (UI)

URL: https://supabase.com/dashboard/project/lksckphyixsjvcjfnmjn

Di kiri: **Database** → **Tables** → klik tabel yang mau dilihat.

---

## Cheatsheet: Query Umum

### Cek Semua User + Role

```bash
node --env-file=.env.local -e "
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const { data } = await s.from('profil').select('id, nama, peran, lisensi_teknisi');
  console.log(JSON.stringify(data, null, 2));
})();
"
```

### Cek Penugasan + Teknisi + Laporan

```bash
node --env-file=.env.local -e "
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const { data } = await s.from('penugasan')
    .select('id, judul, status, bwm_status, penugasan_teknisi(teknisi_id)')
    .order('id', { ascending: false });
  console.log(JSON.stringify(data, null, 2));
})();
"
```

### Cek BWM Calculation Results

```bash
node --env-file=.env.local -e "
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const { data } = await s.from('perhitungan_bwm')
    .select('teknisi_id, c1_kecepatan, c2_kualitas, c3_kepatuhan, c4_proaktivitas, c5_kompetensi, skor_akhir, tunjangan_didapat, status')
    .limit(10);
  console.log(JSON.stringify(data, null, 2));
})();
"
```

### Count Laporan per Teknisi

```bash
node --env-file=.env.local -e "
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const { data } = await s.from('laporan_progres').select('pelapor_id');
  const counts = {};
  data.forEach(l => { counts[l.pelapor_id] = (counts[l.pelapor_id] || 0) + 1; });
  console.log(counts);
})();
"
```
