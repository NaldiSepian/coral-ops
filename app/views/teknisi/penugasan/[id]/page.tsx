"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PenugasanWithRelations, StatusPenugasan } from "@/lib/penugasan/types";
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
  Package
} from "lucide-react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { KendalaDialog } from "@/components/teknisi/kendala-dialog";
import { ProgressDialog } from "@/components/teknisi/progress-dialog";
import { ReturnToolsDialog } from "@/components/teknisi/return-tools-dialog";
import dynamic from "next/dynamic";

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
      style={{ height: '250px', width: '100%' }}
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

interface ProgressReport {
  id: number;
  status_progres: string;
  catatan: string;
  foto_url: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  pairs?: Array<{
    id?: number;
    pair_key: string;
    judul?: string;
    deskripsi?: string;
    before?: { foto_url: string };
    after?: { foto_url: string };
  }>;
}

export default function TeknisiAssignmentDetail() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;
  const supabase = useMemo(() => createSupabaseClient(), []);

  const [assignment, setAssignment] = useState<PenugasanWithRelations | null>(null);
  const [progressReports, setProgressReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [kendalaDialogOpen, setKendalaDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const HEX_STRING_REGEX = /^[0-9a-fA-F]+$/;

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

  // Minimal EWKB parser for POINT geometries (SRID optional)
  function parseWkbPoint(hexString: string): [number, number] | null {
    const normalized = hexString?.trim();
    if (!normalized || normalized.length < 34 || normalized.length % 2 !== 0) {
      return null;
    }

    if (!HEX_STRING_REGEX.test(normalized)) {
      return null;
    }

    try {
      const buffer = new ArrayBuffer(normalized.length / 2);
      const bytes = new Uint8Array(buffer);

      for (let i = 0; i < normalized.length; i += 2) {
        bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
      }

      const view = new DataView(buffer);
      const littleEndian = view.getUint8(0) === 1;
      let offset = 1;

      const type = view.getUint32(offset, littleEndian);
      offset += 4;

      const hasSrid = (type & 0x20000000) !== 0;
      const geometryType = type & 0xFF;
      if (geometryType !== 1) {
        return null;
      }

      if (hasSrid) {
        offset += 4; // Skip SRID
      }

      if (offset + 16 > view.byteLength) {
        return null;
      }

      const longitude = view.getFloat64(offset, littleEndian);
      offset += 8;
      const latitude = view.getFloat64(offset, littleEndian);

      return [latitude, longitude];
    } catch (error) {
      console.warn('Failed to parse WKB location value', error);
      return null;
    }
  }

  // Convert location data to display format POINT(longitude latitude)
  const getLocationDisplayText = (locationData: any): string => {
    if (!locationData) return 'Lokasi tidak ditentukan';

    if (typeof locationData === 'string') {
      if (HEX_STRING_REGEX.test(locationData.trim())) {
        const coords = parseWkbPoint(locationData);
        if (coords) {
          const [lat, lng] = coords;
          return `POINT(${lng.toFixed(6)} ${lat.toFixed(6)})`;
        }
      }

      // Handle EWKT format: SRID=4326;POINT(longitude latitude)
      if (locationData.includes('SRID=')) {
        const wktPart = locationData.split(';')[1];
        if (wktPart) {
          const match = wktPart.match(/POINT\(([^ ]+) ([^)]+)\)/);
          if (match) {
            const longitude = parseFloat(match[1]);
            const latitude = parseFloat(match[2]);
            return `POINT(${longitude.toFixed(6)} ${latitude.toFixed(6)})`;
          }
        }
      }

      const match = locationData.match(/POINT\(([^ ]+) ([^)]+)\)/);
      if (match) {
        const longitude = parseFloat(match[1]);
        const latitude = parseFloat(match[2]);
        return `POINT(${longitude.toFixed(6)} ${latitude.toFixed(6)})`;
      }

      try {
        const geoJson = JSON.parse(locationData);
        if (geoJson.type === 'Point' && Array.isArray(geoJson.coordinates) && geoJson.coordinates.length === 2) {
          const [longitude, latitude] = geoJson.coordinates;
          return `POINT(${longitude.toFixed(6)} ${latitude.toFixed(6)})`;
        }
      } catch (e) {}

    } else if (typeof locationData === 'object' && locationData.coordinates) {
      // PostGIS format: { type: "Point", coordinates: [longitude, latitude] }
      const [longitude, latitude] = locationData.coordinates;
      if (typeof longitude === 'number' && typeof latitude === 'number') {
        return `POINT(${longitude.toFixed(6)} ${latitude.toFixed(6)})`;
      }
    } else if (Array.isArray(locationData) && locationData.length === 2) {
      const [longitude, latitude] = locationData;
      if (typeof longitude === 'number' && typeof latitude === 'number') {
        return `POINT(${longitude.toFixed(6)} ${latitude.toFixed(6)})`;
      }
    }

    return 'Lokasi tidak ditentukan';
  };

  // Parse location data to coordinates
  const parseLocation = (locationData: any): [number, number] | null => {
    if (!locationData) return null;

    if (typeof locationData === 'string') {
      if (HEX_STRING_REGEX.test(locationData.trim())) {
        return parseWkbPoint(locationData);
      }

      // Handle EWKT format: SRID=4326;POINT(longitude latitude)
      if (locationData.includes('SRID=')) {
        const wktPart = locationData.split(';')[1];
        if (wktPart) {
          const match = wktPart.match(/POINT\(([^ ]+) ([^)]+)\)/);
          if (match) {
            const longitude = parseFloat(match[1]);
            const latitude = parseFloat(match[2]);
            return [latitude, longitude];
          }
        }
      }

      const match = locationData.match(/POINT\(([^ ]+) ([^)]+)\)/);
      if (match) {
        const longitude = parseFloat(match[1]);
        const latitude = parseFloat(match[2]);
        return [latitude, longitude];
      }

      try {
        const geoJson = JSON.parse(locationData);
        if (geoJson.type === 'Point' && Array.isArray(geoJson.coordinates) && geoJson.coordinates.length === 2) {
          const [longitude, latitude] = geoJson.coordinates;
          return [latitude, longitude];
        }
      } catch (e) {}

    } else if (typeof locationData === 'object' && locationData.coordinates) {
      // PostGIS format: { type: "Point", coordinates: [longitude, latitude] }
      const [longitude, latitude] = locationData.coordinates;
      if (typeof longitude === 'number' && typeof latitude === 'number') {
        return [latitude, longitude];
      }
    } else if (Array.isArray(locationData) && locationData.length === 2) {
      const [longitude, latitude] = locationData;
      if (typeof longitude === 'number' && typeof latitude === 'number') {
        return [latitude, longitude];
      }
    }

    return null;
  };

  const groupBuktiLaporan = (buktiLaporan: any[]) => {
    if (!Array.isArray(buktiLaporan) || buktiLaporan.length === 0) {
      return [];
    }
    
    const grouped: { [key: string]: any } = {};
    
    buktiLaporan.forEach((item) => {
      if (!item || !item.pair_key) return;
      
      const key = item.pair_key;
      if (!grouped[key]) {
        grouped[key] = {
          id: item.id,
          pair_key: key,
          judul: item.judul,
          deskripsi: item.deskripsi,
        };
      }
      
      if (item.tipe === 'Before') {
        grouped[key].before = { foto_url: item.foto_url };
      } else if (item.tipe === 'After') {
        grouped[key].after = { foto_url: item.foto_url };
      }
    });
    
    return Object.values(grouped);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.user?.id || null);
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const fetchAssignmentDetail = useCallback(async () => {
    if (!assignmentId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/teknisi/penugasan/${assignmentId}?include=supervisor,teknisi,alat,laporan_progres,kehadiran,perpanjangan`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Gagal memuat detail penugasan");
      }

      setAssignment(payload.data);
      
      // Process progress reports with grouped pairs
      const processedReports = (payload.data.laporan_progres || []).map((report: any) => {
        return {
          ...report,
          // Ensure latitude and longitude are proper numbers
          latitude: typeof report.latitude === 'number' ? report.latitude : null,
          longitude: typeof report.longitude === 'number' ? report.longitude : null,
          // Group pairs by pair_key and organize by type (before/after)
          // bukti_laporan is the actual table name
          pairs: groupBuktiLaporan(report.bukti_laporan || [])
        };
      });
      
      setProgressReports(processedReports);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat detail penugasan";
      setError(errorMessage);
      console.error('Error fetching assignment detail:', err);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchAssignmentDetail();
  }, [fetchAssignmentDetail]);

  const hasFinalProgress = (assignment: PenugasanWithRelations) =>
    (assignment.laporan_progres || []).some((report) => report.status_progres === "Selesai");

  const assignmentHasActiveTools = (assignment: PenugasanWithRelations) =>
    (assignment.alat || []).some((item) => !item.is_returned);

  const getActiveTools = (assignment: PenugasanWithRelations) =>
    (assignment.alat?.filter((item) => !item.is_returned) ?? []);

  const isReportLocked = (assignment: PenugasanWithRelations) =>
    assignment.status !== "Aktif" || hasFinalProgress(assignment);

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

  const getWarningMessage = (assignment: PenugasanWithRelations): string | null => {
    if (assignment.status === "Menunggu Validasi") {
      return "Menunggu validasi supervisor & manager untuk memastikan pekerjaan selesai";
    }
    const pendingKendala = assignment.perpanjangan?.find((item) => item.status === "Menunggu");
    if (pendingKendala) {
      return "Pengajuan kendala/perpanjangan sedang menunggu respon supervisor";
    }
    return null;
  };

  const activeTools = useMemo(() => assignment ? getActiveTools(assignment) : [], [assignment?.alat]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
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
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error || "Penugasan tidak ditemukan"}</span>
            <Button variant="outline" size="sm" onClick={fetchAssignmentDetail}>
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const warningMessage = getWarningMessage(assignment);
  const attendanceStatus = progressReports.length > 0 ? progressReports[progressReports.length - 1].status_progres : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
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
          onClick={() => setProgressDialogOpen(true)}
          disabled={isReportLocked(assignment)}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Laporkan Progres
        </Button>
        <Button
          variant="outline"
          onClick={() => setKendalaDialogOpen(true)}
          disabled={isReportLocked(assignment)}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Ajukan Kendala
        </Button>
        {activeTools.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setReturnDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Kembalikan Alat ({activeTools.length})
          </Button>
        )}
        <Button variant="outline" onClick={fetchAssignmentDetail} className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" />
          Refresh
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
                          <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
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
                          Qty: {tool.jumlah} • {tool.is_returned ? "Sudah dikembalikan" : "Belum dikembalikan"}
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

          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Anggota Tim
                <Badge variant="outline" className="ml-auto">
                  {assignment.teknisi?.length || 0} orang
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignment.teknisi && assignment.teknisi.length > 0 ? (
                <div className="space-y-3">
                  {assignment.teknisi.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{member.profil?.nama || "Tidak ada nama"}</p>
                        <p className="text-xs text-muted-foreground">Teknisi</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Tidak ada anggota tim</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Progres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Laporan</span>
                  <span className="font-medium">{progressReports.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status Terakhir</span>
                  <Badge className={attendanceStatus ? getProgressColor(attendanceStatus) : "bg-muted"}>
                    {attendanceStatus || "Belum ada"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Alat Aktif</span>
                  <span className="font-medium">{activeTools.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <KendalaDialog
        open={kendalaDialogOpen}
        onOpenChange={setKendalaDialogOpen}
        assignmentId={assignment.id}
        userId={userId}
        onSuccess={() => {
          fetchAssignmentDetail();
        }}
      />
      <ProgressDialog
        open={progressDialogOpen}
        onOpenChange={setProgressDialogOpen}
        assignmentId={assignment.id}
        userId={userId}
        onSuccess={() => {
          fetchAssignmentDetail();
        }}
      />
      <ReturnToolsDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        assignmentId={assignment.id}
        userId={userId}
        tools={activeTools}
        onSuccess={() => {
          fetchAssignmentDetail();
        }}
      />
    </div>
  );
}