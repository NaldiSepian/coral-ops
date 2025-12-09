import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PenugasanWithRelations } from "@/lib/penugasan/types";

interface PenugasanDetailProgressProps {
  penugasan: PenugasanWithRelations;
  onAddProgress: () => void;
}

const getValidasiStatusColor = (status?: string) => {
  switch (status) {
    case "Disetujui":
      return "bg-green-50 border-green-200";
    case "Ditolak":
      return "bg-red-50 border-red-200";
    default:
      return "bg-yellow-50 border-yellow-200";
  }
};

export function PenugasanDetailProgress({
  penugasan,
  onAddProgress,
}: PenugasanDetailProgressProps) {
  return (
    <div className="rounded-lg border p-4 sm:p-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
        <h2 className="text-base sm:text-lg font-medium">Laporan Progress</h2>
        {/* Add progress button jika teknisi assigned dan penugasan aktif */}
        {penugasan.teknisi && penugasan.teknisi.length > 0 && penugasan.status === 'Aktif' && (
          <Button
            size="sm"
            onClick={onAddProgress}
          >
            Add Progress Report
          </Button>
        )}
      </div>
      {/* Progress timeline */}
      {penugasan.laporan_progres && penugasan.laporan_progres.length > 0 ? (
        <div className="space-y-4">
          {penugasan.laporan_progres
            .sort((a, b) => new Date(b.tanggal_laporan).getTime() - new Date(a.tanggal_laporan).getTime())
            .map((laporan) => (
            <div 
              key={laporan.id} 
              className={`p-3 sm:p-4 rounded-lg border ${getValidasiStatusColor(laporan.status_validasi)}`}
            >
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-2">
                <span className="font-medium">
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
                <p className="text-sm text-muted-foreground mb-2">{laporan.catatan}</p>
              )}
              
              {/* Catatan validasi jika ditolak */}
              {laporan.status_validasi === "Ditolak" && laporan.catatan_validasi && (
                <div className="bg-red-100 border border-red-200 text-red-800 text-xs p-2 rounded mb-2">
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
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                  Divalidasi {new Date(laporan.divalidasi_pada || "").toLocaleString("id-ID")}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm sm:text-base">Belum ada laporan progress</p>
          {penugasan.teknisi && penugasan.teknisi.length > 0 && penugasan.status === 'Aktif' && (
            <div className="mt-4">
              <Button
                onClick={onAddProgress}
                size="sm"
              >
                Add First Progress Report
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}