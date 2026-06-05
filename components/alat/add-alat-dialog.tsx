"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Camera } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddAlatDialogProps {
  children: React.ReactNode;
  onAlatAdded?: () => void;
}

export function AddAlatDialog({ children, onAlatAdded }: AddAlatDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    tipe_alat: "",
    deskripsi: "",
    stok_total: "",
    foto_url: ""
  });
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    setIsMobile(isMobileDevice);
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama.trim()) {
      newErrors.nama = "Nama alat harus diisi";
    }

    const stokTotal = parseInt(formData.stok_total);
    if (!formData.stok_total || isNaN(stokTotal) || stokTotal < 0) {
      newErrors.stok_total = "Stok total harus berupa angka positif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Silakan upload file gambar');
      return;
    }

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const response = await fetch('/api/upload/alat-foto', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Gagal upload foto');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, foto_url: data.url }));
      
      // Preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal upload foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/alat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama: formData.nama.trim(),
          tipe_alat: formData.tipe_alat.trim() || null,
          deskripsi: formData.deskripsi.trim() || null,
          stok_total: parseInt(formData.stok_total),
          foto_url: formData.foto_url || null
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add alat");
      }

      console.log("Berhasil: Alat berhasil ditambahkan");

      // Reset form
      setFormData({ nama: "", tipe_alat: "", deskripsi: "", stok_total: "", foto_url: "" });
      setFotoPreview("");
      setErrors({});
      setOpen(false);

      // Refresh list
      onAlatAdded?.();

    } catch (error) {
      console.error("Error adding alat:", error);
      alert(error instanceof Error ? error.message : "Gagal menambah alat");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>
        {children}
      </div>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Alat Baru</DialogTitle>
          <DialogDescription>
            Tambahkan alat baru ke inventaris. Stok tersedia akan otomatis diset sama dengan stok total.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Foto Alat */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="foto" className="text-right mt-2">
                Foto Alat
              </Label>
              <div className="col-span-3 space-y-2">
                {fotoPreview ? (
                  <div className="relative w-full h-32 bg-muted rounded border">
                    <img
                      src={fotoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1"
                      onClick={() => {
                        setFotoPreview("");
                        setFormData(prev => ({ ...prev, foto_url: "" }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {isMobile && (
                      <button
                        type="button"
                        onClick={() => document.getElementById('camera-input')?.click()}
                        disabled={isUploading}
                        className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-muted-foreground rounded py-4 px-3 cursor-pointer hover:bg-muted/50 transition"
                      >
                        <Camera className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Kamera</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => document.getElementById('gallery-input')?.click()}
                      disabled={isUploading}
                      className={`flex items-center justify-center gap-2 border-2 border-dashed border-muted-foreground rounded py-4 px-3 cursor-pointer hover:bg-muted/50 transition ${isMobile ? 'flex-1' : 'w-full'}`}
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{isMobile ? 'Galeri' : 'Upload Foto'}</span>
                    </button>
                  </div>
                )}
                <input
                  id="camera-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  disabled={isUploading}
                />
                <input
                  id="gallery-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  disabled={isUploading}
                />
                {isUploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
              </div>
            </div>

            {/* Nama Alat */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nama" className="text-right">
                Nama Alat
              </Label>
              <div className="col-span-3">
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => handleInputChange("nama", e.target.value)}
                  placeholder="Masukkan nama alat"
                  className={errors.nama ? "border-destructive" : ""}
                />
                {errors.nama && (
                  <p className="text-sm text-destructive mt-1">{errors.nama}</p>
                )}
              </div>
            </div>

            {/* Tipe Alat */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipe_alat" className="text-right">
                Tipe Alat
              </Label>
              <Select
                value={formData.tipe_alat}
                onValueChange={(value) => handleInputChange("tipe_alat", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih tipe alat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alat Rekonstruksi">Alat Rekonstruksi</SelectItem>
                  <SelectItem value="Alat Ketinggian">Alat Ketinggian</SelectItem>
                  <SelectItem value="Alat Instalasi">Alat Instalasi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Deskripsi */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="deskripsi" className="text-right mt-2">
                Deskripsi
              </Label>
              <Textarea
                id="deskripsi"
                value={formData.deskripsi}
                onChange={(e) => handleInputChange("deskripsi", e.target.value)}
                placeholder="Detail alat, spesifikasi, kondisi, dll"
                className="col-span-3 resize-none"
                rows={3}
              />
            </div>

            {/* Stok Total */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stok_total" className="text-right">
                Stok Total
              </Label>
              <div className="col-span-3">
                <Input
                  id="stok_total"
                  type="number"
                  min="0"
                  value={formData.stok_total}
                  onChange={(e) => handleInputChange("stok_total", e.target.value)}
                  placeholder="0"
                  className={errors.stok_total ? "border-destructive" : ""}
                />
                {errors.stok_total && (
                  <p className="text-sm text-destructive mt-1">{errors.stok_total}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}