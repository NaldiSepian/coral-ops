"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle, XCircle, Calendar, Check, X, RefreshCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

interface KendalaItem {
  id: number;
  penugasan_id: number;
  pemohon_id: string;
  tanggal_permintaan: string;
  alasan: string;
  foto_url?: string;
  durasi_menit: number;
  durasi_diminta: string;
  tipe_kendala: string;
  status: string;
  deadline_before: string;
  penugasan: {
    id: number;
    judul: string;
    kategori: string;
    end_date: string;
  };
  pemohon: {
    id: string;
    nama: string;
    peran: string;
  };
}

export default function KendalaPage() {
  const [kendala, setKendala] = useState<KendalaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Approval dialog states
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [approving, setApproving] = useState(false);
  const [selectedKendalaId, setSelectedKendalaId] = useState<number | null>(null);

  // Photo preview state
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const fetchKendala = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/supervisor/kendala", {
        cache: "no-store"
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal memuat data kendala");
      }

      setKendala(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setKendala([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKendala();
  }, [fetchKendala, refreshTrigger]);

  const filteredKendala = useMemo(() => {
    if (!searchQuery) return kendala;
    return kendala.filter(
      (k) =>
        k.penugasan.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.pemohon.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.tipe_kendala.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [kendala, searchQuery]);

  const handleApprove = async (kendalaId: number) => {
    setSelectedKendalaId(kendalaId);
    setApprovalAction('approve');
    setApprovalNote('');
    setShowApprovalDialog(true);
  };

  const handleReject = async (kendalaId: number) => {
    setSelectedKendalaId(kendalaId);
    setApprovalAction('reject');
    setApprovalNote('');
    setShowApprovalDialog(true);
  };

  const handleApproval = async (action: 'approve' | 'reject') => {
    if (!selectedKendalaId) return;

    setApproving(true);
    try {
      const response = await fetch(`/api/perpanjangan/${selectedKendalaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'Disetujui' : 'Ditolak',
          catatan_validasi: approvalNote.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memproses permintaan');
      }

      // Refresh data
      setRefreshTrigger((prev) => prev + 1);

      // Close dialog and reset state
      setShowApprovalDialog(false);
      setApprovalAction(null);
      setApprovalNote('');
      setSelectedKendalaId(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses');
    } finally {
      setApproving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Menunggu":
        return (
          <Badge variant="outline" className="bg-accent text-accent-foreground border-border">
            <AlertCircle className="w-3 h-3 mr-1" />
            Menunggu Review
          </Badge>
        );
      case "Disetujui":
        return (
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Disetujui
          </Badge>
        );
      case "Ditolak":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Ditolak
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTipeKendalaLabel = (tipe: string) => {
    switch (tipe) {
      case 'Cuaca': return 'Cuaca Buruk';
      case 'Akses': return 'Akses Lokasi';
      case 'Teknis': return 'Kendala Teknis';
      case 'Lain': return 'Lainnya';
      default: return tipe;
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Kelola Kendala</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review dan kelola permintaan perpanjangan waktu dari teknisi
        </p>
      </header>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Cari penugasan, teknisi, atau tipe kendala..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Kendala List */}
      {!loading && filteredKendala.length > 0 && (
        <div className="space-y-4">
          {filteredKendala.map((kendalaItem) => (
            <Card key={kendalaItem.id} className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Left: Info */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <h3 className="font-semibold text-sm sm:text-base truncate">
                      {kendalaItem.penugasan.judul}
                    </h3>
                    <Badge variant="secondary" className="w-fit text-xs">
                      {kendalaItem.penugasan.kategori}
                    </Badge>
                    <Badge variant="outline" className="w-fit text-xs">
                      {getTipeKendalaLabel(kendalaItem.tipe_kendala)}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{kendalaItem.pemohon.nama}</span>
                      <span className="text-xs">• Teknisi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(kendalaItem.tanggal_permintaan).toLocaleDateString("id-ID")}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-foreground">
                      Alasan:<strong> {kendalaItem.alasan}</strong>
                    </p>
                    <p className="text-sm text-foreground">
                      Durasi Diminta:<strong> {Math.round(kendalaItem.durasi_menit / (24 * 60))} hari</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Deadline Saat Ini:<strong> {new Date(kendalaItem.deadline_before).toLocaleDateString("id-ID")}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Deadline Diajukan:<strong> {(() => {
                        const currentDeadline = new Date(kendalaItem.deadline_before);
                        const hari = Math.round(kendalaItem.durasi_menit / (24 * 60));
                        currentDeadline.setDate(currentDeadline.getDate() + hari);
                        return currentDeadline.toLocaleDateString("id-ID");
                      })()}</strong>
                    </p>
                  </div>

                  {/* Foto bukti */}
                  {kendalaItem.foto_url && (
                    <div className="mt-3">
                      <img
                        src={kendalaItem.foto_url}
                        alt="Bukti Kendala"
                        className="h-20 w-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setPreviewPhoto(kendalaItem.foto_url!)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          console.error('Failed to load image:', kendalaItem.foto_url);
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Right: Status & Action */}
                <div className="flex flex-col gap-2 sm:items-end w-full sm:w-auto">
                  {getStatusBadge(kendalaItem.status)}

                  <div className="flex gap-2 w-full sm:w-auto">
                    {kendalaItem.status === "Menunggu" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(kendalaItem.id)}
                          className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(kendalaItem.id)}
                          className="flex-1 sm:flex-none"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredKendala.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground space-y-2">
            <CheckCircle className="w-12 h-12 mx-auto opacity-50 mb-4" />
            <p className="font-medium">Tidak ada permintaan kendala</p>
            <p className="text-sm">Semua permintaan kendala sudah diproses</p>
          </div>
        </Card>
      )}

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Setujui Perpanjangan' : 'Tolak Perpanjangan'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve'
                ? 'Apakah Anda yakin ingin menyetujui permintaan perpanjangan ini?'
                : 'Berikan alasan penolakan permintaan perpanjangan ini.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approval-note" className="mb-2">Catatan Supervisor (Opsional)</Label>
              <Textarea
                id="approval-note"
                placeholder={approvalAction === 'approve' ? 'Catatan persetujuan...' : 'Alasan penolakan...'}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={approving}
            >
              Batal
            </Button>
            <Button
              onClick={() => handleApproval(approvalAction!)}
              disabled={approving}
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
            >
              {approving ? (
                <>
                  <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : approvalAction === 'approve' ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Setujui
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Tolak
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Dialog */}
      <PhotoPreviewDialog photoUrl={previewPhoto} onClose={() => setPreviewPhoto(null)} />
    </section>
  );
}

// Photo Preview Dialog Component
function PhotoPreviewDialog({ photoUrl, onClose }: { photoUrl: string | null; onClose: () => void }) {
  if (!photoUrl) return null;

  return (
    <Dialog open={!!photoUrl} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview Foto Bukti Kendala</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
          <Image
            src={photoUrl}
            alt="Preview foto bukti kendala"
            fill
            className="object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}