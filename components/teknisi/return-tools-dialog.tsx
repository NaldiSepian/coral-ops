"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { Wrench } from "lucide-react";
import Image from "next/image";

interface ActiveLoan {
  id: number;
  alat_id: number;
  jumlah: number;
  alat?: {
    nama?: string;
    foto_url?: string;
    tipe_alat?: string;
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
  const [photoMode, setPhotoMode] = useState<'individual' | 'bulk'>('individual');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [individualFiles, setIndividualFiles] = useState<{ [alatId: number]: File | null }>({});
  const [individualErrors, setIndividualErrors] = useState<{ [alatId: number]: string | null }>({});
  const [returnQuantities, setReturnQuantities] = useState<{ [alatId: number]: number }>({});
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const qty: { [alatId: number]: number } = {};
    tools.forEach((t) => { qty[t.alat_id] = t.jumlah; });
    setReturnQuantities(qty);
  }, [open, tools]);

  const reset = () => {
    setPhotoMode('individual');
    setBulkFile(null);
    setBulkError(null);
    setIndividualFiles({});
    setIndividualErrors({});
    setStatus(null);
  };

  const validateImage = (selected: File | null): string | null => {
    if (!selected) return null;
    if (!selected.type.startsWith("image/")) return "Hanya menerima file gambar (JPG/PNG)";
    if (selected.size > MAX_FILE_SIZE) return "Ukuran foto maksimal 5MB";
    return null;
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    const err = validateImage(selected);
    setBulkFile(selected);
    setBulkError(err);
  };

  const handleIndividualFileChange = (alatId: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    const err = validateImage(selected);
    setIndividualFiles((prev) => ({ ...prev, [alatId]: selected }));
    setIndividualErrors((prev) => ({ ...prev, [alatId]: err }));
  };

  const handleQuantityChange = (alatId: number, value: string) => {
    const tool = tools.find((t) => t.alat_id === alatId);
    if (!tool) return;
    if (value === "" || /^0\d/.test(value)) {
      setReturnQuantities((prev) => ({ ...prev, [alatId]: 1 }));
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) {
      setReturnQuantities((prev) => ({ ...prev, [alatId]: 1 }));
      return;
    }
    setReturnQuantities((prev) => ({ ...prev, [alatId]: Math.min(num, tool.jumlah) }));
  };

  const uploadFile = async (file: File, alatId: number): Promise<string> => {
    if (!userId || !assignmentId) throw new Error("User atau penugasan tidak valid");
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "-");
    const path = `${userId}/${assignmentId}/returns/${alatId}/${Date.now()}-${sanitizedName}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (uploadError) throw new Error(uploadError.message || "Gagal mengunggah foto");
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!assignmentId) return;

    if (photoMode === 'bulk') {
      if (!bulkFile) {
        setBulkError("Foto bukti wajib diunggah");
        return;
      }
    } else {
      const missing = tools.filter((t) => !individualFiles[t.alat_id]);
      if (missing.length > 0) {
        setStatus(`Foto untuk ${missing.map((t) => t.alat?.nama || `alat ${t.alat_id}`).join(', ')} wajib diunggah`);
        return;
      }
      const hasError = tools.some((t) => individualErrors[t.alat_id]);
      if (hasError) return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      let bulkFotoUrl: string | null = null;
      if (photoMode === 'bulk') {
        bulkFotoUrl = await uploadFile(bulkFile!, 0);
      }

      for (const tool of tools) {
        const alatId = tool.alat_id;
        const fotoUrl = photoMode === 'bulk' ? bulkFotoUrl! : await uploadFile(individualFiles[alatId]!, alatId);
        const qty = returnQuantities[alatId] || tool.jumlah;

        const response = await fetch(`/api/penugasan/${assignmentId}/alat/${alatId}/return`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foto_url: fotoUrl, jumlah_dikembalikan: qty }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || `Gagal mengembalikan ${tool.alat?.nama || `alat ${alatId}`}`);
        }
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
    if (!next) reset();
    onOpenChange(next);
  };

  const hasTools = tools.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Kembalikan Alat{assignmentTitle ? ` • ${assignmentTitle}` : ""}
          </DialogTitle>
        </DialogHeader>

        {hasTools ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {tools.length} alat yang akan dikembalikan
            </p>

            <RadioGroup
              value={photoMode}
              onValueChange={(value) => setPhotoMode(value as 'individual' | 'bulk')}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="return-individual" />
                <Label htmlFor="return-individual" className="text-sm">Satu per alat</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bulk" id="return-bulk" />
                <Label htmlFor="return-bulk" className="text-sm">Satu untuk semua alat</Label>
              </div>
            </RadioGroup>

            {photoMode === 'individual' ? (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {tools.map((tool) => (
                  <div key={tool.id} className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {tool.alat?.foto_url ? (
                          <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden relative">
                            <Image src={tool.alat.foto_url} alt={tool.alat.nama || ""} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Wrench className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm font-medium">{tool.alat?.nama || `Alat ${tool.alat_id}`}</Label>
                        {tool.alat?.tipe_alat && (
                          <p className="text-xs text-muted-foreground">{tool.alat.tipe_alat}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Jml:</Label>
                          <Input
                            type="number"
                            min="1"
                            max={tool.jumlah}
                            value={returnQuantities[tool.alat_id] || tool.jumlah}
                            onChange={(e) => handleQuantityChange(tool.alat_id, e.target.value)}
                            className="w-20 h-8 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">/ {tool.jumlah}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleIndividualFileChange(tool.alat_id)}
                      />
                      {individualErrors[tool.alat_id] && (
                        <p className="text-xs text-destructive mt-1">{individualErrors[tool.alat_id]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium">Semua alat ({tools.length})</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Satu foto bukti akan digunakan untuk semua alat yang dikembalikan.
                </p>
                <Input type="file" accept="image/*" capture="environment" onChange={handleBulkFileChange} />
                {bulkError && <p className="text-xs text-destructive">{bulkError}</p>}
              </div>
            )}

            {status && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{status}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleSubmit} disabled={submitting || !assignmentId} className="w-full">
              {submitting ? "Mengirim..." : `Kembalikan ${tools.length} Alat`}
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
