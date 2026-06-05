CREATE OR REPLACE FUNCTION calculate_total_gaji()
RETURNS TRIGGER AS $$
BEGIN
  -- Sesuaikan perhitungan hanya dengan kolom yang masih ada
  NEW.total_gaji = COALESCE(NEW.tunjangan_jabatan, 0) + 
                   COALESCE(NEW.bonus_bwm, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
