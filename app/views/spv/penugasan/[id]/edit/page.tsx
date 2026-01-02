'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Save, AlertCircle, CheckCircle, MapPin } from 'lucide-react';
import { PenugasanWithRelations, KategoriPenugasan, FrekuensiLaporan } from '@/lib/penugasan/types';
import { PENUGASAN_KATEGORI, PENUGASAN_FREKUENSI_LABELS } from '@/lib/penugasan/constants';
import { validatePenugasanDate } from '@/lib/penugasan/utils';
import { LocationPicker } from '@/components/ui/location-picker';

const HEX_STRING_REGEX = /^[0-9a-fA-F]+$/;

const parseWkbPoint = (hexString: string): { latitude: number; longitude: number } | null => {
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
      offset += 4;
    }

    if (offset + 16 > view.byteLength) {
      return null;
    }

    const longitude = view.getFloat64(offset, littleEndian);
    offset += 8;
    const latitude = view.getFloat64(offset, littleEndian);

    return { latitude, longitude };
  } catch (error) {
    console.warn('Failed to parse WKB location value', error);
    return null;
  }
};

const normalizeLocationToPointString = (value?: string): string => {
  if (!value) return '';

  const trimmed = value.trim();
  if (trimmed.startsWith('POINT(')) {
    return trimmed;
  }

  const coords = parseWkbPoint(trimmed);
  if (coords) {
    return `POINT(${coords.longitude} ${coords.latitude})`;
  }

  return value;
};

export default function EditPenugasanPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const penugasanId = params?.id;
  const FREKUENSI_BY_KATEGORI: Record<KategoriPenugasan, FrekuensiLaporan> = {
    Rekonstruksi: 'Mingguan',
    Instalasi: 'Harian',
    Perawatan: 'Harian',
  };
  const getFrekuensiForKategori = (
    kategori: string | undefined,
    fallback?: string
  ): FrekuensiLaporan | '' => {
    if (kategori && FREKUENSI_BY_KATEGORI[kategori as KategoriPenugasan]) {
      return FREKUENSI_BY_KATEGORI[kategori as KategoriPenugasan];
    }
    return (fallback as FrekuensiLaporan) || '';
  };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    judul: '',
    kategori: '' as KategoriPenugasan | '',
    frekuensi_laporan: '' as FrekuensiLaporan | '',
    start_date: '',
    end_date: '',
    lokasi: '',
  });

  const [originalData, setOriginalData] = useState<any>(null);
  const [penugasan, setPenugasan] = useState<PenugasanWithRelations | null>(null);

  // Load data
  useEffect(() => {
    if (penugasanId) {
      loadPenugasan(penugasanId);
    }
  }, [penugasanId]);

  const loadPenugasan = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/penugasan/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load penugasan');
      }

      const data = await response.json();
      const penugasanData = data.data;
      const kategoriValue = (penugasanData.kategori || '') as KategoriPenugasan | '';
      const frekuensiValue = getFrekuensiForKategori(
        kategoriValue,
        penugasanData.frekuensi_laporan
      );
      const lokasiRaw = penugasanData.lokasi_text || penugasanData.lokasi || '';
      const lokasiValue = normalizeLocationToPointString(lokasiRaw);

      const normalizedPenugasan = {
        ...penugasanData,
        frekuensi_laporan: frekuensiValue || penugasanData.frekuensi_laporan,
        lokasi: lokasiValue,
      } as PenugasanWithRelations;

      setPenugasan(normalizedPenugasan);
      setOriginalData(normalizedPenugasan);

      // Set form data
      setFormData({
        judul: normalizedPenugasan.judul || '',
        kategori: kategoriValue,
        frekuensi_laporan: normalizedPenugasan.frekuensi_laporan || '',
        start_date: normalizedPenugasan.start_date || '',
        end_date: normalizedPenugasan.end_date || '',
        lokasi: lokasiValue,
      });

    } catch (err) {
      console.error('Failed to load penugasan:', err);
      setError(err instanceof Error ? err.message : 'Failed to load penugasan');
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'kategori' && value) {
        updated.frekuensi_laporan = getFrekuensiForKategori(value, prev.frekuensi_laporan);
      }
      return updated;
    });
    setError(null);
    setSuccess(null);
  };

  const getCurrentLocation = () => {
    if (!formData.lokasi) return undefined;

    const match = formData.lokasi.match(/POINT\(([^ ]+) ([^)]+)\)/);
    if (match) {
      return {
        latitude: parseFloat(match[2]),
        longitude: parseFloat(match[1])
      };
    }

    const wkbCoords = parseWkbPoint(formData.lokasi);
    if (wkbCoords) {
      return wkbCoords;
    }
    return undefined;
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number }) => {
    const pointString = `POINT(${location.longitude} ${location.latitude})`;
    handleInputChange('lokasi', pointString);
  };

  // Validation
  const validateForm = (): boolean => {
    if (!formData.judul.trim()) {
      setError('Judul penugasan wajib diisi');
      return false;
    }

    if (!formData.kategori) {
      setError('Kategori wajib dipilih');
      return false;
    }

    if (!formData.frekuensi_laporan) {
      setError('Frekuensi laporan wajib dipilih');
      return false;
    }

    if (!formData.start_date) {
      setError('Tanggal mulai wajib diisi');
      return false;
    }

    if (!formData.lokasi.trim()) {
      setError('Lokasi wajib diisi');
      return false;
    }

    // Date validation
    const dateValidation = validatePenugasanDate(formData.start_date, formData.end_date);
    if (!dateValidation.isValid) {
      setError(dateValidation.error!);
      return false;
    }

    return true;
  };

  // Check if form has changes
  const hasChanges = () => {
    if (!originalData) return false;

    return (
      formData.judul !== originalData.judul ||
      formData.kategori !== originalData.kategori ||
      formData.frekuensi_laporan !== originalData.frekuensi_laporan ||
      formData.start_date !== originalData.start_date ||
      formData.end_date !== originalData.end_date ||
      formData.lokasi !== originalData.lokasi
    );
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!penugasanId) {
      setError('ID penugasan tidak valid');
      return;
    }

    if (!validateForm() || !hasChanges()) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const locationForPayload = getCurrentLocation();
      const payload: Record<string, any> = {
        judul: formData.judul,
        kategori: formData.kategori,
        frekuensi_laporan: formData.frekuensi_laporan,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
      };

      if (locationForPayload) {
        payload.lokasi = {
          latitude: locationForPayload.latitude,
          longitude: locationForPayload.longitude,
        };
      }

      const response = await fetch(`/api/penugasan/${penugasanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update penugasan');
      }

      const result = await response.json();
      setSuccess('Penugasan berhasil diperbarui');

      setPenugasan(prev => {
        if (!prev) return prev;

        const updatedKategori = (formData.kategori || prev.kategori) as KategoriPenugasan;
        const updatedFrekuensi = (formData.frekuensi_laporan || prev.frekuensi_laporan) as FrekuensiLaporan;

        return {
          ...prev,
          ...formData,
          kategori: updatedKategori,
          frekuensi_laporan: updatedFrekuensi,
        };
      });
      setOriginalData({ ...formData });

      // Redirect after short delay
      setTimeout(() => {
        router.push(`/views/spv/penugasan/${penugasanId}?success=Penugasan berhasil diperbarui`);
      }, 1500);

    } catch (err) {
      console.error('Failed to update penugasan:', err);
      setError(err instanceof Error ? err.message : 'Failed to update penugasan');
    } finally {
      setSaving(false);
    }
  };

  // Cancel handler
  const handleCancel = () => {
    if (!penugasanId) {
      router.push('/views/spv/penugasan');
      return;
    }
    if (hasChanges()) {
      if (confirm('Ada perubahan yang belum disimpan. Yakin ingin membatalkan?')) {
        router.push(`/views/spv/penugasan/${penugasanId}`);
      }
    } else {
      router.push(`/views/spv/penugasan/${penugasanId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!penugasan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Penugasan tidak ditemukan</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if penugasan can be edited
  const canEdit = penugasan.status === 'Aktif';

  if (!canEdit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Penugasan dengan status "{penugasan.status}" tidak dapat diedit
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => router.push(penugasanId ? `/views/spv/penugasan/${penugasanId}` : '/views/spv/penugasan')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Penugasan</h1>
          <p className="text-muted-foreground">{penugasan.judul}</p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Judul */}
            <div className="space-y-2">
              <Label htmlFor="judul">Judul Penugasan *</Label>
              <Input
                id="judul"
                value={formData.judul}
                onChange={(e) => handleInputChange('judul', e.target.value)}
                placeholder="Masukkan judul penugasan"
                required
              />
            </div>

            {/* Kategori */}
            <div className="space-y-2">
              <Label htmlFor="kategori">Kategori *</Label>
              <Select
                value={formData.kategori}
                onValueChange={(value) => handleInputChange('kategori', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PENUGASAN_KATEGORI).map(([key, label]) => (
                    <SelectItem key={key} value={label}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Frekuensi Laporan */}
            <div className="space-y-2">
              <Label htmlFor="frekuensi_laporan">Frekuensi Laporan *</Label>
              <Select
                value={formData.frekuensi_laporan}
                onValueChange={(value) => handleInputChange('frekuensi_laporan', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Frekuensi mengikuti kategori" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PENUGASAN_FREKUENSI_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={label}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
             
            </div>

            {/* Tanggal Mulai */}
            <div className="space-y-2">
              <Label htmlFor="start_date">Tanggal Mulai *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                required
              />
            </div>

            {/* Tanggal Selesai */}
            <div className="space-y-2">
              <Label htmlFor="end_date">Tanggal Selesai (Opsional)</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Kosongkan jika tidak ada batas waktu
              </p>
            </div>

            {/* Lokasi */}
            <div className="space-y-2">
              <Label htmlFor="lokasi">Lokasi *</Label>
              <div className="flex gap-2">
                <Input
                  id="lokasi"
                  value={formData.lokasi || ''}
                  onChange={(e) => handleInputChange('lokasi', e.target.value)}
                  placeholder="POINT(longitude latitude) - contoh: POINT(106.8456 -6.2088)"
                  className="flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowMapPicker(true)}
                  title="Pilih lokasi dari peta"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Format: POINT(longitude latitude). Gunakan tombol peta untuk memilih lokasi interaktif
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={saving || !hasChanges()}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </form>

      <LocationPicker
        open={showMapPicker}
        onOpenChange={setShowMapPicker}
        initialLocation={getCurrentLocation()}
        onLocationSelect={handleLocationSelect}
      />
    </div>
  );
}
