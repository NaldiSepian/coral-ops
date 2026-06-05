# Plan: Fix Auto-Complete Penugasan pada Validasi Laporan

## Masalah

Saat SPV approve laporan teknisi yang ber-status "Selesai", sistem auto-complete penugasan jadi "Selesai" (di `validasi/route.ts:62-83`).

Ini salah karena:
- Satu teknisi selesai ≠ semua teknisi selesai
- Penugasan multi-teknisi harus menunggu supervisor menentukan kapan semua selesai

## Perubahan

### 1. Hapus auto-complete dari validasi

**File:** `app/api/laporan/[id]/validasi/route.ts`

Hapus baris 62-83 — logic yang panggil `cek_penugasan_siap_selesai` dan update status penugasan. Sekarang validasi laporan hanya approve/reject, tanpa efek samping ke status penugasan.

### 2. Fix tombol "Tandai selesai" di SPV

**File:** `app/views/spv/penugasan/[id]/page.tsx`

- `handleComplete` sebelumnya panggil **generic PUT** `/api/penugasan/[id]` dengan body `{ status: 'Selesai' }` — tanpa validasi, tanpa notifikasi
- Diubah panggil **endpoint dedicated** `/api/penugasan/[id]/approve-selesai` yang sudah handle:
  - Validasi `cek_penugasan_siap_selesai` (cek semua laporan approved)
  - Auto-return alat yang belum dikembalikan
  - Log aktivitas
  - Notifikasi ke semua teknisi

## Flow Baru

```
Teknisi laporan → SPV validasi (setiap laporan)
  └─ Validasi hanya approve/reject, TIDAK auto-complete penugasan

SPV klik "Tandai selesai" di header detail penugasan
  └─ Sistem cek: semua laporan sudah disetujui?
       ├─ Ya → complete + notifikasi + return alat
       └─ Tidak → tolak dengan pesan error
```
