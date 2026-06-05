-- ============================================
-- MIGRATION 011: Backfill tanggal_selesai_actual
-- Mengisi tanggal_selesai_actual untuk penugasan
-- yang sudah "Selesai" sebelum migration 010
-- ============================================

-- Untuk penugasan "Selesai" yang belum terisi tanggal_selesai_actual,
-- gunakan end_date sebagai fallback (dianggap selesai pas deadline)
UPDATE penugasan
SET tanggal_selesai_actual = end_date
WHERE status = 'Selesai'
  AND tanggal_selesai_actual IS NULL;
