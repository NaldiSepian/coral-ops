"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
  DollarSign,
  AlertTriangle,
  Search,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
} from "lucide-react";
import { downloadSlipGajiPdf } from "@/lib/pdf/payslip";

interface GajiTeknisi {
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
  tunjangan_jabatan: number;
  bonus_bwm: number;
  total_gaji: number;
  status: string;
  keterangan: string | null;
}

export default function GajiManagementPage() {
  const [gajiList, setGajiList] = useState<GajiTeknisi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGaji, setSelectedGaji] = useState<GajiTeknisi | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [expandedPenugasan, setExpandedPenugasan] = useState<number[]>([]);

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

  const filteredGaji = gajiList.filter(
    (g) =>
      g.teknisi.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.penugasan.judul.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by penugasan
  const groupedGaji = filteredGaji.reduce((acc, current) => {
    const pId = current.penugasan.id;
    if (!acc[pId]) {
      acc[pId] = {
        penugasan: current.penugasan,
        items: [],
        totalGaji: 0,
        periode: {
          mulai: current.periode_mulai,
          selesai: current.periode_selesai
        }
      };
    }
    acc[pId].items.push(current);
    acc[pId].totalGaji += current.total_gaji;
    return acc;
  }, {} as Record<number, { penugasan: GajiTeknisi['penugasan'], items: GajiTeknisi[], totalGaji: number, periode: { mulai: string, selesai: string } }>);

  const groupedList = Object.values(groupedGaji).sort((a, b) => b.penugasan.id - a.penugasan.id);

  const togglePenugasan = (id: number) => {
    setExpandedPenugasan(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadSlip = async (gaji: GajiTeknisi) => {
    setDownloadingId(gaji.id);
    try {
      await downloadSlipGajiPdf(gaji);
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "disetujui":
        return <Badge className="bg-green-500">Disetujui</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "dibayar":
        return <Badge className="bg-blue-500">Dibayar</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalGaji = filteredGaji.reduce((sum, g) => sum + g.total_gaji, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 xl:flex-row xl:items-center xl:justify-between xl:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Gaji Teknisi</h1>
          <p className="text-muted-foreground">Review dan kelola gaji teknisi berdasarkan perhitungan BWM</p>
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

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Teknisi</div>
              <div className="text-2xl font-bold">
                {new Set(gajiList.map((g) => g.teknisi.id)).size}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Records</div>
              <div className="text-2xl font-bold">{gajiList.length}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Gaji</div>
              <div className="text-2xl font-bold">
                Rp {totalGaji.toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari teknisi atau penugasan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Gaji List grouped by Penugasan */}
      <div className="grid gap-4">
        {groupedList.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Tidak ada data gaji.
          </Card>
        ) : (
          groupedList.map((group) => {
            const isExpanded = expandedPenugasan.includes(group.penugasan.id);
            return (
              <Card key={group.penugasan.id} className="overflow-hidden border-2">
                {/* Header Penugasan */}
                <div 
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-muted/30 border-b' : 'hover:bg-muted/20'}`}
                  onClick={() => togglePenugasan(group.penugasan.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{group.penugasan.judul}</h3>
                        <Badge variant="outline">{group.penugasan.kategori}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {group.items.length} Teknisi • Periode: {new Date(group.periode.mulai).toLocaleDateString("id-ID")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-muted-foreground uppercase font-semibold">Total Gaji Grup</div>
                      <div className="text-xl font-bold text-primary">
                        Rp {group.totalGaji.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/views/manager/penugasan/${group.penugasan.id}`}
                        className="p-2 hover:bg-primary/10 rounded-full text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        title="Lihat Detail Penugasan"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </Link>
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                {/* List Teknisi (Collapsible) */}
                {isExpanded && (
                  <div className="divide-y bg-card animate-in fade-in slide-in-from-top-2 duration-200">
                    {group.items.map((gaji) => (
                      <div 
                        key={gaji.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedGaji(gaji);
                          setShowDetail(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{gaji.teknisi.nama}</div>
                            <div className="text-xs text-muted-foreground">{gaji.teknisi.lisensi_teknisi}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6">
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              Rp {gaji.total_gaji.toLocaleString("id-ID")}
                            </div>
                            <div>{getStatusBadge(gaji.status)}</div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            Detail
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Gaji</DialogTitle>
            <DialogDescription>
              {selectedGaji?.teknisi.nama} - {selectedGaji?.penugasan.judul}
            </DialogDescription>
          </DialogHeader>

          {selectedGaji && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Tunjangan Jabatan</div>
                  <div className="font-medium">
                    Rp {selectedGaji.tunjangan_jabatan.toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Bonus Kinerja</div>
                  <div className="font-medium text-green-600">
                    Rp {selectedGaji.bonus_bwm.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Gaji</span>
                  <span className="text-2xl font-bold text-green-600">
                    Rp {selectedGaji.total_gaji.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {selectedGaji.keterangan && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Keterangan</div>
                  <div className="text-sm">{selectedGaji.keterangan}</div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDownloadSlip(selectedGaji!)}
              disabled={downloadingId === selectedGaji?.id}
            >
              <Download className="h-4 w-4 mr-2" />
              {downloadingId === selectedGaji?.id ? "Mengunduh..." : "Unduh Slip Gaji"}
            </Button>
            <Button onClick={() => setShowDetail(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
