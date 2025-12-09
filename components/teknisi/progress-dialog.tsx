"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Loader2, MapPin, UploadCloud, RefreshCcw, Plus, Trash2, Wrench } from "lucide-react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import { BuktiLaporanPairPayload, StatusLaporanProgres } from "@/lib/penugasan/types";

const LocationPicker = dynamic(() => import("@/components/ui/location-picker").then((mod) => ({ default: mod.LocationPicker })), {
  ssr: false,
});

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface PhotoPairState {
  id: string;
  title: string;
  description: string;
  beforeFile: File | null;
  afterFile: File | null;
  beforeError: string | null;
  afterError: string | null;
}

interface ToolPhotoState {
  alat_id: number;
  file: File | null;
  error: string | null;
  url: string | null;
}

interface ProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: number | null;
  assignmentTitle?: string;
  userId: string | null;
  existingReports?: number;
  hasActiveTools?: boolean;
  tools?: Array<{
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
  onSuccess: (updatedTotal?: number) => void;
}

const BUCKET_NAME = "laporan-progres";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const STATUS_OPTIONS: StatusLaporanProgres[] = [
  "Menunggu",
  "Sedang Dikerjakan",
  "Hampir Selesai",
  "Selesai",
];
const MAX_PAIR_COUNT = 5;
type GeoAttempt = { label: string; options: PositionOptions };
const GEO_ATTEMPTS: GeoAttempt[] = [
  {
    label: "Mengunci GPS presisi tinggi",
    options: { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 },
  },
  {
    label: "Mencoba ulang dengan data GPS terbaru",
    options: { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 },
  },
  {
    label: "Menggunakan mode hemat baterai / jaringan",
    options: { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 },
  },
];

const getGeoErrorMessage = (error: GeolocationPositionError) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Akses lokasi ditolak. Izinkan lokasi di browser atau isi koordinat manual.";
    case error.POSITION_UNAVAILABLE:
      return "Sinyal GPS tidak tersedia. Coba pindah ke area terbuka atau gunakan input manual.";
    case error.TIMEOUT:
      return "GPS timeout. Tekan refresh atau isi koordinat manual.";
    default:
      return error.message || "Tidak bisa mendapatkan lokasi. Isi koordinat secara manual.";
  }
};

const generatePairId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `pair-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createEmptyPair = (): PhotoPairState => ({
  id: generatePairId(),
  title: "",
  description: "",
  beforeFile: null,
  afterFile: null,
  beforeError: null,
  afterError: null,
});

const validateImageFile = (selected: File | null): string | null => {
  if (!selected) return null;
  if (!selected.type.startsWith("image/")) {
    return "Hanya menerima file gambar (JPG/PNG)";
  }
  if (selected.size > MAX_FILE_SIZE) {
    return "Ukuran foto maksimal 5MB";
  }
  return null;
};

export function ProgressDialog({
  open,
  onOpenChange,
  assignmentId,
  assignmentTitle,
  userId,
  existingReports = 0,
  hasActiveTools = false,
  tools = [],
  onSuccess,
}: ProgressDialogProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [status, setStatus] = useState<StatusLaporanProgres>(
    existingReports === 0 ? "Sedang Dikerjakan" : "Hampir Selesai"
  );
  const [persentase, setPersentase] = useState<number>(
    existingReports === 0 ? 11 : 76
  );
  const [persentaseError, setPersentaseError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [returnTools, setReturnTools] = useState(false);
  const [photoPairs, setPhotoPairs] = useState<PhotoPairState[]>([createEmptyPair()]);
  const [toolPhotos, setToolPhotos] = useState<ToolPhotoState[]>([]);
  const [toolPhotoMode, setToolPhotoMode] = useState<'individual' | 'bulk'>('individual');
  const [bulkToolFile, setBulkToolFile] = useState<File | null>(null);
  const [bulkToolError, setBulkToolError] = useState<string | null>(null);
  const canAddPair = photoPairs.length < MAX_PAIR_COUNT;
  const locationAttemptRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Persentase range berdasarkan status
  const persentaseRange = useMemo(() => {
    switch (status) {
      case "Menunggu":
        return { min: 0, max: 10, default: 5 };
      case "Sedang Dikerjakan":
        return { min: 11, max: 75, default: 40 };
      case "Hampir Selesai":
        return { min: 76, max: 99, default: 85 };
      case "Selesai":
        return { min: 100, max: 100, default: 100 };
      default:
        return { min: 0, max: 100, default: 0 };
    }
  }, [status]);

  // Update persentase ketika status berubah
  useEffect(() => {
    const range = persentaseRange;
    if (persentase < range.min || persentase > range.max) {
      setPersentase(range.default);
      setPersentaseError(null);
    }
  }, [status, persentaseRange, persentase]);

  const handlePersentaseChange = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      setPersentase(persentaseRange.default);
      setPersentaseError(null);
      return;
    }

    setPersentase(numValue);

    // Validasi range
    if (numValue < persentaseRange.min || numValue > persentaseRange.max) {
      setPersentaseError(
        `Untuk status "${status}", persentase harus antara ${persentaseRange.min}% - ${persentaseRange.max}%`
      );
    } else {
      setPersentaseError(null);
    }
  };

  const manualCoords = useMemo(() => {
    if (!manualLat && !manualLng) return null;
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }
    return { latitude: lat, longitude: lng };
  }, [manualLat, manualLng]);

  const handlePairMetaChange = (pairId: string, field: 'title' | 'description', value: string) => {
    setPhotoPairs((prev) =>
      prev.map((pair) => (pair.id === pairId ? { ...pair, [field]: value } : pair))
    );
  };

  const handlePairFileChange = (pairId: string, variant: 'before' | 'after', file: File | null) => {
    const errorMsg = validateImageFile(file);
    setPhotoPairs((prev) =>
      prev.map((pair) => {
        if (pair.id !== pairId) return pair;
        const next = { ...pair };
        if (variant === 'before') {
          next.beforeFile = errorMsg ? null : file;
          next.beforeError = errorMsg;
        } else {
          next.afterFile = errorMsg ? null : file;
          next.afterError = errorMsg;
        }
        return next;
      })
    );
  };

  const addPhotoPair = () => {
    if (!canAddPair) return;
    setPhotoPairs((prev) => [...prev, createEmptyPair()]);
  };

  const removePhotoPair = (pairId: string) => {
    setPhotoPairs((prev) => {
      if (prev.length === 1) {
        return [createEmptyPair()];
      }
      return prev.filter((pair) => pair.id !== pairId);
    });
  };

  const ensurePairsComplete = () => {
    let valid = true;
    setPhotoPairs((prev) =>
      prev.map((pair) => {
        const beforeError = pair.beforeFile ? null : 'Foto before wajib diunggah';
        const afterError = pair.afterFile ? null : 'Foto after wajib diunggah';
        if (beforeError || afterError) {
          valid = false;
        }
        return { ...pair, beforeError, afterError };
      })
    );
    if (!valid) {
      setError('Lengkapi foto before/after untuk setiap bukti.');
    }
    return valid;
  };

  const uploadPairPhoto = async (file: File, pairId: string, variant: 'before' | 'after') => {
    if (!file) {
      throw new Error('File foto tidak ditemukan');
    }
    if (!userId) {
      throw new Error('User tidak valid');
    }
    if (!assignmentId) {
      throw new Error('Penugasan tidak ditemukan');
    }
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '-');
    const path = `${userId}/${assignmentId}/pairs/${pairId}/${variant}-${Date.now()}-${sanitizedName}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(uploadError.message || 'Gagal mengunggah foto');
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleToolPhotoChange = (alatId: number, file: File | null) => {
    const errorMsg = validateImageFile(file);
    setToolPhotos((prev) =>
      prev.map((tool) => {
        if (tool.alat_id !== alatId) return tool;
        return {
          ...tool,
          file: errorMsg ? null : file,
          error: errorMsg,
          url: null
        };
      })
    );
  };

  const uploadToolPhoto = async (alatId: number, file: File): Promise<string> => {
    if (!file) {
      throw new Error('File foto tidak ditemukan');
    }
    if (!userId) {
      throw new Error('User tidak valid');
    }
    if (!assignmentId) {
      throw new Error('Penugasan tidak ditemukan');
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '-');
    const path = `${userId}/${assignmentId}/tool-pickup/${alatId}-${Date.now()}-${sanitizedName}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(uploadError.message || 'Gagal mengunggah foto pengambilan alat');
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  };

  const buildPairsPayload = async (): Promise<Array<{ before_url: string; after_url: string }>> => {
    const pairs: Array<{ before_url: string; after_url: string }> = [];
    for (const pair of photoPairs) {
      if (pair.beforeFile && pair.afterFile) {
        const beforeUrl = await uploadPairPhoto(pair.beforeFile, pair.id, 'before');
        const afterUrl = await uploadPairPhoto(pair.afterFile, pair.id, 'after');
        pairs.push({ before_url: beforeUrl, after_url: afterUrl });
      }
    }
    return pairs;
  };

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Perangkat tidak mendukung GPS. Isi koordinat secara manual.");
      return;
    }

    const attemptId = Date.now();
    locationAttemptRef.current = attemptId;
    setLoadingLocation(true);

    const tryAttempt = (index: number) => {
      const attempt = GEO_ATTEMPTS[index];
      setLocationStatus(`${attempt.label} (${index + 1}/${GEO_ATTEMPTS.length})`);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (locationAttemptRef.current !== attemptId) return;
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationStatus(null);
          setLoadingLocation(false);
        },
        (geoError) => {
          if (locationAttemptRef.current !== attemptId) return;
          if (index < GEO_ATTEMPTS.length - 1) {
            tryAttempt(index + 1);
          } else {
            setLocationStatus(getGeoErrorMessage(geoError));
            setLoadingLocation(false);
          }
        },
        attempt.options
      );
    };

    tryAttempt(0);
  }, []);

  useEffect(() => {
    if (open) {
      setError(null);
      setFileError(null);
      setLocationStatus(null);
      setStatus(existingReports === 0 ? "Sedang Dikerjakan" : "Hampir Selesai");
      setReturnTools(false);
      setPhotoPairs((pairs) => (pairs.length === 0 ? [createEmptyPair()] : pairs));
      
      // Initialize tool photos for first report
      if (existingReports === 0 && tools.length > 0) {
        const activeTools = tools.filter(tool => !tool.is_returned);
        setToolPhotos(activeTools.map(tool => ({
          alat_id: tool.alat_id,
          file: null,
          error: null,
          url: null
        })));
      } else {
        setToolPhotos([]);
      }
      
      if (!coords) {
        requestLocation();
      }
    }
  }, [open, existingReports, tools, coords, requestLocation]);

  useEffect(() => {
    if (status !== "Selesai") {
      setReturnTools(false);
    }
  }, [status]);

  useEffect(() => {
    if (!hasActiveTools) {
      setReturnTools(false);
    }
  }, [hasActiveTools]);

  const validateManualCoords = () => {
    if (!manualLat && !manualLng) {
      return true;
    }
    if (!manualLat || !manualLng) {
      setError("Isi kedua koordinat untuk menggunakan input manual");
      return false;
    }
    if (!manualCoords) {
      setError("Koordinat manual tidak valid");
      return false;
    }
    const { latitude, longitude } = manualCoords;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError("Koordinat berada di luar batas bumi");
      return false;
    }
    return true;
  };

  const effectiveCoords = manualCoords || coords;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      setFileError(null);
      return;
    }
    const validationError = validateImageFile(selected);
    if (validationError) {
      setFile(null);
      setFileError(validationError);
      return;
    }

    setFile(selected);
    setFileError(null);
  };

  const uploadPhoto = async (): Promise<string> => {
    if (!file) {
      throw new Error("Foto bukti wajib diunggah");
    }
    if (!userId) {
      throw new Error("User tidak valid");
    }
    if (!assignmentId) {
      throw new Error("Penugasan tidak ditemukan");
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "-");
    const path = `${userId}/${assignmentId}/${Date.now()}-${sanitizedName}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(uploadError.message || "Gagal mengunggah foto");
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!assignmentId) return;
    if (!validateManualCoords()) return;
    if (!file) {
      setFileError("Foto wajib diunggah sebagai bukti lapangan");
      return;
    }
    if (!effectiveCoords) {
      setError("Lokasi wajib diisi lewat GPS atau peta");
      return;
    }
    if (persentaseError) {
      setError("Persentase progres tidak valid. " + persentaseError);
      return;
    }
    if (!ensurePairsComplete()) {
      return;
    }

    // Validasi foto pengambilan alat untuk laporan pertama
    const isFirstReport = existingReports === 0;
    if (isFirstReport) {
      if (toolPhotoMode === 'individual') {
        const missingToolPhotos = toolPhotos.filter(tool => !tool.file);
        if (missingToolPhotos.length > 0) {
          setError(`Foto pengambilan alat wajib diunggah untuk semua alat (${missingToolPhotos.length} alat belum diupload)`);
          return;
        }
      } else if (toolPhotoMode === 'bulk') {
        if (!bulkToolFile) {
          setBulkToolError("Foto pengambilan alat wajib diunggah");
          return;
        }
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const fotoUrl = await uploadPhoto();
      const pairsPayload = await buildPairsPayload();
      if (!pairsPayload.length) {
        throw new Error("Minimal satu bukti foto before/after wajib dilampirkan");
      }

      // Upload foto pengambilan alat untuk laporan pertama
      let toolPhotosPayload: Array<{ alat_id: number; foto_url: string }> | undefined;
      if (isFirstReport) {
        toolPhotosPayload = [];
        if (toolPhotoMode === 'individual') {
          for (const toolPhoto of toolPhotos) {
            if (toolPhoto.file) {
              const fotoUrl = await uploadToolPhoto(toolPhoto.alat_id, toolPhoto.file);
              toolPhotosPayload.push({
                alat_id: toolPhoto.alat_id,
                foto_url: fotoUrl
              });
            }
          }
        } else if (toolPhotoMode === 'bulk' && bulkToolFile) {
          const bulkFotoUrl = await uploadToolPhoto(0, bulkToolFile); // alat_id 0 for bulk
          for (const tool of tools) {
            toolPhotosPayload.push({
              alat_id: tool.alat_id,
              foto_url: bulkFotoUrl
            });
          }
        }
      }

      const body = {
        status_progres: status,
        persentase_progres: persentase,
        catatan: notes,
        foto_url: fotoUrl,
        latitude: effectiveCoords?.latitude,
        longitude: effectiveCoords?.longitude,
        return_tools: status === "Selesai" ? returnTools : false,
        pairs: pairsPayload,
        tool_photos: toolPhotosPayload,
      };

      const response = await fetch(`/api/penugasan/${assignmentId}/laporan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Gagal mengirim laporan");
      }

      onSuccess(payload.total_reports);
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Terjadi kesalahan saat kirim laporan");
    } finally {
      setSubmitting(false);
    }
  };

  const shouldOfferAutoReturn = hasActiveTools && status === "Selesai";
  const reportLabel = existingReports === 0 ? "Mulai Kerja" : `Laporan Progres Ke-${existingReports + 1}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reportLabel}{assignmentTitle ? ` • ${assignmentTitle}` : ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Status Progres</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as StatusLaporanProgres)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Gunakan &quot;Sedang Dikerjakan&quot; saat memulai, &quot;Hampir Selesai&quot; untuk finishing, dan &quot;Selesai&quot; ketika pekerjaan tuntas.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>
                  Persentase Progres{" "}
                  <span className="text-muted-foreground text-xs">
                    ({persentaseRange.min}% - {persentaseRange.max}%)
                  </span>
                </Label>
                <span className="text-lg font-bold text-primary">
                  {persentase}%
                </span>
              </div>
              <Slider
                value={[persentase]}
                onValueChange={(value) => handlePersentaseChange(value[0].toString())}
                min={persentaseRange.min}
                max={persentaseRange.max}
                step={1}
                className="w-full"
              />
              {persentaseError && (
                <p className="text-xs text-destructive">{persentaseError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {status === "Menunggu" && "0-10%: Persiapan awal dan penilaian kondisi"}
                {status === "Sedang Dikerjakan" && "11-75%: Pekerjaan utama sedang berlangsung"}
                {status === "Hampir Selesai" && "76-99%: Finalisasi dan quality check"}
                {status === "Selesai" && "100%: Pekerjaan selesai seluruhnya"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Textarea
                rows={3}
                placeholder="Tuliskan progres atau kendala singkat yang ditemui"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Foto Pengambilan Alat - Hanya untuk laporan pertama */}
          {existingReports === 0 && tools.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label>Foto Pengambilan Alat</Label>
                  <p className="text-xs text-muted-foreground">
                    Unggah foto saat mengambil alat untuk setiap alat yang ditugaskan.
                  </p>
                </div>
              </div>
              <RadioGroup
                value={toolPhotoMode}
                onValueChange={(value) => setToolPhotoMode(value as 'individual' | 'bulk')}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="text-sm">Satu per alat</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bulk" id="bulk" />
                  <Label htmlFor="bulk" className="text-sm">Satu untuk semua alat</Label>
                </div>
              </RadioGroup>
              {toolPhotoMode === 'individual' ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {toolPhotos.map((toolPhoto) => {
                    const tool = tools.find(t => t.alat_id === toolPhoto.alat_id);
                    return (
                      <div key={toolPhoto.alat_id} className="rounded-lg border p-3 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {tool?.alat?.foto_url ? (
                              <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                                <img
                                  src={tool.alat.foto_url}
                                  alt={tool.alat.nama}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                <Wrench className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Label className="text-sm font-medium">{tool?.alat?.nama || `Alat ${toolPhoto.alat_id}`}</Label>
                            {tool?.alat?.tipe_alat && (
                              <p className="text-xs text-muted-foreground">{tool.alat.tipe_alat}</p>
                            )}
                            <p className="text-xs text-muted-foreground">Qty: {tool?.jumlah || 0}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Foto Pengambilan</Label>
                          {isMobile ? (
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs text-muted-foreground">Ambil Foto</Label>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={(event) => handleToolPhotoChange(toolPhoto.alat_id, event.target.files?.[0] || null)}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Upload File</Label>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) => handleToolPhotoChange(toolPhoto.alat_id, event.target.files?.[0] || null)}
                                />
                              </div>
                            </div>
                          ) : (
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(event) => handleToolPhotoChange(toolPhoto.alat_id, event.target.files?.[0] || null)}
                            />
                          )}
                          {toolPhoto.file && (
                            <p className="text-xs text-muted-foreground truncate">{toolPhoto.file.name}</p>
                          )}
                          {toolPhoto.error && (
                            <p className="text-xs text-destructive">{toolPhoto.error}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border p-3 space-y-3">
                    <Label className="text-sm font-medium">Foto Pengambilan Semua Alat</Label>
                    {isMobile ? (
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Ambil Foto</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(event) => {
                              const selected = event.target.files?.[0];
                              if (!selected) {
                                setBulkToolFile(null);
                                setBulkToolError(null);
                                return;
                              }
                              const validationError = validateImageFile(selected);
                              if (validationError) {
                                setBulkToolFile(null);
                                setBulkToolError(validationError);
                                return;
                              }
                              setBulkToolFile(selected);
                              setBulkToolError(null);
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Upload File</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              const selected = event.target.files?.[0];
                              if (!selected) {
                                setBulkToolFile(null);
                                setBulkToolError(null);
                                return;
                              }
                              const validationError = validateImageFile(selected);
                              if (validationError) {
                                setBulkToolFile(null);
                                setBulkToolError(validationError);
                                return;
                              }
                              setBulkToolFile(selected);
                              setBulkToolError(null);
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const selected = event.target.files?.[0];
                          if (!selected) {
                            setBulkToolFile(null);
                            setBulkToolError(null);
                            return;
                          }
                          const validationError = validateImageFile(selected);
                          if (validationError) {
                            setBulkToolFile(null);
                            setBulkToolError(validationError);
                            return;
                          }
                          setBulkToolFile(selected);
                          setBulkToolError(null);
                        }}
                      />
                    )}
                    {bulkToolFile && (
                      <p className="text-xs text-muted-foreground truncate">{bulkToolFile.name}</p>
                    )}
                    {bulkToolError && (
                      <p className="text-xs text-destructive">{bulkToolError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Foto ini akan digunakan untuk semua alat yang dipinjam.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Label>Foto Bukti</Label>
            <Input type="file" accept="image/*" capture="environment" onChange={handleFileChange} />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <UploadCloud className="h-3 w-3" /> Format JPG/PNG maksimal 5MB.
            </p>
            {fileError && (
              <p className="text-xs text-destructive">{fileError}</p>
            )}
          </div>

          {shouldOfferAutoReturn && (
            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="auto-return-tools"
                  checked={returnTools}
                  onCheckedChange={(checked) => setReturnTools(Boolean(checked))}
                />
                <div className="text-sm">
                  <Label htmlFor="auto-return-tools" className="font-medium text-sm">Kembalikan semua alat yang belum dipulangkan</Label>
                  <p className="text-xs text-muted-foreground">
                    Centang jika semua alat lapangan sudah dibawa kembali. Bukti foto progres ini dipakai untuk pengembalian massal.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label>Lokasi Pelaporan</Label>
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  {loadingLocation ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
                </div>
                <div className="text-sm flex-1">
                  {effectiveCoords ? (
                    <div>
                      <p className="font-medium">Koordinat digunakan</p>
                      <p className="text-muted-foreground text-xs">
                        Lat {effectiveCoords.latitude.toFixed(5)}, Lng {effectiveCoords.longitude.toFixed(5)}
                      </p>
                      {manualCoords && (
                        <p className="text-xs text-primary">Menggunakan input manual</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Menunggu lokasi...</p>
                      <p className="text-muted-foreground text-xs">Izinkan GPS atau isi koordinat manual.</p>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={requestLocation} disabled={loadingLocation}>
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
              {locationStatus && (
                <p className="text-xs text-destructive">{locationStatus}</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Latitude (manual)</Label>
                  <Input
                    type="number"
                    step="0.00001"
                    value={manualLat}
                    placeholder={coords ? coords.latitude.toFixed(5) : "-"}
                    onChange={(e) => {
                      setManualLat(e.target.value);
                      setError(null);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Longitude (manual)</Label>
                  <Input
                    type="number"
                    step="0.00001"
                    value={manualLng}
                    placeholder={coords ? coords.longitude.toFixed(5) : "-"}
                    onChange={(e) => {
                      setManualLng(e.target.value);
                      setError(null);
                    }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">Kosongkan input manual jika ingin menggunakan koordinat GPS.</p>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setMapPickerOpen(true)}>
                  Pilih via Peta
                </Button>
              </div>
            </div>
          </div>

          {status === "Selesai" && (
            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="auto-return-tools"
                  checked={returnTools}
                  onCheckedChange={(checked) => setReturnTools(Boolean(checked))}
                />
                <div className="text-sm">
                  <Label htmlFor="auto-return-tools" className="font-medium text-sm">Kembalikan semua alat yang belum dipulangkan</Label>
                  <p className="text-xs text-muted-foreground">
                    Centang jika semua alat lapangan sudah dibawa kembali. Bukti foto progres ini dipakai untuk pengembalian massal.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label>Dokumentasi Before/After</Label>
                <p className="text-xs text-muted-foreground">
                  Unggah minimal satu pasang foto before & after (maks {MAX_PAIR_COUNT} bukti).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPhotoPair}
                disabled={!canAddPair}
              >
                <Plus className="mr-2 h-4 w-4" /> Tambah Bukti
              </Button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {photoPairs.map((pair, index) => (
                <div key={pair.id} className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Area / Komponen #{index + 1}
                      </Label>
                      <Input
                        value={pair.title}
                        placeholder="Contoh: Panel utama"
                        onChange={(event) => handlePairMetaChange(pair.id, 'title', event.target.value)}
                      />
                    </div>
                    {photoPairs.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePhotoPair(pair.id)}
                        aria-label="Hapus bukti foto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Catatan (opsional)</Label>
                    <Textarea
                      rows={2}
                      value={pair.description}
                      placeholder="Tuliskan perubahan penting setelah pekerjaan"
                      onChange={(event) => handlePairMetaChange(pair.id, 'description', event.target.value)}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Foto Before</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(event) => handlePairFileChange(pair.id, 'before', event.target.files?.[0] || null)}
                      />
                      {pair.beforeFile && (
                        <p className="text-xs text-muted-foreground truncate">{pair.beforeFile.name}</p>
                      )}
                      {pair.beforeError && (
                        <p className="text-xs text-destructive">{pair.beforeError}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Foto After</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(event) => handlePairFileChange(pair.id, 'after', event.target.files?.[0] || null)}
                      />
                      {pair.afterFile && (
                        <p className="text-xs text-muted-foreground truncate">{pair.afterFile.name}</p>
                      )}
                      {pair.afterError && (
                        <p className="text-xs text-destructive">{pair.afterError}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!canAddPair && (
              <p className="text-[11px] text-muted-foreground">
                Maksimal {MAX_PAIR_COUNT} bukti foto per laporan.
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSubmit} disabled={submitting || !assignmentId || !file} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...
              </>
            ) : (
              "Simpan Laporan"
            )}
          </Button>
        </div>
      </DialogContent>

      <LocationPicker
        open={mapPickerOpen}
        onOpenChange={setMapPickerOpen}
        initialLocation={
          manualCoords || coords || undefined
        }
        onLocationSelect={(location) => {
          setManualLat(location.latitude.toString());
          setManualLng(location.longitude.toString());
          setCoords(location);
          setError(null);
        }}
      />
    </Dialog>
  );
}
