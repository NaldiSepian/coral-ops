"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PenugasanWithRelations, StatusPenugasan } from "@/lib/penugasan/types";
import { parseLocation, getLocationDisplayText, parseWkbPoint } from "@/lib/utils/location";
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
  User,
  Wrench,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCcw,
  Camera,
  MessageSquare,
  Package,
  XCircle
} from "lucide-react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Dynamic import untuk MapComponent
const MapContainer = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Marker })), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Popup })), { ssr: false });

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

const DEFAULT_ICON_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png';
const DEFAULT_RETINA_ICON_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png';
const DEFAULT_SHADOW_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

interface ProgressReport {
  id: number;
  status_progres: string;
  catatan: string;
  foto_url: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  persentase_progres: number;
  status_validasi: string | null;
  divalidasi_oleh: string | null;
  divalidasi_pada: string | null;
  catatan_validasi: string | null;
  pairs?: Array<{
    id?: number;
    pair_key: string;
    judul?: string;
    deskripsi?: string;
    before_foto_url?: string;
    after_foto_url?: string;
  }>;
}

interface PenugasanDetailProps {
  assignment: PenugasanWithRelations | null;
  progressReports: ProgressReport[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
  onProgressClick: () => void;
  onKendalaClick: () => void;
  onReturnClick: () => void;
  isReportLocked: boolean;
  activeTools: Array<{
    id: number;
    alat_id: number;
    jumlah: number;
    is_returned: boolean;
    alat?: {
      nama: string;
      foto_url?: string;
      tipe_alat?: string;
    };
  }>;
  warningMessage: string | null;
  attendanceStatus: string | null;
}

// Komponen Map untuk menampilkan lokasi (readonly)
function LocationMap({ position }: { position: [number, number] }) {
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
      center={position}
      zoom={15}
      style={{ height: '250px', width: '100%', zIndex: 1 }}
      className="rounded-lg"
      zoomControl={true}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      dragging={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <Marker position={position}>
        <Popup>
          <div className="text-sm">
            <p><strong>Lokasi Penugasan</strong></p>
            <p>Latitude: {position[0].toFixed(6)}</p>
            <p>Longitude: {position[1].toFixed(6)}</p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}

export default function PenugasanDetail({
  assignment,
  progressReports,
  loading,
  error,
  onRetry,
  onBack,
  onProgressClick,
  onKendalaClick,
  onReturnClick,
  isReportLocked,
  activeTools,
  warningMessage,
  attendanceStatus
}: PenugasanDetailProps) {
  const router = useRouter();
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Check if all tool photos are the same
  const areAllToolPhotosSame = useMemo(() => {
    if (!assignment?.tool_photos || assignment.tool_photos.length === 0) return false;

    const firstPhoto = assignment.tool_photos[0].foto_url;
    return assignment.tool_photos.every(photo => photo.foto_url === firstPhoto);
  }, [assignment?.tool_photos]);

  // Check if all return tool photos are the same
  const areAllReturnToolPhotosSame = useMemo(() => {
    if (!assignment?.return_tool_photos || assignment.return_tool_photos.length === 0) return false;

    const firstPhoto = assignment.return_tool_photos[0].foto_url;
    return assignment.return_tool_photos.every(photo => photo.foto_url === firstPhoto);
  }, [assignment?.return_tool_photos]);

  // Group return tool photos by URL
  const groupedReturnToolPhotos = useMemo(() => {
    if (!assignment?.return_tool_photos || assignment.return_tool_photos.length === 0) return {};

    const groups: { [key: string]: Array<{ alat_id: number; foto_url: string; alat?: { nama: string; tipe_alat?: string; } }> } = {};

    assignment.return_tool_photos.forEach((photo) => {
      if (!groups[photo.foto_url]) {
        groups[photo.foto_url] = [];
      }
      groups[photo.foto_url].push(photo);
    });

    return groups;
  }, [assignment?.return_tool_photos]);

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

  const HEX_STRING_REGEX = /^[0-9a-fA-F]+$/;

  const getStatusColor = (status: StatusPenugasan) => {
    switch (status) {
      case "Aktif":
        return "bg-primary text-primary-foreground";
      case "Menunggu Validasi":
        return "bg-secondary text-secondary-foreground";
      case "Selesai":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Dibatalkan":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Ditolak":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "Selesai":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Sedang Dikerjakan":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Hampir Selesai":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Menunggu":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
        <div className="space-y-4">
          <Card className="space-y-3 p-6">
            <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="space-y-3 p-4">
                <div className="h-5 w-1/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error || "Penugasan tidak ditemukan"}</span>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold leading-tight">{assignment.judul}</h1>
            <p className="text-sm text-muted-foreground">
              ID: {assignment.id} • {assignment.kategori}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(assignment.status)}>
            {assignment.status}
          </Badge>
          {attendanceStatus && (
            <Badge variant="outline" className={getProgressColor(attendanceStatus)}>
              {attendanceStatus}
            </Badge>
          )}
        </div>
      </div>

      {/* Warning Alert */}
      {warningMessage && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{warningMessage}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onProgressClick}
          disabled={isReportLocked}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Laporkan Progres
        </Button>
        <Button
          variant="outline"
          onClick={onKendalaClick}
          disabled={isReportLocked}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Ajukan Kendala
        </Button>
        {activeTools.length > 0 && (
          <Button
            variant="outline"
            onClick={onReturnClick}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Kembalikan Alat ({activeTools.length})
          </Button>
        )}
        <Button variant="outline" onClick={onRetry} className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" />
          
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Assignment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detail Penugasan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Tanggal Mulai
                  </div>
                  <p className="font-medium">{formatDate(assignment.start_date)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Tanggal Selesai
                  </div>
                  <p className="font-medium">{assignment.end_date ? formatDate(assignment.end_date) : "Belum ditetapkan"}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center mb-2 gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Lokasi
                  </div>
                  {(() => {
                    const coords = parseLocation(assignment.lokasi_text || assignment.lokasi);
                    const locationText = getLocationDisplayText(assignment.lokasi_text || assignment.lokasi);
                    return coords ? (
                      <a
                        href={`https://www.google.com/maps?q=${coords[0]},${coords[1]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                      >
                        {locationText}
                      </a>
                    ) : (
                      <p className="font-medium">{locationText}</p>
                    );
                  })()}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    Supervisor
                  </div>
                  <p className="font-medium">{assignment.supervisor?.nama || "Tidak ditentukan"}</p>
                </div>
              </div>

              <Separator />

              {/* Team Members */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium">Teknisi</h4>
                  <Badge variant="outline" className="text-xs">
                    {assignment.teknisi?.length || 0} orang
                  </Badge>
                </div>
                {assignment.teknisi && assignment.teknisi.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {assignment.teknisi.map((member, index) => (
                      <span key={member.id} className="inline-flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-md text-sm">
                        <User className="h-3 w-3" />
                        {member.profil?.nama || "Tidak ada nama"}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <User className="h-6 w-6 mx-auto mb-1 opacity-50" />
                    <p>Tidak ada anggota tim</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Informasi Tambahan</h4>
                <p className="text-sm text-muted-foreground">
                  Kategori: {assignment.kategori} • Frekuensi: {assignment.frekuensi_laporan}
                </p>
                {assignment.is_extended && (
                  <p className="text-sm text-primary">Penugasan ini telah diperpanjang</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location Map */}
          {(() => {
            const coords = parseLocation(assignment.lokasi_text || assignment.lokasi);
            return coords ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Lokasi Penugasan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationMap position={coords} />
                </CardContent>
              </Card>
            ) : null;
          })()}

          {/* Progress Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Timeline Progres
                <Badge variant="outline" className="ml-auto">
                  {progressReports.length} laporan
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progressReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada laporan progres</p>
                  <p className="text-sm">Mulai laporkan progres pekerjaan Anda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {progressReports.map((report, index) => (
                    <div key={report.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-primary p-2">
                          <CheckCircle className="h-4 w-4 text-primary-foreground" />
                        </div>
                        {index < progressReports.length - 1 && (
                          <div className="w-px h-8 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getProgressColor(report.status_progres)}>
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
                            <span className="text-sm text-muted-foreground">
                              {formatDate(report.created_at)} • {formatTime(report.created_at)}
                            </span>
                          </div>
                        </div>

                        {report.catatan && (
                          <p className="text-sm text-muted-foreground">{report.catatan}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {report.latitude && report.longitude ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Lokasi tidak tersedia
                            </div>
                          )}
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary hover:text-primary/80 underline underline-offset-2"
                            onClick={() => router.push(`/views/teknisi/laporan/${report.id}`)}
                          >
                            Lihat Detail
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tool Photos */}
          {assignment?.tool_photos && assignment.tool_photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Foto Pengambilan Alat
                </CardTitle>
              </CardHeader>
              <CardContent>
                {areAllToolPhotosSame ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Semua alat menggunakan foto yang sama
                    </p>
                    <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewPhoto(assignment.tool_photos?.[0]?.foto_url || null)}>
                      <Image
                        src={assignment.tool_photos[0].foto_url}
                        alt="Foto alat"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    {assignment.tool_photos.map((toolPhoto, index) => (
                      <div key={index} className="space-y-2">
                        <p className="text-sm font-medium">
                          {toolPhoto.alat?.nama || `Alat ${toolPhoto.alat_id}`}
                        </p>
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewPhoto(toolPhoto.foto_url)}>
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

          {/* Return Tool Photos */}
          {assignment?.return_tool_photos && assignment.return_tool_photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Foto Pengembalian Alat
                </CardTitle>
              </CardHeader>
              <CardContent>
                {areAllReturnToolPhotosSame ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Semua alat menggunakan foto bukti yang sama
                    </p>
                    <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewPhoto(assignment.return_tool_photos?.[0]?.foto_url || null)}>
                      <Image
                        src={assignment.return_tool_photos[0].foto_url}
                        alt="Bukti pengembalian alat"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(groupedReturnToolPhotos).map(([fotoUrl, photos]) => {
                        const toolNames = photos.map(p => p.alat?.nama || `Alat ${p.alat_id}`).join(', ');
                        return (
                          <div key={fotoUrl} className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              {toolNames}
                            </p>
                            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewPhoto(fotoUrl)}>
                              <Image
                                src={fotoUrl}
                                alt={`Bukti pengembalian ${toolNames}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Alat yang Digunakan
                <Badge variant="outline" className="ml-auto">
                  {assignment.alat?.length || 0} alat
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignment.alat && assignment.alat.length > 0 ? (
                <div className="space-y-3">
                  {assignment.alat.map((tool) => (
                    <div key={tool.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      {/* Foto Alat */}
                      <div className="flex-shrink-0">
                        {tool.alat?.foto_url ? (
                          <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewPhoto(tool.alat!.foto_url!); }}>
                            <img
                              src={tool.alat.foto_url}
                              alt={tool.alat.nama}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling!.classList.remove('hidden');
                              }}
                            />
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center hidden">
                              <Wrench className="h-6 w-6 text-muted-foreground" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Wrench className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      {/* Info Alat */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{tool.alat?.nama || `Alat ${tool.alat_id}`}</p>
                        {tool.alat?.tipe_alat && (
                          <p className="text-xs text-muted-foreground">{tool.alat.tipe_alat}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Qty: {tool.jumlah}
                        </p>
                      </div>
                      
                      <Badge variant={tool.is_returned ? "default" : "secondary"} className="text-xs flex-shrink-0">
                        {tool.is_returned ? "Returned" : "Active"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Tidak ada alat yang ditugaskan</p>
                </div>
              )}
            </CardContent>
          </Card>

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