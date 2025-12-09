"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle, Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";

interface PenugasanItem {
  id: number;
  judul: string;
  kategori: string;
  status: string;
  start_date: string;
  end_date?: string;
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
}

interface ManagerValidasiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  penugasan: PenugasanItem;
  onSuccess: () => void;
}

export function ManagerValidasiDialog({
  open,
  onOpenChange,
  penugasan,
  onSuccess,
}: ManagerValidasiDialogProps) {
  const [status, setStatus] = useState<"Selesai" | "Ditolak">("Selesai");
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/penugasan/${penugasan.id}/manager-approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_penugasan: status,
          catatan_manager: status === "Ditolak" ? catatan : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal melakukan validasi");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const isReject = status === "Ditolak";
  const totalLaporan = penugasan.laporan?.length || 0;
  const laporanDisetujui = penugasan.laporan?.filter((l) => l.status_validasi === "Disetujui").length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Final Validasi Penugasan</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Penugasan Info */}
          <div className="space-y-4 pb-4 border-b">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Penugasan</Label>
              <p className="font-semibold text-base">{penugasan.judul}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Kategori</Label>
                <Badge variant="outline">{penugasan.kategori}</Badge>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Supervisor</Label>
                <p className="text-sm font-medium">{penugasan.supervisor.nama}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Durasi</Label>
                <p className="text-sm">
                  {new Date(penugasan.start_date).toLocaleDateString("id-ID")} -{" "}
                  {penugasan.end_date
                    ? new Date(penugasan.end_date).toLocaleDateString("id-ID")
                    : "TBD"}
                </p>
              </div>
            </div>

            {/* Teknisi List */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Teknisi ({penugasan.teknisi?.length || 0})</Label>
              <div className="flex flex-wrap gap-2">
                {penugasan.teknisi?.map((t) => (
                  <Badge key={t.teknisi_id} variant="secondary">
                    {t.profil.nama}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Laporan Summary */}
          <div className="space-y-3 pb-4 border-b">
            <Label className="text-sm font-medium">Ringkasan Laporan</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border bg-blue-50">
                <p className="text-xs text-muted-foreground">Total Laporan</p>
                <p className="text-2xl font-bold text-blue-700">{totalLaporan}</p>
              </div>
              <div className="p-3 rounded-lg border bg-green-50">
                <p className="text-xs text-muted-foreground">Disetujui SPV</p>
                <p className="text-2xl font-bold text-green-700">{laporanDisetujui}</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Menunggu</p>
                <p className="text-2xl font-bold">{totalLaporan - laporanDisetujui}</p>
              </div>
            </div>
          </div>

          {/* Laporan Timeline (readonly) */}
          {penugasan.laporan && penugasan.laporan.length > 0 && (
            <div className="space-y-3 pb-4 border-b">
              <Label className="text-sm font-medium">Timeline Laporan</Label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {penugasan.laporan
                  .sort((a, b) => new Date(b.tanggal_laporan).getTime() - new Date(a.tanggal_laporan).getTime())
                  .slice(0, 5)
                  .map((laporan) => (
                    <div
                      key={laporan.id}
                      className="p-2 rounded-lg border text-sm bg-muted/30 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {new Date(laporan.tanggal_laporan).toLocaleDateString("id-ID")}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            laporan.status_validasi === "Disetujui"
                              ? "bg-green-50 text-green-700"
                              : "bg-yellow-50 text-yellow-700"
                          }
                        >
                          {laporan.status_validasi}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{laporan.status_progres}</p>
                      {laporan.catatan && (
                        <p className="text-xs italic">{laporan.catatan.slice(0, 60)}...</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Manager Decision */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Keputusan Manager</Label>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setStatus("Selesai");
                  setCatatan("");
                }}
                className={`p-4 rounded-lg border-2 transition ${
                  status === "Selesai"
                    ? "border-green-500 bg-green-50"
                    : "border-muted hover:border-green-200"
                }`}
              >
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Selesaikan</p>
                <p className="text-xs text-muted-foreground">Penugasan tuntas</p>
              </button>

              <button
                onClick={() => setStatus("Ditolak")}
                className={`p-4 rounded-lg border-2 transition ${
                  status === "Ditolak"
                    ? "border-red-500 bg-red-50"
                    : "border-muted hover:border-red-200"
                }`}
              >
                <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Tolak</p>
                <p className="text-xs text-muted-foreground">Perlu revisi</p>
              </button>
            </div>

            {/* Catatan untuk Reject */}
            {isReject && (
              <div className="space-y-2">
                <Label htmlFor="catatan" className="text-sm">
                  Alasan Penolakan *
                </Label>
                <Textarea
                  id="catatan"
                  placeholder="Jelaskan mengapa penugasan ini ditolak..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
                {isReject && !catatan && (
                  <p className="text-xs text-red-600">Alasan penolakan wajib diisi</p>
                )}
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || (isReject && !catatan)}
              className="flex-1"
              variant={status === "Selesai" ? "default" : "destructive"}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {status === "Selesai" ? "Selesaikan Penugasan" : "Tolak Penugasan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
