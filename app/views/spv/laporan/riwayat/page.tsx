"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const router = useRouter();

  const fetchLaporan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "Semua") {
        params.append("status", statusFilter);
      } else {
        params.append("status", "all");
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

  const handleDetail = (laporanId: number) => {
    router.push(`/views/spv/laporan/${laporanId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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
                    <p className="text-sm text-foreground">
                      Catatan: <strong>{laporanItem.catatan}</strong>
                    </p>
                  )}

                  {laporanItem.status_progres && (
                    <p className="text-sm text-foreground">
                      Progres Kerja: <strong>{laporanItem.status_progres}</strong>
                    </p>
                  )}

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
                </div>

                {/* Right: Status & Action */}
                <div className="flex flex-col gap-2 sm:items-end w-full sm:w-auto">
                  {getStatusBadge(laporanItem.status_validasi)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDetail(laporanItem.id)}
                    className="w-full sm:w-auto"
                  >
                    Detail
                  </Button>
                </div>
              </div>

              {/* Validasi info - Full width below both sections */}
              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded space-y-1">
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
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredLaporan.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground space-y-2">
            <AlertCircle className="w-12 h-12 mx-auto opacity-50 mb-4" />
            <p>Tidak ada laporan dengan filter yang dipilih</p>
          </div>
        </Card>
      )}
    </section>
  );
}
