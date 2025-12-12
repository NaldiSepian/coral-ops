// Database enums
export type StatusPenugasan = 'Aktif' | 'Selesai' | 'Dibatalkan' | 'Menunggu Validasi' | 'Ditolak';
export type KategoriPenugasan = 'Rekonstruksi' | 'Instalasi' | 'Perawatan';
export type FrekuensiLaporan = 'Harian' | 'Mingguan';
export type PeranPengguna = 'Supervisor' | 'Manager' | 'Teknisi';
export type StatusLaporanProgres = 'Menunggu' | 'Sedang Dikerjakan' | 'Hampir Selesai' | 'Selesai';
export type StatusValidasiLaporan = 'Menunggu' | 'Disetujui' | 'Ditolak';

// Core penugasan interface
export interface Penugasan {
  id: number;
  judul: string;
  lokasi: string; // GEOGRAPHY(POINT, 4326) - stored as WKT or GeoJSON
  lokasi_text?: string; // Human-readable location text from PostGIS
  kategori: KategoriPenugasan;
  frekuensi_laporan: FrekuensiLaporan;
  supervisor_id: string; // UUID
  start_date: string; // DATE
  end_date?: string; // DATE
  is_extended: boolean;
  status: StatusPenugasan;
  created_at: string;
  is_deleted: boolean;
  deleted_at?: string;
}

// Extended interface with relations
export interface PenugasanWithRelations extends Penugasan {
  supervisor?: {
    nama: string;
    peran: PeranPengguna;
  };
  teknisi?: Array<{
    id: number;
    teknisi_id: string;
    profil?: {
      nama: string;
      peran: PeranPengguna;
    };
  }>;
  alat?: Array<{
    id: number;
    alat_id: number;
    jumlah: number;
    is_returned: boolean;
    alat?: {
      nama: string;
      foto_url?: string;
      tipe_alat?: string;
    };
  }>;
  tool_photos?: Array<{
    alat_id: number;
    foto_url: string;
    alat?: {
      nama: string;
      foto_url?: string;
      tipe_alat?: string;
    };
  }>;
  return_tool_photos?: Array<{
    alat_id: number;
    foto_url: string;
    alat?: {
      nama: string;
      foto_url?: string;
      tipe_alat?: string;
    };
  }>;
  laporan_progres?: Array<{
    id: number;
    tanggal_laporan: string;
    persentase_progres?: number;
    status_progres?: StatusLaporanProgres;
    foto_url?: string;
    catatan?: string;
    status_validasi?: StatusValidasiLaporan;
    divalidasi_oleh?: string;
    divalidasi_pada?: string;
    catatan_validasi?: string;
    bukti?: BuktiLaporan[];
  }>;
  perpanjangan?: Array<KendalaPenugasan>;
}

export interface BuktiLaporan {
  id: number;
  laporan_id: number;
  pair_key: string;
  judul?: string;
  deskripsi?: string;
  before_foto_url: string;
  after_foto_url: string;
  taken_at?: string;
  taken_by?: string;
  metadata?: Record<string, any> | null;
  created_at?: string;
}

export interface BuktiLaporanPairPayload {
  pair_key?: string;
  judul?: string;
  deskripsi?: string;
  before: {
    foto_url: string;
    taken_at?: string;
    metadata?: Record<string, any> | null;
  };
  after: {
    foto_url: string;
    taken_at?: string;
    metadata?: Record<string, any> | null;
  };
}

export interface KendalaPenugasan {
  id: number;
  penugasan_id: number;
  pemohon_id: string;
  alasan?: string;
  foto_url?: string;
  durasi_menit?: number;
  tipe_kendala?: 'Cuaca' | 'Akses' | 'Teknis' | 'Lain';
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  tanggal_permintaan?: string;
  catatan_spv?: string;
  ditolak_alasan?: string;
}

export interface TeknisiAssignment extends PenugasanWithRelations {
  team: Array<{
    teknisi_id: string;
    nama: string;
    peran: PeranPengguna;
  }>;
  pending_kendala?: KendalaPenugasan | null;
  alat_aktif: Array<{
    id: number;
    alat_id: number;
    nama: string;
    jumlah: number;
    is_returned: boolean;
  }>;
}

// List interface with counts (for performance)
export interface PenugasanListItem extends Penugasan {
  supervisor?: {
    nama: string;
    peran: PeranPengguna;
  };
  teknisi?: Array<{ count: number }>;
  alat?: Array<{
    alat_id: number;
    is_returned?: boolean;
  }>;
}

// Create/Update DTOs
export interface CreatePenugasanData {
  judul: string;
  lokasi: string; // WKT format like 'POINT(longitude latitude)'
  kategori: KategoriPenugasan;
  frekuensi_laporan: FrekuensiLaporan;
  supervisor_id: string;
  start_date: string;
  end_date?: string;
}

export interface UpdatePenugasanData {
  judul?: string;
  lokasi?: string;
  kategori?: KategoriPenugasan;
  frekuensi_laporan?: FrekuensiLaporan;
  start_date?: string;
  end_date?: string;
  status?: StatusPenugasan;
}

// Assignment management
export interface AssignTeknisiData {
  teknisi_ids: string[]; // UUID array
}

export interface AssignAlatData {
  alat_id: number;
  jumlah: number;
  foto_ambil_url?: string;
}

// Location helper type for frontend
export interface LocationPoint {
  latitude: number;
  longitude: number;
}

// Filter and search
export interface PenugasanFilters {
  status?: StatusPenugasan;
  kategori?: KategoriPenugasan;
  supervisor_id?: string;
  start_date_from?: string;
  start_date_to?: string;
  search?: string; // search in judul
}

// API Response types
export interface PenugasanListResponse {
  data: PenugasanListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface PenugasanDetailResponse {
  data: PenugasanWithRelations;
}

// Laporan detail types for teknisi/laporan/[id] API
export interface LaporanDetail {
  id: number;
  penugasan_id: number;
  tanggal_laporan: string;
  persentase_progres: number;
  status_progres: StatusLaporanProgres;
  foto_url: string;
  catatan?: string;
  latitude: number | null;
  longitude: number | null;
  titik_gps?: string | null;
  created_at: string;
  status_validasi?: StatusValidasiLaporan;
  divalidasi_oleh?: string;
  divalidasi_pada?: string;
  catatan_validasi?: string;
  pairs?: Array<{
    id?: number;
    pair_key: string;
    judul?: string;
    deskripsi?: string;
    before_foto_url?: string;
    after_foto_url?: string;
  }>;
  tool_photos?: Array<{
    alat_id: number;
    foto_url: string;
    alat?: {
      nama: string;
      foto_url?: string;
      tipe_alat?: string;
    };
  }>;
  return_tool_photos?: Array<{
    alat_id: number;
    foto_url: string;
    alat?: {
      nama: string;
      foto_url?: string;
      tipe_alat?: string;
    };
  }>;
}

export interface LaporanDetailResponse {
  data: {
    report: LaporanDetail;
    assignment: {
      id: number;
      judul: string;
      lokasi: any;
      lokasi_text: string;
      alat: Array<{
        id: number;
        alat_id: number;
        jumlah: number;
        is_returned: boolean;
        alat?: {
          nama: string;
          foto_url?: string;
          tipe_alat?: string;
        };
      }>;
    };
  };
}

// Error types
export interface PenugasanError {
  message: string;
  code?: string;
  details?: any;
}