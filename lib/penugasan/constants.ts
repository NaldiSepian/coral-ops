// Status penugasan sesuai database enum
export const PENUGASAN_STATUS = {
  AKTIF: 'Aktif',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan',
} as const;

// Kategori penugasan sesuai database enum
export const PENUGASAN_KATEGORI = {
  REKONSTRUKSI: 'Rekonstruksi',
  INSTALASI: 'Instalasi',
  PERAWATAN: 'Perawatan',
} as const;

// Frekuensi laporan sesuai database enum
export const PENUGASAN_FREKUENSI_LAPORAN = {
  HARIAN: 'Harian',
  MINGGUAN: 'Mingguan',
} as const;

// Label untuk status penugasan
export const PENUGASAN_STATUS_LABELS = {
  [PENUGASAN_STATUS.AKTIF]: 'Aktif',
  [PENUGASAN_STATUS.SELESAI]: 'Selesai',
  [PENUGASAN_STATUS.DIBATALKAN]: 'Dibatalkan',
} as const;

// Label untuk kategori penugasan
export const PENUGASAN_KATEGORI_LABELS = {
  [PENUGASAN_KATEGORI.REKONSTRUKSI]: 'Rekonstruksi',
  [PENUGASAN_KATEGORI.INSTALASI]: 'Instalasi',
  [PENUGASAN_KATEGORI.PERAWATAN]: 'Perawatan',
} as const;

// Label untuk frekuensi laporan
export const PENUGASAN_FREKUENSI_LABELS = {
  [PENUGASAN_FREKUENSI_LAPORAN.HARIAN]: 'Harian',
  [PENUGASAN_FREKUENSI_LAPORAN.MINGGUAN]: 'Mingguan',
} as const;

// Warna untuk status penugasan
export const PENUGASAN_STATUS_COLORS = {
  [PENUGASAN_STATUS.AKTIF]: 'bg-blue-100 text-blue-800',
  [PENUGASAN_STATUS.SELESAI]: 'bg-green-100 text-green-800',
  [PENUGASAN_STATUS.DIBATALKAN]: 'bg-red-100 text-red-800',
} as const;

// Warna untuk kategori penugasan
export const PENUGASAN_KATEGORI_COLORS = {
  [PENUGASAN_KATEGORI.REKONSTRUKSI]: 'bg-orange-100 text-orange-800',
  [PENUGASAN_KATEGORI.INSTALASI]: 'bg-purple-100 text-purple-800',
  [PENUGASAN_KATEGORI.PERAWATAN]: 'bg-cyan-100 text-cyan-800',
} as const;

// Pagination defaults
export const PENUGASAN_LIST_LIMIT = 20;
export const PENUGASAN_LIST_DEFAULT_PAGE = 1;

// Validation constants
export const PENUGASAN_JUDUL_MAX_LENGTH = 150;
export const PENUGASAN_JUDUL_MIN_LENGTH = 3;