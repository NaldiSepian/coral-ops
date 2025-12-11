"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle, XCircle, MapPin, Calendar, Camera, Wrench, Ruler } from "lucide-react";
import { ValidasiLaporanDialog } from "@/components/penugasan/detail-penugasan/validasi-laporan-dialog";

interface LaporanItem {
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

export default function ValidasiLaporanPage() {
  const [laporan, setLaporan] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"Menunggu" | "Disetujui" | "Ditolak" | "Semua">("Menunggu");
  const [searchQuery, setSearchQuery] = useState("");
  const [validasiDialogOpen, setValidasiDialogOpen] = useState(false);
  const [selectedLaporan, setSelectedLaporan] = useState<LaporanItem | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  const fetchLaporan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "Semua") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/supervisor/laporan-validasi?${params}`, {
        cache: "no-store"
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal memuat laporan");
      }

      setLaporan(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setLaporan([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan, refreshTrigger]);

  const filteredLaporan = useMemo(() => {
    if (!searchQuery) return laporan;
    return laporan.filter(
      (l) =>
        l.penugasan.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.pelapor.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [laporan, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: laporan.length,
      menunggu: laporan.filter((l) => l.status_validasi === "Menunggu").length,
      disetujui: laporan.filter((l) => l.status_validasi === "Disetujui").length,
      ditolak: laporan.filter((l) => l.status_validasi === "Ditolak").length
    };
  }, [laporan]);

  const handleValidasi = (laporanItem: LaporanItem) => {
    setSelectedLaporan(laporanItem);
    setValidasiDialogOpen(true);
  };

  const handleDetail = (laporanId: number) => {
    router.push(`/views/spv/laporan/validasi/${laporanId}`);
  };

  const handleValidasiSuccess = () => {
    setValidasiDialogOpen(false);
    setSelectedLaporan(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Menunggu":
        return (
          <Badge variant="outline" className="bg-accent text-accent-foreground border-border">
            <AlertCircle className="w-3 h-3 mr-1" />
            Menunggu Validasi
          </Badge>
        );
      case "Disetujui":
        return (
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Disetujui
          </Badge>
        );
      case "Ditolak":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Ditolak
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getProgressStatusColor = (status: string) => {
    switch (status) {
      case "Sedang Dikerjakan":
        return "bg-muted/50";
      case "Hampir Selesai":
        return "bg-secondary/20";
      case "Selesai":
        return "bg-secondary/30";
      default:
        return "";
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Validasi Laporan Progres</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review dan validasi laporan dari teknisi lapangan
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-primary/20">
          <div className="text-xs text-muted-foreground mb-1">Total Laporan</div>
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
        </Card>
        <Card className="p-4 bg-accent border-border">
          <div className="text-xs text-muted-foreground mb-1">Menunggu</div>
          <div className="text-2xl font-bold text-accent-foreground">{stats.menunggu}</div>
        </Card>
        <Card className="p-4 bg-secondary/20 border-secondary">
          <div className="text-xs text-muted-foreground mb-1">Disetujui</div>
          <div className="text-2xl font-bold text-secondary-foreground">{stats.disetujui}</div>
        </Card>
        <Card className="p-4 bg-destructive/10 border-destructive/30">
          <div className="text-xs text-muted-foreground mb-1">Ditolak</div>
          <div className="text-2xl font-bold text-destructive">{stats.ditolak}</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Cari penugasan atau teknisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semua">Semua Status</SelectItem>
            <SelectItem value="Menunggu">Menunggu Validasi</SelectItem>
            <SelectItem value="Disetujui">Disetujui</SelectItem>
            <SelectItem value="Ditolak">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Laporan List */}
      {!loading && filteredLaporan.length > 0 && (
        <div className="space-y-4">
          {filteredLaporan.map((laporanItem) => (
            <Card key={laporanItem.id} className={`p-4 sm:p-6 ${getProgressStatusColor(laporanItem.status_progres)}`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Left: Info */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <h3 className="font-semibold text-sm sm:text-base truncate">
                      {laporanItem.penugasan.judul}
                    </h3>
                    <Badge variant="secondary" className="w-fit text-xs">
                      {laporanItem.penugasan.kategori}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{laporanItem.pelapor.nama}</span>
                      <span className="text-xs">• Teknisi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(laporanItem.tanggal_laporan).toLocaleDateString("id-ID")}
                    </div>
                  </div>

                  {laporanItem.catatan && (
                    <p className="text-sm text-foreground bg-card/80">
                      Catatan: {laporanItem.catatan}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {laporanItem.status_progres && (
                      <p className="text-sm text-foreground">
                        Progres Kerja: {laporanItem.status_progres}
                      </p>
                    )}
                    {laporanItem.persentase_progres != null && (
                      <Badge className="w-fit font-semibold bg-primary text-primary-foreground">
                        {laporanItem.persentase_progres}%
                      </Badge>
                    )}
                  </div>

                  {/* Foto thumbnail */}
                  {laporanItem.foto_url && (
                    <div className="mt-3">
                      <img
                        src={laporanItem.foto_url}
                        alt="Laporan"
                        className="h-20 w-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(laporanItem.foto_url, "_blank")}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          console.error('Failed to load image:', laporanItem.foto_url);
                        }}
                      />
                    </div>
                  )}

                  {/* Validasi info */}
                  {laporanItem.status_validasi !== "Menunggu" && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded space-y-1">
                      <div>
                        Divalidasi oleh: <span className="font-medium text-foreground">{laporanItem.validator?.nama}</span>
                      </div>
                      <div>
                        {new Date(laporanItem.divalidasi_pada || "").toLocaleString("id-ID")}
                      </div>
                      {laporanItem.catatan_validasi && (
                        <div className="italic text-foreground">{laporanItem.catatan_validasi}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Status & Action */}
                <div className="flex flex-col gap-2 sm:items-end w-full sm:w-auto">
                  {getStatusBadge(laporanItem.status_validasi)}

                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDetail(laporanItem.id)}
                      className="flex-1 sm:flex-none"
                    >
                      Detail
                    </Button>
                    {laporanItem.status_validasi === "Menunggu" && (
                      <Button
                        size="sm"
                        onClick={() => handleValidasi(laporanItem)}
                        className="flex-1 sm:flex-none"
                      >
                        Validasi
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredLaporan.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground space-y-2">
            {statusFilter === "Menunggu" ? (
              <>
                <CheckCircle className="w-12 h-12 mx-auto opacity-50 mb-4" />
                <p className="font-medium">Semua laporan sudah divalidasi!</p>
                <p className="text-sm">Tidak ada laporan yang menunggu validasi Anda</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 mx-auto opacity-50 mb-4" />
                <p>Tidak ada laporan dengan filter yang dipilih</p>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Validasi Dialog */}
      {selectedLaporan && (
        <ValidasiLaporanDialog
          open={validasiDialogOpen}
          onOpenChange={setValidasiDialogOpen}
          laporan={selectedLaporan}
          onSuccess={handleValidasiSuccess}
        />
      )}
    </section>
  );
}
