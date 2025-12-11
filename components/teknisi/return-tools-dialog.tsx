"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { UploadCloud } from "lucide-react";

interface ActiveLoan {
  id: number;
  alat_id: number;
  jumlah: number;
  alat?: {
    nama?: string;
  } | null;
}

interface ReturnToolsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: number | null;
  assignmentTitle?: string;
  userId: string | null;
  tools: ActiveLoan[];
  onSuccess: () => void;
}

const BUCKET_NAME = "laporan-progres";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function ReturnToolsDialog({
  open,
  onOpenChange,
  assignmentId,
  assignmentTitle,
  userId,
  tools,
  onSuccess,
}: ReturnToolsDialogProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeLoan = useMemo(() => tools.find((loan) => loan.id === selectedLoanId) || null, [selectedLoanId, tools]);

  useEffect(() => {
    if (!open) return;
    if (!selectedLoanId && tools.length === 1) {
      setSelectedLoanId(tools[0].id);
      setReturnQuantity(tools[0].jumlah);
      return;
    }
    if (selectedLoanId && !tools.find((loan) => loan.id === selectedLoanId)) {
      setSelectedLoanId(null);
      setReturnQuantity(1);
    } else if (selectedLoanId) {
      const loan = tools.find((loan) => loan.id === selectedLoanId);
      if (loan) {
        setReturnQuantity(loan.jumlah);
        setQuantityError(null);
      }
    }
  }, [open, tools, selectedLoanId]);

  const reset = () => {
    setSelectedLoanId(null);
    setReturnQuantity(1);
    setFile(null);
    setFileError(null);
    setQuantityError(null);
    setStatus(null);
  };

  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
      setReturnQuantity(1);
      setQuantityError("Jumlah minimal 1");
      return;
    }

    if (activeLoan && numValue > activeLoan.jumlah) {
      setReturnQuantity(activeLoan.jumlah);
      setQuantityError(`Jumlah maksimal ${activeLoan.jumlah}`);
      return;
    }

    setReturnQuantity(numValue);
    setQuantityError(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      setFileError(null);
      return;
    }

    if (!selected.type.startsWith("image/")) {
      setFileError("Hanya menerima file gambar (JPG/PNG)");
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setFileError("Ukuran foto maksimal 5MB");
      setFile(null);
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
    if (!activeLoan) {
      throw new Error("Pilih alat yang ingin dikembalikan");
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "-");
    const path = `${userId}/${assignmentId}/returns/${activeLoan.alat_id}/${Date.now()}-${sanitizedName}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
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
    if (!activeLoan) {
      setStatus("Pilih alat yang ingin dikembalikan");
      return;
    }
    if (quantityError) {
      setStatus(quantityError);
      return;
    }
    if (!file) {
      setFileError("Foto bukti wajib diunggah");
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const fotoUrl = await uploadPhoto();
      const response = await fetch(`/api/penugasan/${assignmentId}/alat/${activeLoan.alat_id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          foto_url: fotoUrl,
          jumlah_dikembalikan: returnQuantity
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal mengembalikan alat");
      }

      reset();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Terjadi kesalahan saat mengembalikan alat");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
    }
    onOpenChange(next);
  };

  const hasTools = tools.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Kembalikan Alat{assignmentTitle ? ` • ${assignmentTitle}` : ""}
          </DialogTitle>
        </DialogHeader>

        {hasTools ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Alat</Label>
              <Select
                value={selectedLoanId ? selectedLoanId.toString() : undefined}
                onValueChange={(value) => setSelectedLoanId(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih alat yang akan dikembalikan" />
                </SelectTrigger>
                <SelectContent>
                  {tools.map((loan) => (
                    <SelectItem key={loan.id} value={loan.id.toString()}>
                      {loan.alat?.nama || `Alat ${loan.alat_id}`} • {loan.jumlah} unit
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeLoan && (
                <p className="text-xs text-muted-foreground">
                  Jumlah dipinjam: {activeLoan.jumlah} unit
                </p>
              )}
            </div>

            {activeLoan && (
              <div className="space-y-2">
                <Label>Jumlah yang Dikembalikan</Label>
                <Input
                  type="number"
                  min="1"
                  max={activeLoan.jumlah}
                  value={returnQuantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  placeholder="Masukkan jumlah"
                />
                <p className="text-xs text-muted-foreground">
                  Minimal 1, maksimal {activeLoan.jumlah} unit
                </p>
                {quantityError && <p className="text-xs text-destructive">{quantityError}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label>Foto Bukti Pengembalian</Label>
              <Input type="file" accept="image/*" capture="environment" onChange={handleFileChange} />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <UploadCloud className="h-3 w-3" /> Format JPG/PNG maksimal 5MB.
              </p>
              {fileError && <p className="text-xs text-destructive">{fileError}</p>}
            </div>

            {status && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{status}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleSubmit} disabled={submitting || !assignmentId} className="w-full">
              {submitting ? "Mengirim..." : `Kembalikan ${returnQuantity} Unit Alat`}
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Semua alat sudah dikembalikan untuk penugasan ini.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
