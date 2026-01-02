import { Badge } from "@/components/ui/badge";
import DownloadLaporanButton from "@/components/laporan-detail/DownloadLaporanButton";
import { PenugasanWithRelations } from "@/lib/penugasan/types";
import { useRouter } from "next/navigation";

interface PenugasanDetailProgressProps {
  penugasan: PenugasanWithRelations;
}

const getValidasiStatusColor = (status?: string) => {
  // Container will remain neutral (no colored background) to match other detail cards.
  // Status is still shown via the Badge component.
  return "";
};

export function PenugasanDetailProgress({
  penugasan,
}: PenugasanDetailProgressProps) {
  const router = useRouter();


  const handleLaporanClick = (laporanId: number) => {
    router.push(`/views/spv/laporan/${laporanId}?from=assignment`);
  };

  return (
    <div className="rounded-lg border p-4 sm:p-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
        <h2 className="text-base sm:text-lg font-medium">Laporan Progress</h2>
      </div>
      {/* Progress timeline */}
      {penugasan.laporan_progres && penugasan.laporan_progres.length > 0 ? (
        <div className="space-y-4">
          {penugasan.laporan_progres
            .sort((a, b) => new Date(b.tanggal_laporan).getTime() - new Date(a.tanggal_laporan).getTime())
            .map((laporan) => (
            <div 
              key={laporan.id} 
              className={`p-3 sm:p-4 rounded-lg border ${getValidasiStatusColor(laporan.status_validasi)} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => handleLaporanClick(laporan.id)}
            >
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-2">
                <span className={`font-medium ${laporan.status_validasi === 'Disetujui' ? 'text-secondary-foreground dark:text-secondary' : 'text-foreground'}`}>
                  {new Date(laporan.tanggal_laporan).toLocaleDateString('id-ID')}
                </span>
                <div className="flex gap-2 flex-wrap">
                  {laporan.status_progres && (
                    <Badge variant="secondary" className="text-xs">
                      {laporan.status_progres}
                      {laporan.persentase_progres != null && (
                        <span className="ml-1 font-semibold">• {laporan.persentase_progres}%</span>
                      )}
                    </Badge>
                  )}
                  {laporan.status_validasi && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                    >
                      {laporan.status_validasi === "Disetujui" && "✓ Disetujui"}
                      {laporan.status_validasi === "Ditolak" && "✗ Ditolak"}
                      {laporan.status_validasi === "Menunggu" && "⏳ Menunggu Validasi"}
                    </Badge>
                  )}
                </div>
              </div>
              {laporan.catatan && (
                <p className="text-sm text-foreground mb-2">{laporan.catatan}</p>
              )}
              
              {/* Catatan validasi jika ditolak */}
              {laporan.status_validasi === "Ditolak" && laporan.catatan_validasi && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs p-2 rounded mb-2">
                  <p className="font-semibold mb-1">Alasan Penolakan:</p>
                  {laporan.catatan_validasi}
                </div>
              )}

              {/* Foto thumbnails jika ada */}
              {laporan.foto_url && (
                <div className="mt-3">
                  <img
                    src={laporan.foto_url}
                    alt="Progress photo"
                    className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                    onClick={() => window.open(laporan.foto_url, "_blank")}
                  />
                </div>
              )}

              {/* Validator info */}
              {laporan.status_validasi !== "Menunggu" && laporan.divalidasi_oleh && (
                <div className="text-xs text-foreground mt-2 pt-2 border-t">
                  Divalidasi {new Date(laporan.divalidasi_pada || "").toLocaleString("id-ID")}
                </div>
              )}

              {/* Download button: hide if rejected, green style if approved */}
              {laporan.status_validasi !== 'Ditolak' && (
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <DownloadLaporanButton
                    laporan={laporan}
                    penugasan={penugasan}
                    className={laporan.status_validasi === 'Disetujui' ? 'text-secondary border-secondary/30 bg-secondary/10 hover:bg-secondary/20 dark:bg-secondary/20' : ''}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-foreground">
          <p className="text-sm sm:text-base">Belum ada laporan progress</p>
        </div>
      )}
    </div>
  );
}