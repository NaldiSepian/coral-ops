import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PenugasanWithRelations } from "@/lib/penugasan/types";
import { canAssignAlat } from "@/lib/penugasan/utils";

interface PenugasanDetailAlatProps {
  penugasan: PenugasanWithRelations;
  onAssignAlat: () => void;
  onReturnAlat: (alatId: number) => void;
}

export function PenugasanDetailAlat({
  penugasan,
  onAssignAlat,
  onReturnAlat,
}: PenugasanDetailAlatProps) {
  const alatMap = (penugasan.alat || []).reduce((map, item) => {
      const key = item.alat_id;
      if (!map.has(key)) {
        map.set(key, {
          alatId: key,
          nama: item.alat?.nama || 'Nama alat tidak tersedia',
          totalJumlah: 0,
          dipinjamJumlah: 0,
        });
      }

      const entry = map.get(key)!;
      entry.totalJumlah += item.jumlah;
      if (!item.is_returned) {
        entry.dipinjamJumlah += item.jumlah;
      }
      return map;
    }, new Map<number, { alatId: number; nama: string; totalJumlah: number; dipinjamJumlah: number }>());

  const aggregatedAlat = Array.from(alatMap.values());

  return (
    <div className="rounded-lg border p-4 sm:p-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
        <h2 className="text-base sm:text-lg font-medium">Alat Assigned</h2>
        {canAssignAlat(penugasan.status) && (
          <Button
            onClick={onAssignAlat}
            size="sm"
          >
            Assign Alat
          </Button>
        )}
      </div>
      {/* Alat list */}
      {aggregatedAlat.length > 0 ? (
        <div className="space-y-3">
          {aggregatedAlat.map((alat) => (
            <div key={alat.alatId} className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-3 rounded-lg border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center font-medium flex-shrink-0">
                    {alat.nama && typeof alat.nama === 'string' ? alat.nama.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{alat.nama || 'Nama alat tidak tersedia'}</p>
                    <p className="text-sm text-muted-foreground">Jumlah total: {alat.totalJumlah}</p>
                    {alat.dipinjamJumlah > 0 && alat.dipinjamJumlah !== alat.totalJumlah && (
                      <p className="text-xs text-muted-foreground">Masih dipinjam: {alat.dipinjamJumlah}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                <Badge variant={alat.dipinjamJumlah > 0 ? 'default' : 'secondary'} className="self-start">
                  {alat.dipinjamJumlah > 0 ? 'Dipinjam' : 'Dikembalikan'}
                </Badge>
                {/* Return button jika SPV dan belum dikembalikan */}
                {canAssignAlat(penugasan.status) && alat.dipinjamJumlah > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReturnAlat(alat.alatId)}
                    className="self-start sm:self-center"
                  >
                    Return
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm sm:text-base">Belum ada alat yang di-assign</p>
          {canAssignAlat(penugasan.status) && (
            <div className="mt-4">
              <Button
                onClick={onAssignAlat}
                size="sm"
              >
                Assign Alat Pertama
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}