-- Migration: Add lisensi_teknisi column to profil table
-- Date: December 9, 2025

-- Add lisensi_teknisi column to profil table
ALTER TABLE profil ADD COLUMN IF NOT EXISTS lisensi_teknisi VARCHAR(50);

-- Add check constraint to ensure valid license levels
ALTER TABLE profil ADD CONSTRAINT chk_lisensi_teknisi
CHECK (lisensi_teknisi IS NULL OR lisensi_teknisi IN ('Level 1', 'Level 2', 'Level 3'));

-- Update existing teknisi records to have default license level
UPDATE profil SET lisensi_teknisi = 'Level 1' WHERE peran = 'Teknisi' AND lisensi_teknisi IS NULL;