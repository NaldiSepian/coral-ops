-- ============================================
-- MIGRATION 012: Update cek_penugasan_siap_selesai
-- Tanggal: 10 Juni 2026
-- Deskripsi: Allow completion even with rejected reports,
--            only block if there are pending (unreviewed) reports.
--            Rejected reports are part of BWM quality calculation.
-- ============================================

CREATE OR REPLACE FUNCTION cek_penugasan_siap_selesai(p_penugasan_id INT)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_laporan INT;
  v_laporan_disetujui INT;
  v_laporan_ditolak INT;
BEGIN
  -- Hitung total laporan
  SELECT COUNT(*) INTO v_total_laporan
  FROM laporan_progres
  WHERE penugasan_id = p_penugasan_id;

  -- Hitung laporan yang disetujui
  SELECT COUNT(*) INTO v_laporan_disetujui
  FROM laporan_progres
  WHERE penugasan_id = p_penugasan_id
    AND status_validasi = 'Disetujui';

  -- Hitung laporan yang ditolak
  SELECT COUNT(*) INTO v_laporan_ditolak
  FROM laporan_progres
  WHERE penugasan_id = p_penugasan_id
    AND status_validasi = 'Ditolak';

  -- Penugasan siap selesai jika:
  -- 1. Ada minimal 1 laporan
  -- 2. Semua laporan sudah divalidasi (disetujui ATAU ditolak),
  --    tidak ada yang masih menunggu
  -- 3. Laporan ditolak TIDAK memblokir penyelesaian (karena dipakai
  --    dalam perhitungan kualitas BWM)
  RETURN (v_total_laporan > 0) 
    AND ((v_laporan_disetujui + v_laporan_ditolak) = v_total_laporan);
END;
$$;
