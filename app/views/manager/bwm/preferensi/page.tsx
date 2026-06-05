"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Scale,
  Plus,
  Check,
  X,
  AlertTriangle,
  Trash2,
  Star,
  ArrowRightLeft,
  Pencil,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PreferensiBWM {
  id: string;
  nama: string;
  best_criteria: string;
  worst_criteria: string;
  is_active: boolean;
  created_at: string;
  // BO Vectors
  bo_c1: number;
  bo_c2: number;
  bo_c3: number;
  bo_c4: number;
  bo_c5: number;
  // OW Vectors
  ow_c1: number;
  ow_c2: number;
  ow_c3: number;
  ow_c4: number;
  ow_c5: number;
}

const CRITERIA_LABELS: Record<string, string> = {
  c1: "C1 - Kecepatan",
  c2: "C2 - Kualitas",
  c3: "C3 - Kepatuhan",
  c4: "C4 - Proaktivitas",
  c5: "C5 - Kompetensi",
};

const SCALE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function PreferensiBWMPage() {
  const [preferensiList, setPreferensiList] = useState<PreferensiBWM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; show: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nama: "",
    best_criteria: "",
    worst_criteria: "",
    bo: { c1: 1, c2: 1, c3: 1, c4: 1, c5: 1 },
    ow: { c1: 1, c2: 1, c3: 1, c4: 1, c5: 1 },
  });

  const fetchPreferensi = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/bwm/preferensi");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil data");
      }

      setPreferensiList(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferensi();
  }, [fetchPreferensi]);

  const handleSubmit = async () => {
    if (!formData.nama || !formData.best_criteria || !formData.worst_criteria) {
      setDialogError("Nama, Best Criteria, dan Worst Criteria wajib diisi");
      return;
    }

    // Validasi: best dan worst harus beda
    if (formData.best_criteria === formData.worst_criteria) {
      setDialogError("Best dan Worst criteria harus berbeda");
      return;
    }

    // Validasi: best vs itself = 1, worst vs itself = 1
    const boKey = `c${formData.best_criteria.replace("c", "")}` as keyof typeof formData.bo;
    const owKey = `c${formData.worst_criteria.replace("c", "")}` as keyof typeof formData.ow;

    if (formData.bo[boKey] !== 1) {
      setDialogError(`BO untuk Best Criteria (${formData.best_criteria}) harus = 1`);
      return;
    }

    if (formData.ow[owKey] !== 1) {
      setDialogError(`OW untuk Worst Criteria (${formData.worst_criteria}) harus = 1`);
      return;
    }

    setSubmitting(true);
    setDialogError(null);

    try {
      const url = "/api/bwm/preferensi";
      const method = editingId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          nama: formData.nama,
          best_criteria: formData.best_criteria,
          worst_criteria: formData.worst_criteria,
          bo_c1: formData.bo.c1,
          bo_c2: formData.bo.c2,
          bo_c3: formData.bo.c3,
          bo_c4: formData.bo.c4,
          bo_c5: formData.bo.c5,
          ow_c1: formData.ow.c1,
          ow_c2: formData.ow.c2,
          ow_c3: formData.ow.c3,
          ow_c4: formData.ow.c4,
          ow_c5: formData.ow.c5,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details?.length > 0 
          ? data.details.join("\n")
          : data.error || "Gagal menyimpan preferensi";
        setDialogError(errorMsg);
        return;
      }

      setShowDialog(false);
      setDialogError(null);
      setEditingId(null);
      fetchPreferensi();
      showToast(editingId ? "Preferensi diperbarui" : "Preferensi dibuat", "success");

      // Reset form
      setFormData({
        nama: "",
        best_criteria: "",
        worst_criteria: "",
        bo: { c1: 1, c2: 1, c3: 1, c4: 1, c5: 1 },
        ow: { c1: 1, c2: 1, c3: 1, c4: 1, c5: 1 },
      });
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSetActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/bwm/preferensi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal mengupdate preferensi");
      }

      const data = await response.json();
      showToast(data.message || `Preferensi ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
      fetchPreferensi();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Terjadi kesalahan", 'error');
    }
  };

  const handleEdit = (pref: PreferensiBWM) => {
    setEditingId(pref.id);
    setFormData({
      nama: pref.nama,
      best_criteria: pref.best_criteria,
      worst_criteria: pref.worst_criteria,
      bo: {
        c1: pref.bo_c1,
        c2: pref.bo_c2,
        c3: pref.bo_c3,
        c4: pref.bo_c4,
        c5: pref.bo_c5,
      },
      ow: {
        c1: pref.ow_c1,
        c2: pref.ow_c2,
        c3: pref.ow_c3,
        c4: pref.ow_c4,
        c5: pref.ow_c5,
      },
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(`/api/bwm/preferensi?id=${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal menghapus preferensi");
      }

      showToast("Preferensi berhasil dihapus", "success");
      fetchPreferensi();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Terjadi kesalahan", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const renderBOOWForm = (
    type: "bo" | "ow",
    values: typeof formData.bo,
    setValues: (v: typeof formData.bo) => void,
    disabledCriteria?: string
  ) => (
    <div className="grid grid-cols-5 gap-2">
      {["c1", "c2", "c3", "c4", "c5"].map((c) => {
        const isDisabled = disabledCriteria === c;
        return (
          <div key={`${type}-${c}`} className="space-y-1">
            <Label className={`text-xs ${isDisabled ? "text-green-600 font-medium" : ""}`}>
              {CRITERIA_LABELS[c]}
              {isDisabled && " (Auto)"}
            </Label>
            <Select
              value={String(values[c as keyof typeof values])}
              onValueChange={(v) =>
                setValues({ ...values, [c]: parseInt(v) })
              }
              disabled={isDisabled}
            >
              <SelectTrigger className={`h-8 ${isDisabled ? "bg-green-50 text-black border-green-200" : ""}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCALE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 xl:flex-row xl:items-center xl:justify-between xl:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Preferensi BWM</h1>
          <p className="text-muted-foreground">Atur bobot prioritas kriteria untuk perhitungan gaji teknisi</p>
        </div>
        <Button variant="outline" onClick={fetchPreferensi} disabled={loading}>
          {loading ? "Memuat..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Tutup
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Error untuk fetch/aktivasi - bukan form */}

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Total: {preferensiList.length} preferensi
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) {
            setDialogError(null);
            setEditingId(null);
            setFormData({
              nama: "",
              best_criteria: "",
              worst_criteria: "",
              bo: { c1: 1, c2: 1, c3: 1, c4: 1, c5: 1 },
              ow: { c1: 1, c2: 1, c3: 1, c4: 1, c5: 1 },
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({
                nama: "",
                best_criteria: "",
                worst_criteria: "",
                bo: { c1: 1, c2: 1, c3: 1, c4: 1, c5: 1 },
                ow: { c1: 1, c2: 1, c3: 1, c4: 1, c5: 1 },
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Buat Preferensi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Preferensi BWM" : "Buat Preferensi BWM Baru"}</DialogTitle>
              <DialogDescription>
                Tentukan kriteria Best (paling penting) dan Worst (paling tidak penting)
              </DialogDescription>
            </DialogHeader>

            {dialogError && (
              <Alert className="mt-4 border-orange-500 bg-orange-50 dark:bg-orange-950/30">
                <AlertDescription className="whitespace-pre-line text-orange-800 dark:text-orange-200">
                  {dialogError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nama Preferensi</Label>
                <Input
                  placeholder="e.g., Preferensi Q1 2025"
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Best Criteria (Paling Penting)
                  </Label>
                  <Select
                    value={formData.best_criteria}
                    onValueChange={(v) => {
                      const newBO = { ...formData.bo, [v]: 1 };
                      setFormData({
                        ...formData,
                        best_criteria: v,
                        bo: newBO,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kriteria" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-red-500" />
                    Worst Criteria (Paling Tidak Penting)
                  </Label>
                  <Select
                    value={formData.worst_criteria}
                    onValueChange={(v) => {
                      const newOW = { ...formData.ow, [v]: 1 };
                      setFormData({
                        ...formData,
                        worst_criteria: v,
                        ow: newOW,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kriteria" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Best-to-Others (BO) Vector — Seberapa lebih penting Best dibanding setiap kriteria lainnya
                </Label>
                {renderBOOWForm("bo", formData.bo, (v) =>
                  setFormData({ ...formData, bo: v }),
                  formData.best_criteria
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Others-to-Worst (OW) Vector — Seberapa lebih penting setiap kriteria dibanding Worst
                </Label>
                {renderBOOWForm("ow", formData.ow, (v) =>
                  setFormData({ ...formData, ow: v }),
                  formData.worst_criteria
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan Preferensi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preferensi List */}
      {preferensiList.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Belum ada preferensi. Buat preferensi pertama Anda.
        </Card>
      ) : (
        <div className="grid gap-4">
          {preferensiList.map((pref) => (
            <Card key={pref.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-medium text-lg">{pref.nama}</div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="text-muted-foreground">Best:</span>
                    <Badge className="bg-yellow-500 text-white">
                      {CRITERIA_LABELS[pref.best_criteria]}
                    </Badge>
                    <span className="text-muted-foreground ml-2">Worst:</span>
                    <Badge variant="destructive">
                      {CRITERIA_LABELS[pref.worst_criteria]}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {new Date(pref.created_at).toLocaleDateString("id-ID")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={pref.is_active ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSetActive(pref.id, !pref.is_active)}
                      className={pref.is_active ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {pref.is_active ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Aktif
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Non-aktif
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(pref)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingId(pref.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* AlertDialog Konfirmasi Hapus */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Preferensi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Preferensi ini akan dihapus permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toast Notification */}
      {toast && toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
