"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, RefreshCcw } from "lucide-react";
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

export default function LaporanDetailManagerPage() {
  const params = useParams();
  const router = useRouter();
  const laporanId = params.id as string;

  const [laporan, setLaporan] = useState<LaporanDetail | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      // Fetch laporan detail for manager
      const response = await fetch(`/api/manager/laporan/${laporanId}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Laporan tidak ditemukan");
      }

      const data = await response.json();

      if (!data.data) {
        throw new Error("Data laporan tidak ditemukan dalam response");
      }

      setLaporan(data.data);

      // Fetch assignment detail
      const assignmentResponse = await fetch(`/api/manager/penugasan/${data.data.penugasan_id}`, {
        cache: "no-store"
      });

      if (assignmentResponse.ok) {
        const assignmentData = await assignmentResponse.json();
        setAssignment(assignmentData.data);
      }
    } catch (err) {
      console.error("Error in fetchLaporanDetail:", err);
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
    router.back(); // Go back to previous page (likely assignment detail)
  };

  const handleRetry = () => {
    fetchLaporanDetail();
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
          <h1 className="text-2xl font-bold">Detail Laporan</h1>
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

  // Only show "not found" if we're not loading and there's no error, but laporan is still null
  // This prevents showing "not found" during initial load
  if (!loading && !error && !laporan) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <Button variant="ghost" size="sm" onClick={handleBack}>
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
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold leading-tight">Detail Laporan</h1>
          <p className="text-sm text-muted-foreground">
            {assignment?.judul || "Penugasan tidak ditemukan"}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Container - Main Report Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Status and Progress - Read Only */}
          <ReportStatusCard
            laporan={laporan!}
            // No onApprove/onReject for manager
          />

          {/* Location Information */}
          <LocationCard laporan={laporan!} assignment={assignment || undefined} />

          {/* Photo Pairs */}
          <PhotoPairsCard laporan={laporan!} onPhotoClick={setPreviewPhoto} />

          {/* Legacy Foto Bukti (fallback) */}
          <LegacyFotoCard laporan={laporan!} onPhotoClick={setPreviewPhoto} />
        </div>

        {/* Right Container - Assignment Resources */}
        <div className="space-y-6">
          {/* Tool Pickup Evidence */}
          <ToolPhotosCard laporan={laporan!} onPhotoClick={setPreviewPhoto} />
          {/* Tool Return Evidence */}
          <ReturnToolPhotosCard laporan={laporan!} onPhotoClick={setPreviewPhoto} />
          {/* Assigned Technicians */}
          {assignment && <AssignedTechniciansCard assignment={assignment} />}

          {/* Assignment Tools */}
          {assignment && <AssignmentToolsCard assignment={assignment} onPhotoClick={setPreviewPhoto} />}
        </div>
      </div>

      {/* Photo Preview Dialog */}
      <PhotoPreviewDialog photoUrl={previewPhoto} onClose={() => setPreviewPhoto(null)} />
    </div>
  );
}