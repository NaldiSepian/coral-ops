import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Clock, Ruler, Check, X, Download, RefreshCcw } from "lucide-react";
import { getStatusBadge } from "../validasi-laporan/ui-components";
import { LaporanDetail } from "./types";
import { useState } from 'react';
import Image from 'next/image';
import DownloadLaporanButton from './DownloadLaporanButton';

interface ReportStatusCardProps {
  laporan: LaporanDetail;
  onApprove?: () => void;
  onReject?: () => void;
}

export default function ReportStatusCard({ laporan, onApprove, onReject }: ReportStatusCardProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { downloadLaporanPdf } = await import('@/lib/pdf/report');
      let penugasan = (laporan as any).penugasan || null;

      // If penugasan details (teknisi/alat) are missing, fetch full penugasan from API with timeout
      if (!penugasan || !penugasan.teknisi || !penugasan.alat) {
        try {
          console.debug('Fetching penugasan details for', laporan.penugasan_id);
          const controller = new AbortController();
          const penugasanTimeout = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(`/api/penugasan/${laporan.penugasan_id}`, { signal: controller.signal });
          clearTimeout(penugasanTimeout);
          if (res.ok) {
            const data = await res.json();
            penugasan = data.data || penugasan || { judul: 'Penugasan' };
            console.debug('Loaded penugasan details', penugasan?.id);
          } else {
            console.warn('Gagal memuat detail penugasan', res.status);
          }
        } catch (fetchErr: any) {
          if (fetchErr?.name === 'AbortError') console.warn('Penugasan fetch timed out');
          else console.warn('Error fetching penugasan details', fetchErr);
        }
      }

      // Wrap client-side export with a timeout so it doesn't hang forever
      console.debug('Starting client-side export');
      const clientExport = downloadLaporanPdf(penugasan || { judul: 'Penugasan' }, laporan as any);
      const timeoutMs = 20000; // 20s
      await Promise.race([
        clientExport,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Client export timed out')), timeoutMs))
      ]);
      console.debug('Client-side export finished');

    } catch (err: any) {
      console.error('Gagal mengunduh PDF (client):', err);
      // Fallback: attempt server-side download route
      try {
        window.open(`/api/laporan/${laporan.id}/download`, '_blank');
        alert('Ekspor lokal gagal; mencoba unduh via server. Jika tidak ada, cek console untuk detail.');
      } catch (e) {
        console.error('Server fallback failed', e);
        alert(`Gagal mengunduh PDF laporan: ${err?.message || String(err)}.`);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Status Laporan
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(laporan.status_validasi)}
            {laporan.status_validasi === "Menunggu" && onApprove && onReject && (
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="default"
                  onClick={onApprove}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Setujui
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onReject}
                >
                  <X className="w-4 h-4 mr-1" />
                  Tolak
                </Button>
              </div>
            )}
            {laporan.status_validasi === "Disetujui" && (
              <div className="ml-4">
                <DownloadLaporanButton laporan={laporan} />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tanggal Laporan
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(laporan.created_at).toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Persentase Progres</p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {laporan.persentase_progres !== null ? `${laporan.persentase_progres}%` : 'Tidak ditentukan'}
              </p>
              {laporan.persentase_progres !== null && (
                <Progress value={laporan.persentase_progres} className="h-2" />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1">
            <p className="text-sm font-medium">Status Progres</p>
            <Badge variant="outline">{laporan.status_progres}</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Pelapor</p>
            <p className="text-sm text-muted-foreground">{laporan.pelapor.nama}</p>
          </div>
        </div>

        {/* Main photo (foto_url) shown as primary evidence */}
        {laporan.foto_url && (
          <div className="space-y-1 mt-4">
            <p className="text-sm font-medium">Foto Utama</p>
            <div
              className="mt-2 relative w-40 h-28 rounded overflow-hidden border cursor-pointer"
              onClick={() => window.open(laporan.foto_url, '_blank')}
              role="button"
              tabIndex={0}
            >
              <Image
                src={laporan.foto_url}
                alt="Foto utama laporan"
                fill
                className="object-cover"
                sizes="160px"
              />
            </div>
          </div>
        )}

        {laporan.catatan && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Catatan Teknisi</p>
            <p className="text-sm text-muted-foreground">{laporan.catatan}</p>
          </div>
        )}

        {/* Validation Info */}
        {laporan.status_validasi !== "Menunggu" && (
          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium">Informasi Validasi</p>
            <div className="bg-muted/50 p-3 rounded space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span>Divalidasi oleh:</span>
                <span className="font-medium">{laporan.validator?.nama}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(laporan.divalidasi_pada || "").toLocaleString("id-ID")}
              </div>
              {laporan.catatan_validasi && (
                <div className="text-sm italic text-foreground bg-background p-2 rounded">
                  {laporan.catatan_validasi}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}