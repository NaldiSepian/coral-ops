"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Camera,
  RefreshCcw,
  Ruler,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import dynamic from "next/dynamic";
import { LaporanDetail as LaporanDetailType, LaporanDetailResponse } from "@/lib/penugasan/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

interface LaporanDetailProps {
  report: LaporanDetailType | null;
  assignment: LaporanDetailResponse['data']['assignment'] | null;
  loading: boolean;
  error: string | null;
  reportPosition: [number, number] | null;
  assignmentPosition: [number, number] | null;
  locationValidation: {
    distance: number;
    isValid: boolean;
    message: string;
  } | null;
  onRetry: () => void;
  onBack: () => void;
}

// Komponen Map untuk menampilkan lokasi laporan
function ReportLocationMap({ reportPosition, assignmentPosition }: { reportPosition: [number, number]; assignmentPosition?: [number, number] }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={reportPosition}
      zoom={15}
      style={{ height: '400px', width: '100%', zIndex: 1 }}
      className="rounded-lg relative"
      zoomControl={true}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      dragging={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <Marker position={reportPosition}>
        <Popup>
          <div className="text-sm">
            <p><strong>Lokasi Laporan</strong></p>
            <p>Lat: {reportPosition[0].toFixed(6)}</p>
            <p>Lng: {reportPosition[1].toFixed(6)}</p>
          </div>
        </Popup>
      </Marker>
      {assignmentPosition && (
        <Marker position={assignmentPosition}>
          <Popup>
            <div className="text-sm">
              <p><strong>Lokasi Penugasan</strong></p>
              <p>Lat: {assignmentPosition[0].toFixed(6)}</p>
              <p>Lng: {assignmentPosition[1].toFixed(6)}</p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

export default function LaporanDetail({
  report,
  assignment,
  loading,
  error,
  reportPosition,
  assignmentPosition,
  locationValidation,
  onRetry,
  onBack
}: LaporanDetailProps) {
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Fix marker icon paths for Leaflet in client-side
  useEffect(() => {
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: DEFAULT_RETINA_ICON_URL,
        iconUrl: DEFAULT_ICON_URL,
        shadowUrl: DEFAULT_SHADOW_URL,
      });
    });
  }, []);

  // Get location display text
  const getLocationDisplayText = (position: [number, number] | null): string => {
    if (!position) return "Tidak tersedia";
    return `POINT(${position[1].toFixed(6)} ${position[0].toFixed(6)})`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </header>
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="space-y-3 p-4">
              <div className="h-5 w-1/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-32 w-full animate-pulse rounded bg-muted" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">Detail Laporan</h1>
        </header>
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">Detail Laporan</h1>
        </header>
        <Card className="p-8 text-center">
          <p className="text-base font-medium">Laporan tidak ditemukan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Laporan yang Anda cari tidak tersedia atau telah dihapus.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold leading-tight">Detail Laporan Progres</h1>
          <p className="text-sm text-muted-foreground">
            {assignment?.judul || "Penugasan tidak ditemukan"}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-1">
        {/* Main Report Information */}
        <div className="space-y-6">
          {/* Report Status and Progress */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Status Laporan
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={report.status_progres === "Selesai" ? "default" : "secondary"}>
                    {report.status_progres}
                  </Badge>
                  {report.status_validasi && (
                    <Badge variant={report.status_validasi === "Disetujui" ? "secondary" : report.status_validasi === "Ditolak" ? "destructive" : "outline"} className={report.status_validasi === "Menunggu" ? "bg-accent text-accent-foreground border-border" : ""}>
                      {report.status_validasi === "Menunggu" && <AlertCircle className="w-3 h-3 mr-1" />}
                      {report.status_validasi === "Disetujui" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {report.status_validasi === "Ditolak" && <XCircle className="w-3 h-3 mr-1" />}
                      {report.status_validasi === "Menunggu" ? "Menunggu Validasi" : report.status_validasi}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Tanggal Laporan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Persentase Progres
                  </p>
                  <p className="text-sm text-muted-foreground">{report.persentase_progres}%</p>
                </div>
              </div>

              {report.catatan && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Catatan</p>
                  <p className="text-sm text-muted-foreground">{report.catatan}</p>
                </div>
              )}

              {report.status_validasi && report.status_validasi !== "Menunggu" && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium">Informasi Validasi</p>
                  <div className="grid gap-2 sm:grid-cols-2 text-sm">
                    {report.divalidasi_pada && (
                      <div>
                        <span className="text-muted-foreground">Divalidasi pada:</span>
                        <p>{new Date(report.divalidasi_pada).toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</p>
                      </div>
                    )}
                    {report.divalidasi_oleh && (
                      <div>
                        <span className="text-muted-foreground">Divalidasi oleh:</span>
                        <p>{report.divalidasi_oleh}</p>
                      </div>
                    )}
                  </div>
                  {report.catatan_validasi && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">Catatan validasi:</span>
                      <p className="text-sm mt-1 p-2 bg-muted rounded">{report.catatan_validasi}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Information */}
          {(reportPosition || assignmentPosition) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Informasi Lokasi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Lokasi Laporan</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {getLocationDisplayText(reportPosition)}
                    </p>
                  </div>
                  {assignmentPosition && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Lokasi Penugasan</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {getLocationDisplayText(assignmentPosition)}
                      </p>
                    </div>
                  )}
                </div>

                {locationValidation && (
                  <Alert variant={locationValidation.isValid ? "default" : "destructive"}>
                    <AlertDescription>
                      {locationValidation.message}
                    </AlertDescription>
                  </Alert>
                )}

                {reportPosition && (
                  <ReportLocationMap
                    reportPosition={reportPosition}
                    assignmentPosition={assignmentPosition || undefined}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Photo Pairs */}
          {report.pairs && report.pairs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Foto Dokumentasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {report.pairs.map((pair, index) => (
                    <div key={pair.pair_key || index} className="space-y-3">
                      {pair.judul && (
                        <h4 className="font-medium">{pair.judul}</h4>
                      )}
                      {pair.deskripsi && (
                        <p className="text-sm text-muted-foreground">{pair.deskripsi}</p>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2">
                        {pair.before_foto_url && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Sebelum</p>
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewPhoto(pair.before_foto_url!)}>
                              <Image
                                src={pair.before_foto_url}
                                alt="Foto sebelum"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>
                        )}
                        {pair.after_foto_url && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Sesudah</p>
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewPhoto(pair.after_foto_url!)}>
                              <Image
                                src={pair.after_foto_url}
                                alt="Foto sesudah"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      {index < report.pairs!.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PhotoPreviewDialog photoUrl={previewPhoto} onClose={() => setPreviewPhoto(null)} />
    </div>
  );
}

// Photo Preview Dialog Component
function PhotoPreviewDialog({ photoUrl, onClose }: { photoUrl: string | null; onClose: () => void }) {
  if (!photoUrl) return null;

  return (
    <Dialog open={!!photoUrl} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview Foto</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
          <Image
            src={photoUrl}
            alt="Preview foto"
            fill
            className="object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
