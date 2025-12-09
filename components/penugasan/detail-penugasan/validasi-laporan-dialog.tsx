"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/ui/location-picker").then((mod) => ({ default: mod.LocationPicker })), {
  ssr: false,
});

interface LaporanItem {
  id: number;
  penugasan_id: number;
  pelapor_id: string;
  tanggal_laporan: string;
  status_progres: string;
  foto_url: string;
  catatan: string;
  status_validasi: string;
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
}

interface ValidasiLaporanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laporan: LaporanItem;
  onSuccess: () => void;
}

export function ValidasiLaporanDialog({
  open,
  onOpenChange,
  laporan,
  onSuccess,
}: ValidasiLaporanDialogProps) {
  const [status, setStatus] = useState<"Disetujui" | "Ditolak">("Disetujui");
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/laporan/${laporan.id}/validasi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_validasi: status,
          catatan_validasi: status === "Ditolak" ? catatan : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memvalidasi laporan");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validasi Laporan Progres</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Laporan Info */}
          <div className="space-y-4 pb-4 border-b">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Penugasan</Label>
              <p className="font-semibold text-sm">{laporan.penugasan.judul}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Teknisi</Label>
                <p className="text-sm font-medium">{laporan.pelapor.nama}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tanggal Laporan</Label>
                <p className="text-sm">
                  {new Date(laporan.tanggal_laporan).toLocaleDateString("id-ID")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Status Progres</Label>
              <Badge variant="outline">{laporan.status_progres}</Badge>
            </div>
          </div>

          {/* Foto Bukti */}
          {laporan.foto_url && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Foto Bukti</Label>
              <div className="rounded-lg border p-3 bg-muted/50">
                <img
                  src={laporan.foto_url}
                  alt="Laporan foto"
                  className="w-full max-h-64 object-cover rounded cursor-pointer hover:opacity-80"
                  onClick={() => window.open(laporan.foto_url, "_blank")}
                />
              </div>
            </div>
          )}

          {/* Catatan Teknisi */}
          {laporan.catatan && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Catatan Teknisi</Label>
              <div className="rounded-lg border p-3 bg-muted/30 text-sm">
                {laporan.catatan}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t" />

          {/* Validasi Decision */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Keputusan</Label>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setStatus("Disetujui");
                  setCatatan("");
                }}
                className={`p-3 rounded-lg border-2 transition ${
                  status === "Disetujui"
                    ? "border-green-500 bg-green-50"
                    : "border-muted hover:border-green-200"
                }`}
              >
                <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Setujui</p>
              </button>

              <button
                onClick={() => setStatus("Ditolak")}
                className={`p-3 rounded-lg border-2 transition ${
                  status === "Ditolak"
                    ? "border-red-500 bg-red-50"
                    : "border-muted hover:border-red-200"
                }`}
              >
                <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Tolak</p>
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
                  placeholder="Jelaskan mengapa laporan ini ditolak..."
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
              variant={status === "Disetujui" ? "default" : "destructive"}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {status === "Disetujui" ? "Setujui Laporan" : "Tolak Laporan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
