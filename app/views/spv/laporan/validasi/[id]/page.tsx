"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Camera,
  Wrench,
  RefreshCcw,
  Ruler,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Check,
  X,
  Download
} from "lucide-react";
import dynamic from "next/dynamic";
import { parseLocation, calculateDistance, getLocationDisplayText } from "@/lib/utils/location";
import { ReportLocationMap } from "@/components/shared/report-location-map";

interface LaporanDetail {
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
  tool_photos?: Array<{
    id: number;
    foto_url: string;
    alat_id: number;
    alat?: {
      nama: string;
      tipe_alat: string;
    };
  }>;
  return_tool_photos?: Array<{
    id: number;
    foto_url: string;
    alat_id: number;
    alat?: {
      nama: string;
      tipe_alat: string;
    };
  }>;
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

interface AssignmentDetail {
  id: number;
  judul: string;
  kategori: string;
  supervisor_id: string;
  status: string;
  is_deleted: boolean;
  lokasi?: string;
  alat?: Array<{
    id: number;
    alat_id: number;
    jumlah: number;
    is_returned: boolean;
    alat?: {
      id: number;
      nama: string;
      tipe_alat: string;
      foto_url?: string;
    };
  }>;
  teknisi?: Array<{
    id: number;
    teknisi_id: string;
    profil?: {
      nama: string;
      peran: string;
    };
  }>;
}

export default function ValidasiLaporanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const laporanId = params.id as string;

  const [laporan, setLaporan] = useState<LaporanDetail | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validation dialog states
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationAction, setValidationAction] = useState<'approve' | 'reject' | null>(null);
  const [validationNote, setValidationNote] = useState('');
  const [validating, setValidating] = useState(false);

  // Fix marker icon paths for Leaflet in client-side
  useEffect(() => {
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
    });
  }, []);

  // Location validation
  const reportPosition = useMemo(() => {
    if (laporan?.titik_gps) {
      return parseLocation(laporan.titik_gps);
    }
    return null;
  }, [laporan?.titik_gps]);

  const assignmentPosition = useMemo(() => {
    if (assignment?.lokasi) {
      return parseLocation(assignment.lokasi);
    }
    return null;
  }, [assignment?.lokasi]);

  const locationValidation = useMemo(() => {
    if (reportPosition && assignmentPosition) {
      const distance = calculateDistance(
        reportPosition[0], reportPosition[1],
        assignmentPosition[0], assignmentPosition[1]
      );
      const isValid = distance <= 5000; // Within 5km (5000 meters)
      const message = isValid
        ? `Lokasi valid (${distance.toFixed(2)}km dari lokasi penugasan)`
        : `Lokasi laporan ${distance.toFixed(2)}km dari lokasi penugasan (maksimal 5km)`;
      return { distance, isValid, message };
    }
    return null;
  }, [reportPosition, assignmentPosition]);

  // Check if all tool photos are the same
  const areAllToolPhotosSame = useMemo(() => {
    if (!laporan?.tool_photos || laporan.tool_photos.length === 0) return false;

    const firstPhoto = laporan.tool_photos[0].foto_url;
    return laporan.tool_photos.every(photo => photo.foto_url === firstPhoto);
  }, [laporan?.tool_photos]);

  // Check if all return tool photos are the same
  const areAllReturnToolPhotosSame = useMemo(() => {
    if (!laporan?.return_tool_photos || laporan.return_tool_photos.length === 0) return false;

    const firstPhoto = laporan.return_tool_photos[0].foto_url;
    return laporan.return_tool_photos.every(photo => photo.foto_url === firstPhoto);
  }, [laporan?.return_tool_photos]);

  // Group return tool photos by URL
  const groupedReturnToolPhotos = useMemo(() => {
    if (!laporan?.return_tool_photos || laporan.return_tool_photos.length === 0) return {};

    const groups: { [key: string]: Array<{ id: number; foto_url: string; alat_id: number; alat?: { nama: string; tipe_alat: string; } }> } = {};

    laporan.return_tool_photos.forEach((photo) => {
      if (!groups[photo.foto_url]) {
        groups[photo.foto_url] = [];
      }
      groups[photo.foto_url].push(photo);
    });

    return groups;
  }, [laporan?.return_tool_photos]);

  // State for photo preview dialog
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Photo Preview Dialog Component
  const PhotoPreviewDialog = ({ photoUrl, onClose }: { photoUrl: string | null; onClose: () => void }) => {
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
  };

  const fetchLaporanDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch laporan detail for supervisor
      const response = await fetch(`/api/supervisor/laporan/${laporanId}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Laporan tidak ditemukan");
      }

      const data = await response.json();
      setLaporan(data.data);

      // Fetch assignment detail
      const assignmentResponse = await fetch(`/api/penugasan/${data.data.penugasan_id}`, {
        cache: "no-store"
      });

      if (assignmentResponse.ok) {
        const assignmentData = await assignmentResponse.json();
        setAssignment(assignmentData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (laporanId) {
      fetchLaporanDetail();
    }
  }, [laporanId]);

  const handleBack = () => {
    router.push('/views/spv/laporan/');
  };

  const handleRetry = () => {
    fetchLaporanDetail();
  };

  const handleValidation = async (action: 'approve' | 'reject') => {
    if (!laporan) return;

    // Ensure status is exactly "Disetujui" or "Ditolak"
    const validationStatus = action === 'approve' ? 'Disetujui' : 'Ditolak';

    setValidating(true);
    try {
      const response = await fetch(`/api/laporan/${laporan.id}/validasi`, {
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
      await fetchLaporanDetail();
      
      // Close dialog and reset state
      setShowValidationDialog(false);
      setValidationAction(null);
      setValidationNote('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat validasi');
    } finally {
      setValidating(false);
    }
  };

  const openValidationDialog = (action: 'approve' | 'reject') => {
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
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">Detail Laporan Validasi</h1>
        </header>
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!laporan) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">Detail Laporan Validasi</h1>
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
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold leading-tight">Detail Laporan Validasi</h1>
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
                <div className="flex items-center gap-2">
                  {getStatusBadge(laporan.status_validasi)}
                  {laporan.status_validasi === "Menunggu" && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => openValidationDialog('approve')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openValidationDialog('reject')}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Tolak
                      </Button>
                    </div>
                  )}
                  {laporan.status_validasi === "Disetujui" && (
                    <div className="ml-4">
                      {/* TODO: Implement download functionality for approved reports */}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start gap-8">
                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Tanggal Laporan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(laporan.created_at).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-sm font-medium flex items-center gap-2 justify-end">
                    <Ruler className="h-4 w-4" />
                    Persentase Progres
                  </p>
                  <p className="text-sm text-muted-foreground">{laporan.persentase_progres}%</p>
                </div>
              </div>

              <div className="flex justify-between items-start gap-8">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status Progres</p>
                  <Badge variant="outline">{laporan.status_progres}</Badge>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-sm font-medium">Pelapor</p>
                  <p className="text-sm text-muted-foreground">{laporan.pelapor.nama}</p>
                </div>
              </div>

              {laporan.catatan && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Catatan Teknisi</p>
                  <p className="text-sm text-muted-foreground">{laporan.catatan}</p>
                </div>
              )}

              {/* Validation Info */}
              {laporan.status_validasi !== "Menunggu" && (
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm font-medium">Informasi Validasi</p>
                  <div className="bg-muted/50 p-3 rounded space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span>Divalidasi oleh:</span>
                      <span className="font-medium">{laporan.validator?.nama}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(laporan.divalidasi_pada || "").toLocaleString("id-ID")}
                    </div>
                    {laporan.catatan_validasi && (
                      <div className="text-sm italic text-foreground bg-background p-2 rounded">
                        {laporan.catatan_validasi}
                      </div>
                    )}
                  </div>
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
                      {getLocationDisplayText(laporan.titik_gps)}
                    </p>
                  </div>
                  {assignmentPosition && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Lokasi Penugasan</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {getLocationDisplayText(assignment?.lokasi)}
                      </p>
                    </div>
                  )}
                </div>

                {locationValidation && (
                  <div className={`p-3 rounded-lg border flex items-center gap-2 ${
                    locationValidation.isValid
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}>
                    {locationValidation.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {locationValidation.message}
                    </span>
                  </div>
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
          {laporan.bukti_laporan && laporan.bukti_laporan.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Bukti Laporan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {laporan.bukti_laporan.some(bukti => bukti.taken_at) && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground">
                      Diambil pada: {new Date(laporan.bukti_laporan.find(bukti => bukti.taken_at)?.taken_at || "").toLocaleString("id-ID")}
                      {laporan.bukti_laporan.some(bukti => bukti.taken_by) && ` oleh ${laporan.pelapor.nama}`}
                    </p>
                  </div>
                )}
                <div className="space-y-6">
                  
                  {laporan.bukti_laporan.map((bukti) => (
                    
                    <div key={bukti.id} className="space-y-3">
                      
                      {bukti.judul && (
                        <h4 className="font-medium">{bukti.judul}</h4>
                      )}
                      {bukti.deskripsi && (
                        <p className="text-sm text-muted-foreground">{bukti.deskripsi}</p>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Sebelum</p>
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => setPreviewPhoto(bukti.before_foto_url)}>
                            <Image
                              src={bukti.before_foto_url}
                              alt="Foto sebelum"
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Sesudah</p>
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => setPreviewPhoto(bukti.after_foto_url)}>
                            <Image
                              src={bukti.after_foto_url}
                              alt="Foto sesudah"
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>
                     
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legacy Foto Bukti (fallback) */}
          {laporan.foto_url && (!laporan.bukti_laporan || laporan.bukti_laporan.length === 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Foto Bukti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => setPreviewPhoto(laporan.foto_url)}>
                  <Image
                    src={laporan.foto_url}
                    alt="Foto bukti"
                    fill
                    className="object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Container - Assignment Resources */}
        <div className="space-y-6">
          {/* Tool Pickup Evidence */}
          {laporan.tool_photos && laporan.tool_photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Bukti Pengambilan Alat
                </CardTitle>
              </CardHeader>
              <CardContent>
                {areAllToolPhotosSame ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Semua alat menggunakan foto bukti yang sama
                    </p>
                    <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => setPreviewPhoto(laporan.tool_photos![0].foto_url)}>
                      <Image
                        src={laporan.tool_photos![0].foto_url}
                        alt="Bukti pengambilan alat"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {laporan.tool_photos.map((toolPhoto) => (
                      <div key={toolPhoto.id} className="space-y-2">
                        <p className="text-sm font-medium">
                          {toolPhoto.alat?.nama || `Alat ${toolPhoto.alat_id}`}
                        </p>
                        <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => setPreviewPhoto(toolPhoto.foto_url)}>
                          <Image
                            src={toolPhoto.foto_url}
                            alt={`Bukti pengambilan ${toolPhoto.alat?.nama || `alat ${toolPhoto.alat_id}`}`}
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
          {/* Tool Return Evidence */}
          {laporan.return_tool_photos && laporan.return_tool_photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Bukti Pengembalian Alat
                </CardTitle>
              </CardHeader>
              <CardContent>
                {areAllReturnToolPhotosSame ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Semua alat menggunakan foto bukti yang sama
                    </p>
                    <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => setPreviewPhoto(laporan.return_tool_photos![0].foto_url)}>
                      <Image
                        src={laporan.return_tool_photos[0].foto_url}
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
                            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => setPreviewPhoto(fotoUrl)}>
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
          {/* Assigned Technicians */}
          {assignment?.teknisi && assignment.teknisi.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Teknisi yang Ditugaskan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignment.teknisi.map((teknisiItem) => (
                    <div key={teknisiItem.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{teknisiItem.profil?.nama || `Teknisi ${teknisiItem.teknisi_id}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {teknisiItem.profil?.peran || "Teknisi"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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
                          <div className="relative w-10 h-10 rounded overflow-hidden bg-muted cursor-pointer" onClick={() => alatItem.alat && setPreviewPhoto(alatItem.alat.foto_url!)}>
                            <Image
                              src={alatItem.alat.foto_url!}
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

      {/* Photo Preview Dialog */}
      <PhotoPreviewDialog photoUrl={previewPhoto} onClose={() => setPreviewPhoto(null)} />
    </div>
  );
}