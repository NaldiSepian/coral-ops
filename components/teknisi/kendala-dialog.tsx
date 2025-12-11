"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

const KENDALA_TYPES = [
  { value: 'Cuaca', label: 'Cuaca Buruk' },
  { value: 'Akses', label: 'Akses Lokasi' },
  { value: 'Teknis', label: 'Kendala Teknis' },
  { value: 'Lain', label: 'Lainnya' },
];

interface KendalaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: number | null;
  userId: string | null;
  onSuccess: () => void;
}

export function KendalaDialog({ open, onOpenChange, assignmentId, userId, onSuccess }: KendalaDialogProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [tipe, setTipe] = useState('Cuaca');
  const [durasi, setDurasi] = useState(1); // Default 1 hari
  const [alasan, setAlasan] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTipe('Cuaca');
    setDurasi(1); // Reset ke 1 hari
    setAlasan('');
    setFile(null);
    setStatus(null);
  };

  const handleUpload = async (): Promise<string | null> => {
    if (!file) return null;
    if (!userId) {
      throw new Error('User tidak valid');
    }
    if (!assignmentId) {
      throw new Error('Penugasan tidak ditemukan');
    }
    const bucket = 'kendala_proofs';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '-');
    const path = `${userId}/${assignmentId}/${Date.now()}-${sanitizedName}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) {
      throw new Error('Gagal mengunggah bukti: ' + error.message);
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!assignmentId) return;
    setSubmitting(true);
    setStatus(null);
    try {
      let foto_url: string | null = null;
      if (file) {
        foto_url = await handleUpload();
      }

      // Konversi hari ke menit (1 hari = 1440 menit)
      const durasiMenit = durasi * 24 * 60;

      const response = await fetch(`/api/penugasan/${assignmentId}/kendala`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alasan,
          durasi_menit: durasiMenit,
          tipe_kendala: tipe,
          foto_url,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gagal mengirim kendala');
      }

      reset();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) reset(); onOpenChange(value); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajukan Kendala</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Tipe Kendala</Label>
              <Select value={tipe} onValueChange={setTipe}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kendala" />
                </SelectTrigger>
                <SelectContent>
                  {KENDALA_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Durasi Perpanjangan (hari)</Label>
              <Input
                type="number"
                min={1}
                max={7}
                step={1}
                value={durasi}
                onChange={(e) => setDurasi(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Maksimal 7 hari perpanjangan</p>
            </div>
            <div className="space-y-2">
              <Label>Alasan</Label>
              <Textarea
                rows={4}
                placeholder="Jelaskan kendala yang terjadi"
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Foto Bukti</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <p className="text-xs text-muted-foreground">Format JPG/PNG, maksimal 5MB.</p>
            </div>
          </div>

          {status && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{status}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSubmit} disabled={submitting || !assignmentId} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kirim Kendala'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
