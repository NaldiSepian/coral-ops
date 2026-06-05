// lib/penugasan/utils.ts
import { StatusPenugasan, KategoriPenugasan, FrekuensiLaporan } from './types';
import {
  PENUGASAN_STATUS_LABELS,
  PENUGASAN_KATEGORI_LABELS,
  PENUGASAN_FREKUENSI_LABELS
} from './constants';

export function formatPenugasanStatus(status: StatusPenugasan): string {
  return PENUGASAN_STATUS_LABELS[status] || status;
}

export function formatPenugasanKategori(kategori: KategoriPenugasan): string {
  return PENUGASAN_KATEGORI_LABELS[kategori] || kategori;
}

export function formatFrekuensiLaporan(frekuensi: FrekuensiLaporan): string {
  return PENUGASAN_FREKUENSI_LABELS[frekuensi] || frekuensi;
}

export function isPenugasanActive(status: StatusPenugasan): boolean {
  return status === 'Aktif';
}

export function isPenugasanCompleted(status: StatusPenugasan): boolean {
  return status === 'Selesai';
}

export function isPenugasanCancelled(status: StatusPenugasan): boolean {
  return status === 'Dibatalkan';
}

export function canEditPenugasan(status: StatusPenugasan): boolean {
  return status === 'Aktif';
}

export function canAssignTeknisi(status: StatusPenugasan): boolean {
  return status === 'Aktif';
}

export function canAssignAlat(status: StatusPenugasan): boolean {
  return status === 'Aktif';
}

export function canCancelPenugasan(status: StatusPenugasan): boolean {
  return status === 'Aktif';
}

export function canCompletePenugasan(status: StatusPenugasan): boolean {
  return status === 'Aktif';
}

export function formatLocation(wktPoint: string): { latitude: number; longitude: number } | null {
  // Parse WKT POINT format: "POINT(longitude latitude)"
  const match = wktPoint.match(/POINT\(([^ ]+) ([^)]+)\)/);
  if (!match) return null;

  const longitude = parseFloat(match[1]);
  const latitude = parseFloat(match[2]);

  if (isNaN(longitude) || isNaN(latitude)) return null;

  return { latitude, longitude };
}

export function createWKTPoint(latitude: number, longitude: number): string {
  return `POINT(${longitude} ${latitude})`;
}

export function getNextReportDeadline(
  frequency: FrekuensiLaporan,
  lastReportDate: string | null,
  startDate: string
): { dueDate: string; overdue: boolean } {
  const baseDate = lastReportDate ? new Date(lastReportDate) : new Date(startDate);
  const now = new Date();
  const daysOffset = frequency === 'Harian' ? 1 : 7;
  baseDate.setDate(baseDate.getDate() + daysOffset);
  const dueDate = baseDate.toISOString().slice(0, 10);
  const overdue = now > baseDate;
  return { dueDate, overdue };
}

export function validatePenugasanDate(startDate: string, endDate?: string): { isValid: boolean; error?: string } {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  const now = new Date();

  // Start date must be in the future or today
  if (start.getTime() < now.setHours(0, 0, 0, 0)) {
    return { isValid: false, error: 'Tanggal mulai harus hari ini atau di masa depan' };
  }

  // End date must be after start date if provided
  if (end && end <= start) {
    return { isValid: false, error: 'Tanggal selesai harus setelah tanggal mulai' };
  }

  return { isValid: true };
}

export function getPenugasanStatusOrder(status: StatusPenugasan): number {
  const order = {
    'Aktif': 1,
    'Selesai': 2,
    'Dibatalkan': 3,
  };
  return order[status] || 0;
}

export function calculatePenugasanDuration(startDate: string, endDate?: string): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // days
}

export function isPenugasanOverdue(endDate?: string): boolean {
  if (!endDate) return false;
  const end = new Date(endDate);
  const now = new Date();
  return end < now;
}