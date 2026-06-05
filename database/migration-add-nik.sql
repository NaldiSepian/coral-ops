-- Migration: Add nik column to profil table
ALTER TABLE profil ADD COLUMN IF NOT EXISTS nik VARCHAR(50);

-- Add unique constraint to prevent duplicate NIK (allows multiple NULLs in Postgres)
ALTER TABLE profil ADD CONSTRAINT uq_profil_nik UNIQUE (nik);
