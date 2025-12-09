"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, Users } from "lucide-react";

interface AvailableTeknisi {
  id: string;
  nama: string;
  peran?: string;
  lisensi_teknisi?: string;
  current_assignments?: number;
}

interface AssignTeknisiDialogProps {
  penugasanId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  excludeTeknisiIds?: string[];
}

export function AssignTeknisiDialog({ penugasanId, open, onOpenChange, onSuccess, excludeTeknisiIds = [] }: AssignTeknisiDialogProps) {
  const [availableTeknisi, setAvailableTeknisi] = useState<AvailableTeknisi[]>([]);
  const [selectedTeknisi, setSelectedTeknisi] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedTeknisi([]);
      setSearchQuery("");
      setError(null);
      setSuccessMessage(null);
      fetchAvailableTeknisi();
    }
  }, [open]);

  const fetchAvailableTeknisi = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/profil?peran=Teknisi&available=true");
      if (!response.ok) {
        throw new Error("Gagal memuat daftar teknisi");
      }
      const data = await response.json();
      setAvailableTeknisi(data.data || []);
    } catch (err) {
      console.error("Failed to fetch teknisi:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat teknisi");
    } finally {
      setLoading(false);
    }
  };

  const excludedSet = useMemo(() => new Set(excludeTeknisiIds), [excludeTeknisiIds]);

  const filteredTeknisi = useMemo(() => {
    return availableTeknisi
      .filter((teknisi) => !excludedSet.has(teknisi.id))
      .filter((teknisi) => (teknisi.current_assignments || 0) === 0) // Exclude teknisi yang sudah assigned
      .filter((teknisi) =>
        teknisi.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teknisi.peran?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teknisi.lisensi_teknisi?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [availableTeknisi, excludedSet, searchQuery]);

  const handleToggleTeknisi = (id: string) => {
    setSelectedTeknisi((prev) =>
      prev.includes(id) ? prev.filter((teknisiId) => teknisiId !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (selectedTeknisi.length === 0) {
      setError("Pilih minimal satu teknisi untuk ditugaskan");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/penugasan/${penugasanId}/assign-teknisi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teknisi_ids: selectedTeknisi }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Gagal assign teknisi");
      }

      setSuccessMessage("Teknisi berhasil ditugaskan");
      setSelectedTeknisi([]);
      if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to assign teknisi:", err);
      setError(err instanceof Error ? err.message : "Gagal assign teknisi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assign Teknisi
          </DialogTitle>
          <DialogDescription>
            Pilih teknisi yang tersedia untuk ditugaskan ke penugasan ini. Daftar ini mengikuti logika Step 2 pada wizard pembuatan.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari teknisi, peran, atau lisensi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-80 rounded-md border overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memuat teknisi...
              </div>
            ) : filteredTeknisi.length > 0 ? (
              <div className="divide-y">
                {filteredTeknisi.map((teknisi) => {
                  const checked = selectedTeknisi.includes(teknisi.id);
                  return (
                    <label
                      key={teknisi.id}
                      className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => handleToggleTeknisi(teknisi.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{teknisi.nama}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{teknisi.peran || "Teknisi"}</span>
                          {teknisi.lisensi_teknisi && (
                            <>
                              <span>•</span>
                              <span>{teknisi.lisensi_teknisi}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {checked && <Badge variant="secondary">Dipilih</Badge>}
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {searchQuery ? "Tidak ada teknisi yang cocok" : "Semua teknisi sedang ditugaskan atau tidak tersedia"}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedTeknisi.length} teknisi dipilih
          </div>
          <Button onClick={handleAssign} disabled={saving || selectedTeknisi.length === 0}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              "Assign Teknisi"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
