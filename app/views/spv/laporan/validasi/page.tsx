"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle, XCircle, Calendar, Check, X, RefreshCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  // Validation dialog states
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationAction, setValidationAction] = useState<'approve' | 'reject' | null>(null);
  const [validationNote, setValidationNote] = useState('');
  const [validating, setValidating] = useState(false);
  const [selectedLaporanId, setSelectedLaporanId] = useState<number | null>(null);

  const fetchLaporan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("status", "Menunggu");

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
  }, []);

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

  const handleDetail = (laporanId: number) => {
    router.push(`/views/spv/laporan/validasi/${laporanId}`);
  };

  const handleApprove = async (laporanId: number) => {
    setSelectedLaporanId(laporanId);
    setValidationAction('approve');
    setValidationNote('');
    setShowValidationDialog(true);
  };

  const handleReject = async (laporanId: number) => {
    setSelectedLaporanId(laporanId);
    setValidationAction('reject');
    setValidationNote('');
    setShowValidationDialog(true);
  };

  const handleValidation = async (action: 'approve' | 'reject') => {
    if (!selectedLaporanId) return;

    // Ensure status is exactly "Disetujui" or "Ditolak"
    const validationStatus = action === 'approve' ? 'Disetujui' : 'Ditolak';

    setValidating(true);
    try {
      const response = await fetch(`/api/laporan/${selectedLaporanId}/validasi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status_validasi: validationStatus,
          catatan_validasi: validationNote.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal melakukan validasi');
      }

      // Refresh data
      setRefreshTrigger((prev) => prev + 1);
      
      // Close dialog and reset state
      setShowValidationDialog(false);
      setValidationAction(null);
      setValidationNote('');
      setSelectedLaporanId(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat validasi');
    } finally {
      setValidating(false);
    }
  };

  const openValidationDialog = (action: 'approve' | 'reject', laporanId: number) => {
    setSelectedLaporanId(laporanId);
    setValidationAction(action);
    setValidationNote('');
    setShowValidationDialog(true);
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

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Cari penugasan atau teknisi..."
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

                  <div className="flex items-center gap-2 flex-wrap">
                    {laporanItem.status_progres && (
                      <p className="text-sm text-foreground">
                        Progres Kerja: <strong>{laporanItem.status_progres}</strong>
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
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => openValidationDialog('approve', laporanItem.id)}
                          className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openValidationDialog('reject', laporanItem.id)}
                          className="flex-1 sm:flex-none"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
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
            <CheckCircle className="w-12 h-12 mx-auto opacity-50 mb-4" />
            <p className="font-medium">Semua laporan sudah divalidasi!</p>
            <p className="text-sm">Tidak ada laporan yang menunggu validasi Anda</p>
          </div>
        </Card>
      )}

      {/* Validation Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {validationAction === 'approve' ? 'Setujui Laporan' : 'Tolak Laporan'}
            </DialogTitle>
            <DialogDescription>
              {validationAction === 'approve'
                ? 'Apakah Anda yakin ingin menyetujui laporan ini?'
                : 'Berikan alasan penolakan laporan ini.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="validation-note" className="mb-2">Catatan Validasi (Opsional)</Label>
              <Textarea
                id="validation-note"
                placeholder={validationAction === 'approve' ? 'Catatan persetujuan...' : 'Alasan penolakan...'}
                value={validationNote}
                onChange={(e) => setValidationNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowValidationDialog(false)}
              disabled={validating}
            >
              Batal
            </Button>
            <Button
              onClick={() => handleValidation(validationAction!)}
              disabled={validating}
              variant={validationAction === 'approve' ? 'default' : 'destructive'}
            >
              {validating ? (
                <>
                  <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : validationAction === 'approve' ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Setujui
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Tolak
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </section>
  );
}
