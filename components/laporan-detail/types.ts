export interface LaporanDetail {
  id: number;
  penugasan_id: number;
  pelapor_id: string;
  tanggal_laporan: string;
  persentase_progres?: number;
  status_progres: string;
  foto_url: string;
  catatan: string;
  status_validasi: string;
  divalidasi_oleh?: string;
  divalidasi_pada?: string;
  catatan_validasi?: string;
  created_at: string;
  titik_gps?: string;
  tool_photos?: Array<{
    id: number;
    foto_url: string;
    alat_id: number;
    alat?: {
      nama: string;
      tipe_alat: string;
    };
  }>;
  return_tool_photos?: Array<{
    id: number;
    foto_url: string;
    alat_id: number;
    alat?: {
      nama: string;
      tipe_alat: string;
    };
  }>;
  penugasan: {
    id: number;
    judul: string;
    kategori: string;
    supervisor_id: string;
    status: string;
    is_deleted: boolean;
    lokasi?: string;
  };
  pelapor: {
    id: string;
    nama: string;
    peran: string;
  };
  validator?: {
    id: string;
    nama: string;
    peran: string;
  };
  bukti_laporan?: Array<{
    id: number;
    pair_key: string;
    judul?: string;
    deskripsi?: string;
    before_foto_url: string;
    after_foto_url: string;
    taken_at?: string;
    taken_by?: string;
    metadata?: any;
  }>;
}

export interface AssignmentDetail {
  id: number;
  judul: string;
  kategori: string;
  supervisor_id: string;
  status: string;
  is_deleted: boolean;
  lokasi?: string;
  alat?: Array<{
    id: number;
    alat_id: number;
    jumlah: number;
    is_returned: boolean;
    alat?: {
      id: number;
      nama: string;
      tipe_alat: string;
      foto_url?: string;
    };
  }>;
  teknisi?: Array<{
    id: number;
    teknisi_id: string;
    profil?: {
      nama: string;
      peran: string;
    };
  }>;
}