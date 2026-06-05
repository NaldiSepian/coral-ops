"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Wrench } from "lucide-react";

interface AvailableAlat {
  id: number;
  nama: string;
  kategori?: string;
  stok_total?: number;
  stok_tersedia: number;
}

interface SelectedAlatItem {
  alat_id: number;
  jumlah: number;
}

interface AssignAlatDialogProps {
  penugasanId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AssignAlatDialog({ penugasanId, open, onOpenChange, onSuccess }: AssignAlatDialogProps) {
  const [availableAlat, setAvailableAlat] = useState<AvailableAlat[]>([]);
  const [selectedAlat, setSelectedAlat] = useState<SelectedAlatItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedAlat([]);
      setSearchQuery("");
      setError(null);
      fetchAvailableAlat();
    }
  }, [open]);

  const fetchAvailableAlat = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/alat?available=true&limit=100");
      if (!response.ok) {
        throw new Error("Gagal memuat daftar alat");
      }
      const data = await response.json();
      setAvailableAlat(data.data || []);
    } catch (err) {
      console.error("Failed to fetch alat:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat alat");
    } finally {
      setLoading(false);
    }
  };

  const filteredAlat = useMemo(() => {
    return availableAlat.filter((alat) =>
      alat.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alat.kategori?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableAlat, searchQuery]);

  const findSelectedItem = (alatId: number) => selectedAlat.find((item) => item.alat_id === alatId);

  const handleQuantityChange = (alatId: number, jumlah: number) => {
    setSelectedAlat((prev) => {
      const existing = prev.find((item) => item.alat_id === alatId);
      if (jumlah <= 0) {
        return prev.filter((item) => item.alat_id !== alatId);
      }
      if (existing) {
        return prev.map((item) => (item.alat_id === alatId ? { ...item, jumlah } : item));
      }
      return [...prev, { alat_id: alatId, jumlah }];
    });
  };

  const handleAssign = async () => {
    if (selectedAlat.length === 0) {
      setError("Pilih minimal satu alat dan kuantitasnya");
      return;
    }

    // Validate stok
    for (const item of selectedAlat) {
      const alat = availableAlat.find((a) => a.id === item.alat_id);
      if (!alat) continue;
      if (item.jumlah > alat.stok_tersedia) {
        setError(`Jumlah untuk ${alat.nama} melebihi stok tersedia (${alat.stok_tersedia})`);
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);

      const payload = { alat_assignments: selectedAlat };
      const response = await fetch(`/api/penugasan/${penugasanId}/assign-alat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Gagal assign alat");
      }

      if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
      setSelectedAlat([]);
    } catch (err) {
      console.error("Failed to assign alat:", err);
      setError(err instanceof Error ? err.message : "Gagal assign alat");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Assign Alat
          </DialogTitle>
          <DialogDescription>
            Pilih alat yang diperlukan untuk penugasan ini. Referensi gaya dari Step 3 wizard pembuatan penugasan.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari alat atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-80 overflow-y-auto rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memuat daftar alat...
              </div>
            ) : filteredAlat.length > 0 ? (
              <div className="divide-y">
                {filteredAlat.map((alat) => {
                  const selectedItem = findSelectedItem(alat.id);
                  const quantity = selectedItem?.jumlah || 0;
                  return (
                    <div key={alat.id} className="p-4 space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">{alat.nama}</p>
                          <p className="text-sm text-muted-foreground">
                            {alat.kategori ? `Kategori: ${alat.kategori}` : "Kategori tidak ditentukan"}
                          </p>
                        </div>
                        <Badge variant="outline">
                          Stok tersedia: {alat.stok_tersedia}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={alat.stok_tersedia}
                          value={quantity}
                          onChange={(e) => handleQuantityChange(alat.id, parseInt(e.target.value, 10) || 0)}
                          className="w-28"
                        />
                        <span className="text-sm text-muted-foreground">Jumlah yang dipinjam</span>
                      </div>
                      {quantity > alat.stok_tersedia && (
                        <p className="text-xs text-destructive">
                          Jumlah melebihi stok tersedia ({alat.stok_tersedia})
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {searchQuery ? "Tidak ada alat yang cocok" : "Stok alat belum tersedia"}
              </div>
            )}
          </div>

          {selectedAlat.length > 0 && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium mb-2">Ringkasan Pilihan</p>
              <div className="space-y-1 text-sm">
                {selectedAlat.map((item) => {
                  const alat = availableAlat.find((a) => a.id === item.alat_id);
                  return alat ? (
                    <div key={item.alat_id} className="flex items-center justify-between">
                      <span>{alat.nama}</span>
                      <span className="font-medium">x{item.jumlah}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedAlat.length} jenis alat dipilih
          </div>
          <Button onClick={handleAssign} disabled={saving || selectedAlat.length === 0}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              "Assign Alat"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
