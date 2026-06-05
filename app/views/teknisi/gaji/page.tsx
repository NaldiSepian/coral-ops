"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Award,
  FileText,
  AlertTriangle,
  CheckCircle,
  Download,
} from "lucide-react";
import { downloadSlipGajiPdf } from "@/lib/pdf/payslip";

interface GajiSaya {
  id: string;
  teknisi: {
    id: string;
    nama: string;
    lisensi_teknisi: string;
  };
  penugasan: {
    id: number;
    judul: string;
    kategori: string;
  };
  periode_mulai: string;
  periode_selesai: string;
  // Perhitungan BWM
  c1_kecepatan: number;
  c2_kualitas: number;
  c3_kepatuhan: number;
  c4_proaktivitas: number;
  c5_kompetensi: number;
  skor_akhir: number;
  tunjangan_jabatan: number;
  bonus_bwm: number;
  total_gaji: number;
  status: string;
}

export default function GajiSayaPage() {
  const [gajiList, setGajiList] = useState<GajiSaya[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/bwm/gaji");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil data");
      }

      setGajiList(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "disetujui":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Disetujui
          </Badge>
        );
      case "draft":
        return <Badge variant="outline">Dalam Proses</Badge>;
      case "dibayar":
        return <Badge className="bg-blue-500">Dibayar</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadSlip = async (gaji: GajiSaya) => {
    setDownloadingId(gaji.id);
    try {
      await downloadSlipGajiPdf(gaji);
    } finally {
      setDownloadingId(null);
    }
  };

  const totalBonusBWM = gajiList.reduce((sum, g) => sum + g.bonus_bwm, 0);
  const totalGaji = gajiList.reduce((sum, g) => sum + g.total_gaji, 0);
  const avgSkor =
    gajiList.length > 0
      ? gajiList.reduce((sum, g) => sum + g.skor_akhir, 0) / gajiList.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 xl:flex-row xl:items-center xl:justify-between xl:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Gaji Saya</h1>
          <p className="text-muted-foreground">
            Lihat rincian gaji berdasarkan perhitungan BWM
          </p>
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
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Proyek</div>
              <div className="text-2xl font-bold">{gajiList.length}</div>
            </div>
          </div>
        </Card>


        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Total Bonus Kinerja
              </div>
              <div className="text-2xl font-bold">
                Rp {totalBonusBWM.toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Total Gaji Diterima
              </div>
              <div className="text-2xl font-bold">
                Rp {totalGaji.toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Gaji List */}
      <div className="space-y-4">
        {gajiList.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Belum ada data gaji. Data akan muncul setelah penugasan selesai dan
            dihitung.
          </Card>
        ) : (
          gajiList.map((gaji) => (
            <Card key={gaji.id} className="p-4">
              <Tabs defaultValue="ringkasan">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <div className="font-medium text-lg">
                      {gaji.penugasan.judul}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{gaji.penugasan.kategori}</Badge>
                      <span>
                        {new Date(gaji.periode_mulai).toLocaleDateString(
                          "id-ID",
                        )}{" "}
                        -{" "}
                        {new Date(gaji.periode_selesai).toLocaleDateString(
                          "id-ID",
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(gaji.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadSlip(gaji)}
                      disabled={downloadingId === gaji.id}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      {downloadingId === gaji.id ? "Mengunduh..." : "Unduh Slip"}
                    </Button>
                    <TabsList>
                      <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
                      <TabsTrigger value="detail">Detail</TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                <TabsContent value="ringkasan" className="mt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-muted/50 p-3 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground">
                        Skor Akhir
                      </div>
                      <div className="text-xl font-bold">
                        {gaji.skor_akhir.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground">
                        Tunjangan Kompentensi
                      </div>
                      <div className="text-xl font-bold">
                        Rp {gaji.tunjangan_jabatan.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground">
                        Bonus Kinerja
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        Rp {gaji.bonus_bwm.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="text-xl font-bold text-primary">
                        Rp {gaji.total_gaji.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="detail" className="mt-0 space-y-4">
                  {/* Nilai Kriteria */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Nilai Kinerja</h4>
                    <div className="grid grid-cols-5 gap-2 text-center text-sm">
                      {[
                        { label: "C1 Kecepatan", value: gaji.c1_kecepatan },
                        { label: "C2 Kualitas", value: gaji.c2_kualitas },
                        { label: "C3 Kepatuhan", value: gaji.c3_kepatuhan },
                        {
                          label: "C4 Proaktivitas",
                          value: gaji.c4_proaktivitas,
                        },
                        { label: "C5 Kompetensi", value: gaji.c5_kompetensi },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="bg-muted/30 p-2 rounded"
                        >
                          <div className="text-xs text-muted-foreground">
                            {item.label}
                          </div>
                          <div className="font-medium">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rincian Gaji */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Rincian Gaji</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Tunjangan Jabatan</span>
                        <span>
                          Rp {gaji.tunjangan_jabatan.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Bonus Kinerja</span>
                        <span>
                          + Rp {gaji.bonus_bwm.toLocaleString("id-ID")}
                        </span>
                      </div>

                      <div className="border-t pt-2 flex justify-between font-medium">
                        <span>Total Gaji</span>
                        <span>
                          Rp {gaji.total_gaji.toLocaleString("id-ID")}
                        </span>
                      </div>
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
