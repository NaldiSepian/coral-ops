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
  Wrench,
  RefreshCcw,
  Ruler
} from "lucide-react";
import dynamic from "next/dynamic";
import { LaporanDetail as LaporanDetailType, LaporanDetailResponse } from "@/lib/penugasan/types";

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
  areAllToolPhotosSame: boolean;
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
      style={{ height: '300px', width: '100%' }}
      className="rounded-lg"
      zoomControl={true}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      dragging={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
  areAllToolPhotosSame,
  onRetry,
  onBack
}: LaporanDetailProps) {

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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Container - Main Report Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Status and Progress */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Status Laporan
                </CardTitle>
                <Badge variant={report.status_progres === "Selesai" ? "default" : "secondary"}>
                  {report.status_progres}
                </Badge>
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
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
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
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
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

        {/* Right Container - Tools and Equipment */}
        <div className="space-y-6">
          {/* Tool Photos */}
          {report.tool_photos && report.tool_photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Foto Alat
                </CardTitle>
              </CardHeader>
              <CardContent>
                {areAllToolPhotosSame ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Semua alat menggunakan foto yang sama
                    </p>
                    <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={report.tool_photos[0].foto_url}
                        alt="Foto alat"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    {report.tool_photos.map((toolPhoto, index) => (
                      <div key={index} className="space-y-2">
                        <p className="text-sm font-medium">
                          {toolPhoto.alat?.nama || `Alat ${toolPhoto.alat_id}`}
                        </p>
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={toolPhoto.foto_url}
                            alt={`Foto ${toolPhoto.alat?.nama || `alat ${toolPhoto.alat_id}`}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assignment Tools */}
          {assignment?.alat && assignment.alat.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Alat yang Digunakan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignment.alat.map((alatItem) => (
                    <div key={alatItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {alatItem.alat?.foto_url && (
                          <div className="relative w-10 h-10 rounded overflow-hidden bg-muted">
                            <Image
                              src={alatItem.alat.foto_url}
                              alt={alatItem.alat.nama}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{alatItem.alat?.nama || `Alat ${alatItem.alat_id}`}</p>
                          <p className="text-sm text-muted-foreground">
                            {alatItem.alat?.tipe_alat || "Tipe tidak diketahui"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={alatItem.is_returned ? "secondary" : "default"}>
                          {alatItem.is_returned ? "Sudah Dikembalikan" : "Masih Digunakan"}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Jumlah: {alatItem.jumlah}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
