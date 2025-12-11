"use client";

import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, AlertCircle, CheckCircle, Camera, Ruler, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import { parseLocation, calculateDistance } from "@/lib/utils/location";
import { ReportLocationMap } from "@/components/shared/report-location-map";

const LocationPicker = dynamic(() => import("@/components/ui/location-picker").then((mod) => ({ default: mod.LocationPicker })), {
  ssr: false,
});

// Dynamic import untuk MapComponent
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

const DEFAULT_ICON_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png';
const DEFAULT_RETINA_ICON_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png';
const DEFAULT_SHADOW_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

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

  // Location validation
  const reportLocation = useMemo(() => {
    if (laporan.titik_gps) {
      return parseLocation(laporan.titik_gps);
    }
    return null;
  }, [laporan.titik_gps]);

  const assignmentLocation = useMemo(() => {
    if (laporan.penugasan.lokasi) {
      return parseLocation(laporan.penugasan.lokasi);
    }
    return null;
  }, [laporan.penugasan.lokasi]);

  const distance = useMemo(() => {
    if (reportLocation && assignmentLocation) {
      return calculateDistance(
        reportLocation[0], reportLocation[1],
        assignmentLocation[0], assignmentLocation[1]
      );
    }
    return null;
  }, [reportLocation, assignmentLocation]);

  const isLocationValid = useMemo(() => {
    if (!distance) return true; // If no location data, assume valid
    return distance <= 100; // Within 100 meters
  }, [distance]);

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <div className="flex items-center gap-2">
                <Badge variant="outline">{laporan.status_progres}</Badge>
                {laporan.persentase_progres != null && (
                  <Badge className="font-semibold bg-primary text-primary-foreground">
                    {laporan.persentase_progres}%
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Location Validation */}
          {reportLocation && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Validasi Lokasi
              </Label>

              {!isLocationValid && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Lokasi laporan berada {distance?.toFixed(1)} meter dari lokasi penugasan.
                    Pastikan teknisi berada di lokasi yang benar.
                  </AlertDescription>
                </Alert>
              )}

              {isLocationValid && distance !== null && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Lokasi laporan valid ({distance.toFixed(1)} meter dari lokasi penugasan).
                  </AlertDescription>
                </Alert>
              )}

              <ReportLocationMap
                reportPosition={reportLocation}
                assignmentPosition={assignmentLocation || undefined}
              />
            </div>
          )}

          {/* Bukti Laporan (Before/After Photos) */}
          {laporan.bukti_laporan && laporan.bukti_laporan.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Bukti Laporan
              </Label>
              <div className="space-y-4">
                {laporan.bukti_laporan.map((bukti) => (
                  <div key={bukti.id} className="space-y-2">
                    {bukti.judul && (
                      <h4 className="font-medium text-sm">{bukti.judul}</h4>
                    )}
                    {bukti.deskripsi && (
                      <p className="text-sm text-muted-foreground">{bukti.deskripsi}</p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Sebelum</Label>
                        <div className="rounded-lg border p-2 bg-muted/50">
                          <img
                            src={bukti.before_foto_url}
                            alt="Before"
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => window.open(bukti.before_foto_url, "_blank")}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Sesudah</Label>
                        <div className="rounded-lg border p-2 bg-muted/50">
                          <img
                            src={bukti.after_foto_url}
                            alt="After"
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => window.open(bukti.after_foto_url, "_blank")}
                          />
                        </div>
                      </div>
                    </div>
                    {bukti.taken_at && (
                      <p className="text-xs text-muted-foreground">
                        Diambil pada: {new Date(bukti.taken_at).toLocaleString("id-ID")}
                        {bukti.taken_by && ` oleh ${bukti.taken_by}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legacy Foto Bukti (fallback) */}
          {laporan.foto_url && (!laporan.bukti_laporan || laporan.bukti_laporan.length === 0) && (
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
