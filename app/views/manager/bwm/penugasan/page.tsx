"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  ChevronRight,
  Edit3,
  Save,
  X,
} from "lucide-react";

interface Penugasan {
  id: number;
  judul: string;
  kategori: string;
  status: string;
  bwm_status: string | null;
  end_date: string;
  plafon_bonus: number;
  _count?: {
    penugasan_teknisi: number;
  };
}

interface Preferensi {
  id: string;
  nama: string;
  is_active: boolean;
}

export default function PerhitunganBWMManagementPage() {
  const router = useRouter();
  const [penugasanList, setPenugasanList] = useState<Penugasan[]>([]);
  const [preferensiList, setPreferensiList] = useState<Preferensi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState<number | null>(null);
  const [editingPlafon, setEditingPlafon] = useState<number | null>(null);
  const [plafonValues, setPlafonValues] = useState<Record<number, string>>({});
  const [updatingPlafon, setUpdatingPlafon] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch penugasan yang sudah selesai
      const [penugasanRes, preferensiRes] = await Promise.all([
        fetch("/api/manager/penugasan?status=Selesai"),
        fetch("/api/bwm/preferensi"),
      ]);

      if (!penugasanRes.ok || !preferensiRes.ok) {
        throw new Error("Gagal mengambil data");
      }

      const penugasanData = await penugasanRes.json();
      const preferensiData = await preferensiRes.json();

      setPenugasanList(penugasanData.data || []);
      setPreferensiList(preferensiData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCalculate = async (penugasanId: number, preferensiId?: string) => {
    setCalculating(penugasanId);
    setError(null);

    try {
      const response = await fetch("/api/bwm/perhitungan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          penugasan_id: penugasanId,
          preferensi_id: preferensiId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menghitung BWM");
      }

      // Redirect ke halaman detail perhitungan
      router.push(`/views/manager/bwm/penugasan/${penugasanId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setCalculating(null);
    }
  };

  const handleUpdatePlafon = async (penugasanId: number) => {
    const newPlafon = parseInt(plafonValues[penugasanId] || "0");
    if (isNaN(newPlafon) || newPlafon < 0) {
      setError("Plafon harus angka positif");
      return;
    }

    setUpdatingPlafon(penugasanId);
    setError(null);

    try {
      const response = await fetch(`/api/manager/penugasan/${penugasanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plafon_bonus: newPlafon }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal mengupdate plafon");
      }

      // Update local state
      setPenugasanList((prev) =>
        prev.map((p) =>
          p.id === penugasanId ? { ...p, plafon_bonus: newPlafon } : p
        )
      );
      setEditingPlafon(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setUpdatingPlafon(null);
    }
  };

  const getBWMStatusBadge = (status: string | null) => {
    switch (status) {
      case "final":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Final
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Belum Dihitung
          </Badge>
        );
    }
  };

  const activePreferensi = preferensiList.find((p) => p.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 xl:flex-row xl:items-center xl:justify-between xl:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Perhitungan BWM</h1>
          <p className="text-muted-foreground">Hitung dan review skor kinerja teknisi per penugasan</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
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

      {/* Info Card */}
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Preferensi Aktif</h3>
            <p className="text-sm text-muted-foreground">
              {activePreferensi
                ? activePreferensi.nama
                : "Belum ada preferensi aktif"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/views/manager/bwm/preferensi")}
          >
            Kelola Preferensi
          </Button>
        </div>
      </Card>

      {/* Penugasan List */}
      <div className="grid gap-4">
        {penugasanList.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Tidak ada penugasan yang selesai.
          </Card>
        ) : (
          penugasanList.map((penugasan) => (
            <Card key={penugasan.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-medium text-lg">{penugasan.judul}</div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="outline">{penugasan.kategori}</Badge>
                    <span className="text-muted-foreground">
                      {new Date(penugasan.end_date).toLocaleDateString("id-ID")}
                    </span>
                    {editingPlafon === penugasan.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Plafon: Rp</span>
                        <Input
                          type="number"
                          className="w-32 h-8"
                          value={plafonValues[penugasan.id] || penugasan.plafon_bonus || 0}
                          onChange={(e) =>
                            setPlafonValues({
                              ...plafonValues,
                              [penugasan.id]: e.target.value,
                            })
                          }
                          disabled={updatingPlafon === penugasan.id}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleUpdatePlafon(penugasan.id)}
                          disabled={updatingPlafon === penugasan.id}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => setEditingPlafon(null)}
                          disabled={updatingPlafon === penugasan.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Plafon: Rp{" "}
                          {penugasan.plafon_bonus?.toLocaleString("id-ID") || "0"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => {
                            setEditingPlafon(penugasan.id);
                            setPlafonValues({
                              ...plafonValues,
                              [penugasan.id]: String(penugasan.plafon_bonus || 0),
                            });
                          }}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-sm text-muted-foreground">BWM:</span>
                    {getBWMStatusBadge(penugasan.bwm_status)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {penugasan.bwm_status === "draft" ? (
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/views/manager/bwm/penugasan/${penugasan.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : penugasan.bwm_status === "final" ? (
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/views/manager/bwm/penugasan/${penugasan.id}`)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Lihat Hasil
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <>
                      {preferensiList.length > 1 && (
                        <Select
                          onValueChange={(prefId) => handleCalculate(penugasan.id, prefId)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Pilih Preferensi" />
                          </SelectTrigger>
                          <SelectContent>
                            {preferensiList.map((pref) => (
                              <SelectItem key={pref.id} value={pref.id}>
                                {pref.nama}
                                {pref.is_active && " (Aktif)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        onClick={() => handleCalculate(penugasan.id)}
                        disabled={calculating === penugasan.id || !activePreferensi}
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        {calculating === penugasan.id ? "Menghitung..." : "Hitung BWM"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
