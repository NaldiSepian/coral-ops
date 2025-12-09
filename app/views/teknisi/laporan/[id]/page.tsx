"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";

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

interface ProgressReportDetail {
  id: number;
  status_progres: string;
  catatan: string;
  foto_url: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  persentase_progres: number;
  pairs?: Array<{
    id?: number;
    pair_key: string;
    judul?: string;
    deskripsi?: string;
    before?: { foto_url: string };
    after?: { foto_url: string };
  }>;
  tool_photos?: Array<{
    alat_id: number;
    foto_url: string;
    alat?: {
      nama: string;
      foto_url?: string;
      tipe_alat?: string;
    };
  }>;
}

interface AssignmentDetail {
  id: number;
  judul: string;
  lokasi: any;
  lokasi_text: string;
  alat: Array<{
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
}

export default function ProgressReportDetail() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  const supabase = useMemo(() => createSupabaseClient(), []);

  const [report, setReport] = useState<ProgressReportDetail | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Parse location data
  const parseLocation = (locationData: any): [number, number] | null => {
    if (!locationData) return null;

    if (typeof locationData === 'string') {
      const HEX_STRING_REGEX = /^[0-9a-fA-F]+$/;
      if (HEX_STRING_REGEX.test(locationData.trim())) {
        const normalized = locationData.trim();
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
          if (geometryType !== 1) return null;

          if (hasSrid) offset += 4;

          if (offset + 16 > view.byteLength) return null;

          const longitude = view.getFloat64(offset, littleEndian);
          offset += 8;
          const latitude = view.getFloat64(offset, littleEndian);

          return [latitude, longitude];
        } catch (error) {
          console.warn('Failed to parse WKB location value', error);
          return null;
        }
      }

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

  const fetchReportDetail = useCallback(async () => {
    if (!reportId) return;

    setLoading(true);
    setError(null);
    try {
      // First get the report to find the assignment ID
      const { data: reportData, error: reportError } = await supabase
        .from("laporan_progres")
        .select("*, penugasan_id")
        .eq("id", parseInt(reportId))
        .single();

      if (reportError || !reportData) {
        throw new Error("Laporan tidak ditemukan");
      }

      const assignmentId = reportData.penugasan_id;

      // Fetch report detail with related data
      const response = await fetch(`/api/teknisi/laporan/${reportId}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Gagal memuat detail laporan");
      }

      setReport(payload.data.report);
      setAssignment(payload.data.assignment);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat detail laporan";
      setError(errorMessage);
      console.error('Error fetching report detail:', err);
    } finally {
      setLoading(false);
    }
  }, [reportId, supabase]);

  useEffect(() => {
    fetchReportDetail();
  }, [fetchReportDetail]);

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
        </div>
      </div>
    );
  }

  if (error || !report || !assignment) {
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
            <span>{error || "Laporan tidak ditemukan"}</span>
            <Button variant="outline" size="sm" onClick={fetchReportDetail}>
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const reportCoords = report.latitude && report.longitude ? [report.latitude, report.longitude] as [number, number] : null;
  const assignmentCoords = parseLocation(assignment.lokasi_text || assignment.lokasi);

  // Calculate distance
  const distance = reportCoords && assignmentCoords
    ? calculateDistance(reportCoords[0], reportCoords[1], assignmentCoords[0], assignmentCoords[1])
    : null;

  const isFirstReport = (report.tool_photos?.length || 0) > 0;

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
            <h1 className="text-2xl font-bold leading-tight">Detail Laporan Progres</h1>
            <p className="text-sm text-muted-foreground">
              {assignment.judul} • Laporan #{report.id}
            </p>
          </div>
        </div>
        <Badge className={getProgressColor(report.status_progres)}>
          {report.status_progres}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Report Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detail Laporan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Tanggal Laporan
                  </div>
                  <p className="font-medium">{formatDate(report.created_at)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Waktu Laporan
                  </div>
                  <p className="font-medium">{formatTime(report.created_at)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Persentase Progres
                  </div>
                  <p className="font-medium">{report.persentase_progres}%</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Lokasi Laporan
                  </div>
                  {reportCoords ? (
                    <div>
                      <p className="font-medium">
                        {reportCoords[0].toFixed(6)}, {reportCoords[1].toFixed(6)}
                      </p>
                      {distance !== null && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Ruler className="h-3 w-3" />
                          {distance < 1
                            ? `${(distance * 1000).toFixed(0)}m dari lokasi penugasan`
                            : `${distance.toFixed(2)}km dari lokasi penugasan`
                          }
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium text-muted-foreground">Lokasi tidak tersedia</p>
                  )}
                </div>
              </div>

              <Separator />

              {report.catatan && (
                <div className="space-y-2">
                  <h4 className="font-medium">Catatan</h4>
                  <p className="text-sm text-muted-foreground">{report.catatan}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Map */}
          {reportCoords && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Lokasi Laporan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReportLocationMap
                  reportPosition={reportCoords}
                  assignmentPosition={assignmentCoords || undefined}
                />
                {assignmentCoords && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Marker biru: Lokasi laporan • Marker merah: Lokasi penugasan
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tool Pickup Photos - Only for first report */}
          {isFirstReport && report.tool_photos && report.tool_photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Bukti Pengambilan Alat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {report.tool_photos.map((toolPhoto) => (
                    <div key={toolPhoto.alat_id} className="space-y-2">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                        <Image
                          src={toolPhoto.foto_url}
                          alt={`Pengambilan ${toolPhoto.alat?.nama || `Alat ${toolPhoto.alat_id}`}`}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover"
                          onClick={() => window.open(toolPhoto.foto_url, '_blank')}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTIwTDE2NSAxMzVMMTgwIDEyMEwxOTUgMTM1TDE4MCAxNTBMMTY1IDEzNUwxODAgMTIwTDE1MCAxMzVMMjE1IDEyMEwxNTAgMTIwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=';
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{toolPhoto.alat?.nama || `Alat ${toolPhoto.alat_id}`}</p>
                        {toolPhoto.alat?.tipe_alat && (
                          <p className="text-xs text-muted-foreground">{toolPhoto.alat.tipe_alat}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Before/After Pairs */}
          {report.pairs && report.pairs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Dokumentasi Before/After
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.pairs.map((pair, index) => (
                    <div key={index} className="space-y-3">
                      {pair.judul && (
                        <h4 className="font-medium">{pair.judul}</h4>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2">
                        {pair.before && (
                          <div className="space-y-2">
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative">
                              <Image
                                src={pair.before.foto_url}
                                alt="Before"
                                width={400}
                                height={300}
                                className="w-full h-full object-cover"
                                onClick={() => pair.before && window.open(pair.before.foto_url, '_blank')}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTIwTDIxNSAxMzVMMjMwIDEyMEwyNDUgMTM1TDIzMCAxNTBMMjE1IDEzNUwyMzAgMTIwTDIwMCAxMzVMMjE1IDEyMEwyMDAgMTIwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=';
                                }}
                              />
                              <div className="absolute top-2 left-2 bg-black/80 text-white text-sm font-semibold px-3 py-1 rounded-md shadow-lg border border-white/20">
                                BEFORE
                              </div>
                            </div>
                          </div>
                        )}
                        {pair.after && (
                          <div className="space-y-2">
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative">
                              <Image
                                src={pair.after.foto_url}
                                alt="After"
                                width={400}
                                height={300}
                                className="w-full h-full object-cover"
                                onClick={() => pair.after && window.open(pair.after.foto_url, '_blank')}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTIwTDIxNSAxMzVMMjMwIDEyMEwyNDUgMTM1TDIzMCAxNTBMMjE1IDEzNUwyMzAgMTIwTDIwMCAxMzVMMjE1IDEyMEwyMDAgMTIwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=';
                                }}
                              />
                              <div className="absolute top-2 right-2 bg-green-600/90 text-white text-sm font-semibold px-3 py-1 rounded-md shadow-lg border border-white/20">
                                AFTER
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {pair.deskripsi && (
                        <p className="text-sm text-muted-foreground">{pair.deskripsi}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Photo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Foto Bukti Utama
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                <Image
                  src={report.foto_url}
                  alt="Foto bukti laporan"
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                  onClick={() => window.open(report.foto_url, '_blank')}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MDAgMjQwTDQzMCAzMTVMMzcwIDI0MEw0MDAgMzE1TDQzMCAzMTVMMzcwIDMxNUw0MDAgMjQwTDM3MCAzMTVMMDMwIDI0MEw0MDAgMjQwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=';
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tools Used */}
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

          {/* Report Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Laporan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Status</span>
                  <Badge className={getProgressColor(report.status_progres)}>
                    {report.status_progres}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Persentase</span>
                  <span className="font-medium">{report.persentase_progres}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Foto Before/After</span>
                  <span className="font-medium">{report.pairs?.length || 0} pasang</span>
                </div>
                {isFirstReport && (
                  <div className="flex justify-between text-sm">
                    <span>Foto Pengambilan Alat</span>
                    <span className="font-medium">{report.tool_photos?.length || 0} foto</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}