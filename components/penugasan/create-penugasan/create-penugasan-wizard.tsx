'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Step1SPK } from './step-1-spk';
import { Step2Teknisi } from './step-2-teknisi';
import { Step3Alat } from './step-3-alat';
import { CreatePenugasanData, AssignTeknisiData, AssignAlatData } from '@/lib/penugasan/types';
import { validatePenugasanDate } from '@/lib/penugasan/utils';

interface CreatePenugasanWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (penugasan: any) => void;
}

const STEPS = [
  { id: 1, title: 'Informasi Dasar', description: 'Detail penugasan' },
  { id: 2, title: 'Assign Teknisi', description: 'Pilih teknisi yang akan ditugaskan' },
  { id: 3, title: 'Assign Alat', description: 'Pilih alat yang diperlukan' },
  { id: 4, title: 'Review & Konfirmasi', description: 'Periksa dan buat penugasan' },
];

export function CreatePenugasanWizard({ open, onOpenChange, onSuccess }: CreatePenugasanWizardProps) {
  const router = useRouter();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data
  const [formData, setFormData] = useState<Partial<CreatePenugasanData>>({
    judul: '',
    kategori: undefined,
    frekuensi_laporan: undefined,
    start_date: '',
    end_date: '',
    lokasi: '',
  });

  // Assignments
  const [teknisiSelected, setTeknisiSelected] = useState<string[]>([]);
  const [alatSelected, setAlatSelected] = useState<Array<{ alat_id: number; jumlah: number }>>([]);

  // Available resources
  const [availableTeknisi, setAvailableTeknisi] = useState<any[]>([]);
  const [availableAlat, setAvailableAlat] = useState<any[]>([]);

  // Load available resources when dialog opens
  useEffect(() => {
    if (open) {
      fetchAvailableResources();
    }
  }, [open]);

  const fetchAvailableResources = async () => {
    try {
      // Fetch all teknisi (available and non-available)
      const teknisiResponse = await fetch('/api/profil?peran=Teknisi');
      if (teknisiResponse.ok) {
        const teknisiData = await teknisiResponse.json();
        setAvailableTeknisi(teknisiData.data || []);
      }

      // Fetch available alat
      const alatResponse = await fetch('/api/alat?available=true');
      if (alatResponse.ok) {
        const alatData = await alatResponse.json();
        setAvailableAlat(alatData.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch available resources:', err);
    }
  };

  // Form handlers
  const handleFormDataChange = (data: Partial<CreatePenugasanData>) => {
    // Auto-set frekuensi_laporan berdasarkan kategori
    if (data.kategori) {
      const frekuensiMap: Record<string, 'Harian' | 'Mingguan'> = {
        'Rekonstruksi': 'Mingguan',
        'Instalasi': 'Harian',
        'Perawatan': 'Harian'
      };
      data.frekuensi_laporan = frekuensiMap[data.kategori] || 'Harian';
    }

    setFormData(prev => ({ ...prev, ...data }));
    // Clear related errors
    const updatedErrors = { ...errors };
    Object.keys(data).forEach(key => {
      if (updatedErrors[key]) {
        delete updatedErrors[key];
      }
    });
    setErrors(updatedErrors);
  };

  const handleTeknisiChange = (selected: string[]) => {
    setTeknisiSelected(selected);
  };

  const handleAlatChange = (selected: Array<{ alat_id: number; jumlah: number }>) => {
    setAlatSelected(selected);
  };

  // Validation
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.judul?.trim()) newErrors.judul = 'Judul penugasan wajib diisi';
      if (!formData.kategori) newErrors.kategori = 'Kategori wajib dipilih';
      if (!formData.frekuensi_laporan) newErrors.frekuensi_laporan = 'Frekuensi laporan wajib dipilih';
      if (!formData.start_date) newErrors.start_date = 'Tanggal mulai wajib diisi';
      if (!formData.lokasi) newErrors.lokasi = 'Lokasi wajib dipilih';

      // Date validation
      if (formData.start_date) {
        const dateValidation = validatePenugasanDate(formData.start_date, formData.end_date);
        if (!dateValidation.isValid) {
          newErrors.dates = dateValidation.error!;
        }
      }
    }

    if (currentStep === 2) {
      if (teknisiSelected.length === 0) {
        newErrors.teknisi = 'Minimal satu teknisi harus dipilih';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleCancel = () => {
    if (confirm('Apakah Anda yakin ingin membatalkan? Data yang belum disimpan akan hilang.')) {
      resetWizard();
      onOpenChange(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setFormData({
      judul: '',
      kategori: undefined,
      frekuensi_laporan: undefined,
      start_date: '',
      end_date: '',
      lokasi: '',
    });
    setTeknisiSelected([]);
    setAlatSelected([]);
    setErrors({});
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    try {
      setLoading(true);

      // Parse lokasi dari string ke object
      let lokasiObject;
      if (typeof formData.lokasi === 'string') {
        // Parse POINT(longitude latitude) format
        const pointMatch = formData.lokasi.match(/POINT\(([^ ]+) ([^)]+)\)/);
        if (pointMatch) {
          lokasiObject = {
            longitude: parseFloat(pointMatch[1]),
            latitude: parseFloat(pointMatch[2])
          };
        } else {
          throw new Error('Format lokasi tidak valid. Gunakan format: POINT(longitude latitude)');
        }
      } else {
        lokasiObject = formData.lokasi;
      }

      // Prepare data sesuai dengan API expectation
      const penugasanData = {
        judul: formData.judul,
        lokasi: lokasiObject,
        kategori: formData.kategori,
        frekuensi_laporan: formData.frekuensi_laporan,
        start_date: formData.start_date,
        end_date: formData.end_date,
        teknisi_ids: teknisiSelected,
        alat_assignments: alatSelected
      };

      // Create penugasan
      const createResponse = await fetch('/api/penugasan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(penugasanData),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create penugasan');
      }

      const newPenugasan = await createResponse.json();

      // Success
      resetWizard();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(newPenugasan);
      } else {
        router.push(`/views/spv/penugasan/${newPenugasan.id}?success=Penugasan berhasil dibuat`);
      }

    } catch (err) {
      console.error('Failed to create penugasan:', err);
      setErrors({ submit: err instanceof Error ? err.message : 'Gagal membuat penugasan. Silakan coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Penugasan Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex-1 text-center ${
                    step.id <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </div>
              ))}
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Step content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{STEPS[currentStep - 1].title}</CardTitle>
              <p className="text-sm text-muted-foreground">{STEPS[currentStep - 1].description}</p>
            </CardHeader>
            <CardContent>
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <Step1SPK
                  formData={formData}
                  onFormDataChange={handleFormDataChange}
                  errors={errors}
                />
              )}

              {/* Step 2: Assign Teknisi */}
              {currentStep === 2 && (
                <Step2Teknisi
                  availableTeknisi={availableTeknisi}
                  selectedTeknisi={teknisiSelected}
                  onTeknisiChange={handleTeknisiChange}
                  errors={errors}
                />
              )}

              {/* Step 3: Assign Alat */}
              {currentStep === 3 && (
                <Step3Alat
                  availableAlat={availableAlat}
                  selectedAlat={alatSelected}
                  onAlatChange={handleAlatChange}
                  errors={errors}
                />
              )}

              {/* Step 4: Review & Confirm */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Basic Info Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Informasi Dasar</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div><strong>Judul:</strong> {formData.judul}</div>
                        <div><strong>Kategori:</strong> {formData.kategori}</div>
                        <div><strong>Frekuensi Laporan:</strong> {formData.frekuensi_laporan}</div>
                        <div><strong>Tanggal Mulai:</strong> {formData.start_date}</div>
                        <div><strong>Tanggal Selesai:</strong> {formData.end_date || 'Tidak ditentukan'}</div>
                        <div><strong>Lokasi:</strong> {formData.lokasi}</div>
                      </CardContent>
                    </Card>

                    {/* Assignments Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Penugasan</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div><strong>Teknisi:</strong> {teknisiSelected.length} orang</div>
                        <div><strong>Alat:</strong> {alatSelected.length} jenis</div>
                        {alatSelected.length > 0 && (
                          <div className="mt-2">
                            <strong>Detail Alat:</strong>
                            <ul className="mt-1 ml-4 list-disc">
                              {alatSelected.map((item) => {
                                const alat = availableAlat.find(a => a.id === item.alat_id);
                                return alat ? (
                                  <li key={item.alat_id}>{alat.nama} (x{item.jumlah})</li>
                                ) : null;
                              })}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Submit error */}
                  {errors.submit && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive">{errors.submit}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? handleCancel : handlePrevious}
              disabled={loading}
            >
              {currentStep === 1 ? 'Batal' : 'Sebelumnya'}
            </Button>

            <Button
              onClick={currentStep === STEPS.length ? handleSubmit : handleNext}
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : currentStep === STEPS.length ? 'Buat Penugasan' : 'Selanjutnya'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
