"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle, XCircle, Calendar } from "lucide-react";

interface LaporanItem {
  id: number;
  penugasan_id: number;
  pelapor_id: string;
  tanggal_laporan: string;
  status_progres: string;
  foto_url: string;
  catatan: string;
  status_validasi: string;
  divalidasi_oleh?: string;
  divalidasi_pada?: string;
  catatan_validasi?: string;
  created_at: string;
  penugasan: {
    id: number;
    judul: string;
    kategori: string;
  };
  pelapor: {
    id: string;
    nama: string;
  };
  validator?: {
    id: string;
    nama: string;
  };
}

export default function RiwayatLaporanPage() {
  const [laporan, setLaporan] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"Disetujui" | "Ditolak" | "Semua">("Semua");
  const [searchQuery, setSearchQuery] = useState("");

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
  }, [fetchLaporan]);

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
      disetujui: laporan.filter((l) => l.status_validasi === "Disetujui").length,
      ditolak: laporan.filter((l) => l.status_validasi === "Ditolak").length
    };
  }, [laporan]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Disetujui":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Disetujui
          </Badge>
        );
      case "Ditolak":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Ditolak
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <section className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Laporan</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="text-xs text-green-700 mb-1">Disetujui</div>
          <div className="text-2xl font-bold text-green-700">{stats.disetujui}</div>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-xs text-red-700 mb-1">Ditolak</div>
          <div className="text-2xl font-bold text-red-700">{stats.ditolak}</div>
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
            <Card key={laporanItem.id} className="p-4 sm:p-6">
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
                    <div>
                      <span className="font-medium text-foreground">{laporanItem.pelapor.nama}</span>
                      <span className="text-xs ml-2">• Teknisi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(laporanItem.tanggal_laporan).toLocaleDateString("id-ID")}
                    </div>
                  </div>

                  {laporanItem.catatan && (
                    <p className="text-sm text-foreground bg-gray-100 p-2 rounded">
                      {laporanItem.catatan}
                    </p>
                  )}

                  {laporanItem.status_progres && (
                    <Badge variant="outline" className="w-fit">
                      {laporanItem.status_progres}
                    </Badge>
                  )}

                  {/* Foto thumbnail */}
                  {laporanItem.foto_url && (
                    <div className="mt-3">
                      <img
                        src={laporanItem.foto_url}
                        alt="Laporan"
                        className="h-20 w-20 object-cover rounded border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(laporanItem.foto_url, "_blank")}
                      />
                    </div>
                  )}

                  {/* Validasi info */}
                  <div className="text-xs text-muted-foreground bg-gray-100 p-2 rounded space-y-1">
                    <div>
                      Divalidasi oleh: <span className="font-medium">{laporanItem.validator?.nama}</span>
                    </div>
                    <div>
                      {new Date(laporanItem.divalidasi_pada || "").toLocaleString("id-ID")}
                    </div>
                    {laporanItem.catatan_validasi && (
                      <div className="italic border-t pt-1 mt-1">
                        Catatan: {laporanItem.catatan_validasi}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Status */}
                <div className="flex-shrink-0">{getStatusBadge(laporanItem.status_validasi)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredLaporan.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto opacity-50 mb-4" />
          <p>Tidak ada laporan dengan filter yang dipilih</p>
        </Card>
      )}
    </section>
  );
}
