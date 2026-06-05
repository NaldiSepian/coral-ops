'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { CreatePenugasanData, KategoriPenugasan, FrekuensiLaporan } from '@/lib/penugasan/types';
import { PENUGASAN_KATEGORI, PENUGASAN_FREKUENSI_LAPORAN } from '@/lib/penugasan/constants';
import { LocationPicker } from '@/components/ui/location-picker';

interface Step1SPKProps {
  formData: Partial<CreatePenugasanData>;
  onFormDataChange: (data: Partial<CreatePenugasanData>) => void;
  errors: Record<string, string>;
}

export function Step1SPK({ formData, onFormDataChange, errors }: Step1SPKProps) {
  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleChange = (field: keyof CreatePenugasanData, value: any) => {
    onFormDataChange({ [field]: value });
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number }) => {
    const pointString = `POINT(${location.longitude} ${location.latitude})`;
    handleChange('lokasi', pointString);
  };

  // Parse current location for map picker
  const getCurrentLocation = () => {
    if (!formData.lokasi) return undefined;

    const match = formData.lokasi.match(/POINT\(([^ ]+) ([^)]+)\)/);
    if (match) {
      return {
        latitude: parseFloat(match[2]),
        longitude: parseFloat(match[1])
      };
    }
    return undefined;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Judul */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="judul">Judul Penugasan *</Label>
          <Input
            id="judul"
            value={formData.judul || ''}
            onChange={(e) => handleChange('judul', e.target.value)}
            placeholder="Masukkan judul penugasan"
            maxLength={150}
          />
          {errors.judul && <p className="text-sm text-destructive">{errors.judul}</p>}
        </div>

        {/* Kategori */}
        <div className="space-y-2">
          <Label htmlFor="kategori">Kategori *</Label>
          <Select
            value={formData.kategori || ''}
            onValueChange={(value) => handleChange('kategori', value as KategoriPenugasan)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PENUGASAN_KATEGORI).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.kategori && <p className="text-sm text-destructive">{errors.kategori}</p>}
        </div>

        {/* Frekuensi Laporan */}
        <div className="space-y-2">
          <Label htmlFor="frekuensi_laporan">Frekuensi Laporan *</Label>
          <Select
            value={formData.frekuensi_laporan || ''}
            onValueChange={(value) => handleChange('frekuensi_laporan', value as FrekuensiLaporan)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih frekuensi laporan" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PENUGASAN_FREKUENSI_LAPORAN).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.frekuensi_laporan && <p className="text-sm text-destructive">{errors.frekuensi_laporan}</p>}
        </div>

        {/* Tanggal Mulai */}
        <div className="space-y-2">
          <Label htmlFor="start_date">Tanggal Mulai *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date || ''}
            onChange={(e) => handleChange('start_date', e.target.value)}
          />
          {errors.start_date && <p className="text-sm text-destructive">{errors.start_date}</p>}
        </div>

        {/* Tanggal Selesai */}
        <div className="space-y-2">
          <Label htmlFor="end_date">Tanggal Selesai</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date || ''}
            onChange={(e) => handleChange('end_date', e.target.value)}
          />
        </div>

        {/* Lokasi */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="lokasi">Lokasi *</Label>
          <div className="flex gap-2">
            <Input
              id="lokasi"
              value={formData.lokasi || ''}
              onChange={(e) => handleChange('lokasi', e.target.value)}
              placeholder="POINT(longitude latitude) - contoh: POINT(106.8456 -6.2088)"
              className="flex-1"
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
          {errors.lokasi && <p className="text-sm text-destructive">{errors.lokasi}</p>}
        </div>

        {/* Deskripsi (optional) */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="deskripsi">Deskripsi</Label>
          <Textarea
            id="deskripsi"
            value={(formData as any).deskripsi || ''}
            onChange={(e) => handleChange('deskripsi' as any, e.target.value)}
            placeholder="Deskripsi detail penugasan (opsional)"
            rows={3}
          />
        </div>
      </div>

      {/* Date validation error */}
      {errors.dates && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{errors.dates}</p>
        </div>
      )}

      {/* Location Picker Modal */}
      <LocationPicker
        open={showMapPicker}
        onOpenChange={setShowMapPicker}
        initialLocation={getCurrentLocation()}
        onLocationSelect={handleLocationSelect}
      />
    </div>
  );
}
