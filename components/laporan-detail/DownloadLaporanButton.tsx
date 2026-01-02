"use client";

import { Button } from "@/components/ui/button";
import { Download, RefreshCcw } from "lucide-react";
import { useCallback, useState } from "react";

interface Props {
  laporan: any; // accept partial laporan shapes from lists
  penugasan?: any; // optional preloaded penugasan
  className?: string;
}

export default function DownloadLaporanButton({ laporan, penugasan: initialPenugasan, className }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[DL] start export', { laporanId: laporan.id });

      // Ensure penugasan details
      let penugasan = initialPenugasan || null;
      if (!penugasan || !penugasan.teknisi || !penugasan.alat) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 12000);
          const res = await fetch(`/api/penugasan/${laporan.penugasan_id}`, { signal: controller.signal });
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            penugasan = data.data || penugasan || { judul: 'Penugasan' };
            console.log('[DL] loaded penugasan', penugasan?.id);
          } else {
            console.warn('[DL] penugasan fetch failed status', res.status);
          }
        } catch (e: any) {
          if (e?.name === 'AbortError') console.warn('[DL] penugasan fetch timed out');
          else console.warn('[DL] error fetching penugasan', e);
        }
      }

      // Try client-side export with timeout
      const { downloadLaporanPdf } = await import('@/lib/pdf/report');
      const clientExportPromise = downloadLaporanPdf(penugasan || { judul: 'Penugasan' }, laporan as any);
      const timeoutMs = 25000;
      const result = await Promise.race([
        clientExportPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Client export timed out')), timeoutMs)),
      ]).catch((err) => { throw err; });

      if (result === true) {
        console.log('[DL] client export complete (success)');
        alert('PDF berhasil diunduh.');
      } else if (result === false) {
        console.warn('[DL] client export reported no content');
        alert('PDF dibuat tetapi tidak berisi bukti foto/deskripsi. Mohon cek sumber data.');
      } else {
        console.warn('[DL] client export returned falsy result', result);
        // fall through to fallback
        throw new Error('Client export reported failure');
      }
    } catch (err: any) {
      console.error('[DL] client export error', err);
      // Fallback to server-side route
      try {
        const url = `/api/laporan/${laporan.id}/download`;
        window.open(url, '_blank');
        alert('Client export failed; attempted server export. Jika tidak berhasil, lihat console untuk detail.');
      } catch (e) {
        console.error('[DL] server fallback failed', e);
        alert('Gagal mengunduh laporan. Periksa console untuk detail.');
      }
    } finally {
      setLoading(false);
    }
  }, [laporan, initialPenugasan]);

  return (
    <Button size="sm" variant="outline" onClick={handleDownload} disabled={loading} className={className}>
      {loading ? (
        <>
          <RefreshCcw className="w-4 h-4 mr-1 animate-spin" /> Mengunduh...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-1" /> Download
        </>
      )}
    </Button>
  );
}
