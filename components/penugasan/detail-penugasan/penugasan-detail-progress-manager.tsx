import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PenugasanWithRelations } from "@/lib/penugasan/types";
import { useRouter } from "next/navigation";

interface PenugasanDetailProgressManagerProps {
  penugasan: PenugasanWithRelations;
}

const getValidasiStatusColor = (status?: string) => {
  switch (status) {
    case "Disetujui":
      return "bg-secondary/10 border-secondary/30 text-secondary-foreground";
    case "Ditolak":
      return "bg-destructive/10 border-destructive/30 text-destructive";
    default:
      return "bg-muted/50 border-border text-muted-foreground";
  }
};

export function PenugasanDetailProgressManager({
  penugasan,
}: PenugasanDetailProgressManagerProps) {
  const router = useRouter();

  const handleLaporanClick = (laporanId: number) => {
    router.push(`/views/manager/laporan/${laporanId}`);
  };
  const sortedLaporan = (penugasan.laporan_progres || []).sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="rounded-lg border p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-medium">Progress Laporan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Riwayat laporan progres dari teknisi
        </p>
      </div>

      {sortedLaporan.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-foreground">Belum ada laporan progres</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedLaporan.map((laporan: any) => (
            <div
              key={laporan.id}
              className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">{laporan.status_progres}</h3>
                    <Badge
                      variant="outline"
                      className={getValidasiStatusColor(laporan.status_validasi)}
                    >
                      {laporan.status_validasi || "Menunggu Validasi"}
                    </Badge>
                  </div>

                  <p className="text-sm text-foreground">
                    {new Date(laporan.tanggal_laporan).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>

                  {laporan.catatan && (
                    <p className="text-sm text-foreground">{laporan.catatan}</p>
                  )}

                  {laporan.catatan_validasi && (
                    laporan.status_validasi === 'Ditolak' ? (
                      <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs p-2 rounded mb-2">
                        <p className="font-semibold mb-1">Catatan validasi Supervisor:</p>
                        {laporan.catatan_validasi}
                      </div>
                    ) : (
                      <div className="text-sm text-foreground">
                        <strong>Catatan validasi Supervisor:</strong> {laporan.catatan_validasi}
                      </div>
                    )
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  {laporan.bukti_laporan && laporan.bukti_laporan.length > 0 && (
                    <p>{laporan.bukti_laporan.length} foto</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLaporanClick(laporan.id)}
                  className="self-start"
                >
                  Lihat Detail
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}