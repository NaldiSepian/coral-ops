"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, RefreshCcw, Check, X } from "lucide-react";
import dynamic from "next/dynamic";
import { parseLocation, calculateDistance } from "@/lib/utils/location";
import PhotoPreviewDialog from "@/components/laporan-detail/PhotoPreviewDialog";
import ReportStatusCard from "@/components/laporan-detail/ReportStatusCard";
import LocationCard from "@/components/laporan-detail/LocationCard";
import PhotoPairsCard from "@/components/laporan-detail/PhotoPairsCard";
import LegacyFotoCard from "@/components/laporan-detail/LegacyFotoCard";
import ToolPhotosCard from "@/components/laporan-detail/ToolPhotosCard";
import ReturnToolPhotosCard from "@/components/laporan-detail/ReturnToolPhotosCard";
import AssignedTechniciansCard from "@/components/laporan-detail/AssignedTechniciansCard";
import AssignmentToolsCard from "@/components/laporan-detail/AssignmentToolsCard";
import { LaporanDetail, AssignmentDetail } from "@/components/laporan-detail/types";

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
          <ReportStatusCard
            laporan={laporan}
            onApprove={() => openValidationDialog('approve')}
            onReject={() => openValidationDialog('reject')}
          />

          {/* Location Information */}
          <LocationCard laporan={laporan} assignment={assignment || undefined} />

          {/* Photo Pairs */}
          <PhotoPairsCard laporan={laporan} onPhotoClick={setPreviewPhoto} />

          {/* Legacy Foto Bukti (fallback) */}
          <LegacyFotoCard laporan={laporan} onPhotoClick={setPreviewPhoto} />
        </div>

        {/* Right Container - Assignment Resources */}
        <div className="space-y-6">
          {/* Tool Pickup Evidence */}
          <ToolPhotosCard laporan={laporan} onPhotoClick={setPreviewPhoto} />
          {/* Tool Return Evidence */}
          <ReturnToolPhotosCard laporan={laporan} onPhotoClick={setPreviewPhoto} />
          {/* Assigned Technicians */}
          {assignment && <AssignedTechniciansCard assignment={assignment} />}

          {/* Assignment Tools */}
          {assignment && <AssignmentToolsCard assignment={assignment} onPhotoClick={setPreviewPhoto} />}
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