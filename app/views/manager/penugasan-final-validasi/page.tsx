"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle, Calendar } from "lucide-react";
import { ManagerValidasiDialog } from "@/components/penugasan/detail-penugasan/manager-validasi-dialog";

interface PenugasanItem {
  id: number;
  judul: string;
  kategori: string;
  status: string;
  start_date: string;
  end_date?: string;
  created_at: string;
  supervisor: {
    id: string;
    nama: string;
  };
  teknisi: Array<{
    id: number;
    teknisi_id: string;
    profil: {
      id: string;
      nama: string;
    };
  }>;
  laporan: Array<{
    id: number;
    tanggal_laporan: string;
    status_progres: string;
    status_validasi: string;
    catatan: string;
    foto_url: string;
  }>;
  alat: Array<{
    id: number;
    alat_id: number;
    jumlah: number;
    is_returned: boolean;
    alat: {
      id: number;
      nama: string;
    };
  }>;
}

export default function FinalValidasiPage() {
  const [penugasan, setPenugasan] = useState<PenugasanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [validasiDialogOpen, setValidasiDialogOpen] = useState(false);
  const [selectedPenugasan, setSelectedPenugasan] = useState<PenugasanItem | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchPenugasan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/manager/penugasan-final-validasi?${params}`, {
        cache: "no-store"
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal memuat data penugasan");
      }

      setPenugasan(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setPenugasan([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchPenugasan();
  }, [fetchPenugasan, refreshTrigger]);

  const stats = useMemo(() => {
    return {
      total: penugasan.length,
    };
  }, [penugasan]);

  const handleValidasi = (penugasanItem: PenugasanItem) => {
    setSelectedPenugasan(penugasanItem);
    setValidasiDialogOpen(true);
  };

  const handleValidasiSuccess = () => {
    setValidasiDialogOpen(false);
    setSelectedPenugasan(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Final Validasi Penugasan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review dan validasi penugasan sebelum dinyatakan selesai
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Menunggu Validasi</div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-xs text-blue-700 mb-1">Laporan Rata-rata</div>
          <div className="text-3xl font-bold text-blue-700">
            {stats.total > 0
              ? (
                  penugasan.reduce((acc, p) => acc + (p.laporan?.length || 0), 0) /
                  stats.total
                ).toFixed(1)
              : "0"}
          </div>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="text-xs text-purple-700 mb-1">Total Teknisi</div>
          <div className="text-3xl font-bold text-purple-700">
            {penugasan.reduce((acc, p) => acc + (p.teknisi?.length || 0), 0)}
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Cari penugasan atau supervisor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
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

      {/* Penugasan List */}
      {!loading && penugasan.length > 0 && (
        <div className="space-y-4">
          {penugasan.map((penugasanItem) => {
            const totalLaporan = penugasanItem.laporan?.length || 0;
            const laporanDisetujui =
              penugasanItem.laporan?.filter((l) => l.status_validasi === "Disetujui").length || 0;
            const completionRate = totalLaporan > 0 ? (laporanDisetujui / totalLaporan) * 100 : 0;

            return (
              <Card key={penugasanItem.id} className="p-4 sm:p-6 hover:shadow-md transition">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <h3 className="font-semibold text-base truncate">
                        {penugasanItem.judul}
                      </h3>
                      <Badge variant="secondary" className="w-fit text-xs">
                        {penugasanItem.kategori}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">
                          {penugasanItem.supervisor.nama}
                        </span>
                        <span className="text-xs ml-2">• Supervisor</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(penugasanItem.start_date).toLocaleDateString("id-ID")} →{" "}
                        {penugasanItem.end_date
                          ? new Date(penugasanItem.end_date).toLocaleDateString("id-ID")
                          : "TBD"}
                      </div>
                    </div>

                    {/* Teknisi List */}
                    {penugasanItem.teknisi && penugasanItem.teknisi.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Teknisi ({penugasanItem.teknisi.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {penugasanItem.teknisi.map((t) => (
                            <Badge key={t.teknisi_id} variant="outline" className="text-xs">
                              {t.profil.nama}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium">
                          Laporan: {laporanDisetujui}/{totalLaporan}
                        </p>
                        <p className="text-xs font-medium text-green-600">
                          {completionRate.toFixed(0)}%
                        </p>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Action */}
                  <div className="flex flex-col gap-2 sm:items-end w-full sm:w-auto">
                    <Button
                      size="sm"
                      onClick={() => handleValidasi(penugasanItem)}
                      className="w-full sm:w-auto"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Validasi
                    </Button>
                    <p className="text-xs text-muted-foreground text-center sm:text-right">
                      Menunggu validasi
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && penugasan.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground space-y-2">
            <CheckCircle className="w-12 h-12 mx-auto opacity-50 mb-4" />
            <p className="font-medium">Semua penugasan sudah divalidasi!</p>
            <p className="text-sm">Tidak ada penugasan yang menunggu final validasi</p>
          </div>
        </Card>
      )}

      {/* Validasi Dialog */}
      {selectedPenugasan && (
        <ManagerValidasiDialog
          open={validasiDialogOpen}
          onOpenChange={setValidasiDialogOpen}
          penugasan={selectedPenugasan}
          onSuccess={handleValidasiSuccess}
        />
      )}
    </section>
  );
}
