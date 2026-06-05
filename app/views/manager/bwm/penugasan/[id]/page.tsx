"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  ArrowLeft,
  User,
  Scale,
  DollarSign,
  RefreshCw,
} from "lucide-react";

interface PerhitunganDetail {
  id: string;
  teknisi: {
    id: string;
    nama: string;
    lisensi_teknisi: string;
  };
  // Nilai mentah
  c1_kecepatan: number;
  c2_kualitas: number;
  c3_kepatuhan: number;
  c4_proaktivitas: number;
  c5_kompetensi: number;
  // Normalisasi
  v1: number;
  v2: number;
  v3: number;
  v4: number;
  v5: number;
  // Bobot
  w1: number;
  w2: number;
  w3: number;
  w4: number;
  w5: number;
  // Hasil
  xi_star: number;
  cr: number;
  skor_akhir: number;
  tunjangan_didapat: number;
  status: string;
}

interface PenugasanInfo {
  id: number;
  judul: string;
  kategori: string;
  bwm_status: string;
  plafon_bonus: number;
  tanggal_selesai_actual?: string;
}

export default function PerhitunganBWMDetailPage() {
  const params = useParams();
  const router = useRouter();
  const penugasanId = parseInt(params.id as string);

  const [penugasan, setPenugasan] = useState<PenugasanInfo | null>(null);
  const [perhitunganList, setPerhitunganList] = useState<PerhitunganDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch penugasan info
      const penugasanRes = await fetch(`/api/manager/penugasan/${penugasanId}`);
      if (!penugasanRes.ok) throw new Error("Penugasan tidak ditemukan");
      const penugasanData = await penugasanRes.json();
      setPenugasan(penugasanData.data);

      // Fetch perhitungan BWM
      const perhitunganRes = await fetch(
        `/api/bwm/perhitungan?penugasan_id=${penugasanId}`
      );
      if (!perhitunganRes.ok) throw new Error("Gagal mengambil data perhitungan");
      const perhitunganData = await perhitunganRes.json();
      setPerhitunganList(perhitunganData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [penugasanId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFinalize = async () => {
    setFinalizing(true);
    setError(null);

    try {
      // Finalize setiap perhitungan
      for (const perhitungan of perhitunganList) {
        const response = await fetch(
          `/api/bwm/perhitungan/${perhitungan.id}/finalize`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Gagal finalisasi untuk ${perhitungan.teknisi.nama}`);
        }
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setFinalizing(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    setError(null);

    try {
      const response = await fetch("/api/bwm/perhitungan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ penugasan_id: penugasanId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menghitung ulang");
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setRecalculating(false);
    }
  };

  const getConsistencyBadge = (cr: number) => {
    if (cr <= 0.1) {
      return <Badge className="bg-green-500">Konsisten (CR ≤ 0.10)</Badge>;
    } else if (cr <= 0.25) {
      return <Badge className="bg-yellow-500">Cukup Konsisten</Badge>;
    } else {
      return <Badge variant="destructive">Tidak Konsisten</Badge>;
    }
  };

  const allConsistent = perhitunganList.every((p) => p.cr <= 0.1);
  const allFinalized = perhitunganList.every((p) => p.status === "final");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 xl:flex-row xl:items-center xl:justify-between xl:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">{penugasan?.judul || "Detail Perhitungan"}</h1>
          <p className="text-muted-foreground">
            {penugasan?.kategori || ""} | Plafon: Rp {penugasan?.plafon_bonus?.toLocaleString("id-ID") || "0"}
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          {loading ? "Memuat..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <Button variant="ghost" onClick={() => router.push("/views/manager/bwm/penugasan")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali ke Daftar
      </Button>

      {/* Summary Card */}
      {perhitunganList.length > 0 && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span>{perhitunganList.length} Teknisi</span>
              </div>
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-muted-foreground" />
                <span>
                  Skor Tertinggi: {Math.max(...perhitunganList.map((p) => p.skor_akhir)).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span>
                  Total Tunjangan: Rp{" "}
                  {perhitunganList
                    .reduce((sum, p) => sum + p.tunjangan_didapat, 0)
                    .toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {penugasan?.tanggal_selesai_actual && (
                <span className="text-xs text-muted-foreground">
                  Selesai: {new Date(penugasan.tanggal_selesai_actual).toLocaleDateString("id-ID")}
                </span>
              )}
              <Button
                variant="outline"
                onClick={handleRecalculate}
                disabled={recalculating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? "animate-spin" : ""}`} />
                {recalculating ? "Menghitung..." : "Hitung Ulang"}
              </Button>
              {!allFinalized && (
                <Button
                  onClick={handleFinalize}
                  disabled={finalizing || !allConsistent}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {finalizing ? "Memfinalisasi..." : "Finalisasi Semua"}
                </Button>
              )}
            </div>
          </div>
          {!allConsistent && (
            <Alert className="mt-4 border-yellow-500 bg-yellow-50">
              <AlertDescription className="text-yellow-800">
                Ada perhitungan dengan CR {'>'} 0.10. Periksa kembali preferensi BWM.
              </AlertDescription>
            </Alert>
          )}
        </Card>
      )}

      {/* Teknisi Results */}
      <div className="grid gap-4">
        {perhitunganList.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Belum ada perhitungan. Silakan hitung BWM terlebih dahulu.
          </Card>
        ) : (
          perhitunganList.map((perhitungan) => (
            <Card key={perhitungan.id} className="p-4">
              <Tabs defaultValue="hasil" className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{perhitungan.teknisi.nama}</div>
                      <div className="text-sm text-muted-foreground">
                        {perhitungan.teknisi.lisensi_teknisi}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {getConsistencyBadge(perhitungan.cr)}
                    {perhitungan.status === "final" ? (
                      <Badge className="bg-green-500">Final</Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                    <TabsList>
                      <TabsTrigger value="hasil">Hasil</TabsTrigger>
                      <TabsTrigger value="detail">Detail</TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                <TabsContent value="hasil" className="mt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">Skor Akhir</div>
                      <div className="text-2xl font-bold">{perhitungan.skor_akhir.toFixed(2)}</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">Tunjangan</div>
                      <div className="text-2xl font-bold text-green-600">
                        Rp {perhitungan.tunjangan_didapat.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">CR (Consistency)</div>
                      <div className="text-2xl font-bold">{perhitungan.cr.toFixed(4)}</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">ξ* (Xi Star)</div>
                      <div className="text-2xl font-bold">{perhitungan.xi_star.toFixed(4)}</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="detail" className="mt-0 space-y-4">
                  {/* Bobot */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Bobot Kriteria (Weights)
                    </h4>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {[
                        { label: "C1", value: perhitungan.w1 },
                        { label: "C2", value: perhitungan.w2 },
                        { label: "C3", value: perhitungan.w3 },
                        { label: "C4", value: perhitungan.w4 },
                        { label: "C5", value: perhitungan.w5 },
                      ].map((w) => (
                        <div key={w.label} className="bg-muted/30 p-2 rounded">
                          <div className="text-xs text-muted-foreground">{w.label}</div>
                          <div className="font-medium">{(w.value * 100).toFixed(2)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nilai Mentah */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Nilai Mentah (Raw Values)</h4>
                    <div className="grid grid-cols-5 gap-2 text-center text-sm">
                      {[
                        { label: "C1 Kecepatan", value: perhitungan.c1_kecepatan },
                        { label: "C2 Kualitas", value: perhitungan.c2_kualitas },
                        { label: "C3 Kepatuhan", value: perhitungan.c3_kepatuhan },
                        { label: "C4 Proaktivitas", value: perhitungan.c4_proaktivitas },
                        { label: "C5 Kompetensi", value: perhitungan.c5_kompetensi },
                      ].map((item) => (
                        <div key={item.label} className="bg-muted/30 p-2 rounded">
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                          <div className="font-medium">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nilai Normalisasi */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Nilai Normalisasi (0-100)</h4>
                    <div className="grid grid-cols-5 gap-2 text-center text-sm">
                      {[
                        { label: "V1", value: perhitungan.v1 },
                        { label: "V2", value: perhitungan.v2 },
                        { label: "V3", value: perhitungan.v3 },
                        { label: "V4", value: perhitungan.v4 },
                        { label: "V5", value: perhitungan.v5 },
                      ].map((item) => (
                        <div key={item.label} className="bg-muted/30 p-2 rounded">
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                          <div className="font-medium">{item.value.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
