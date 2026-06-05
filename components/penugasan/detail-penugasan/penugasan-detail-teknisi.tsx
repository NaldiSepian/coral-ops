import { Button } from "@/components/ui/button";
import { PenugasanWithRelations } from "@/lib/penugasan/types";
import { canAssignTeknisi } from "@/lib/penugasan/utils";

interface PenugasanDetailTeknisiProps {
  penugasan: PenugasanWithRelations;
  onAssignTeknisi: () => void;
  onRemoveTeknisi: (teknisiId: string) => void;
}

export function PenugasanDetailTeknisi({
  penugasan,
  onAssignTeknisi,
  onRemoveTeknisi,
}: PenugasanDetailTeknisiProps) {
  return (
    <div className="rounded-lg border p-4 sm:p-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
        <h2 className="text-base sm:text-lg font-medium">Teknisi Assigned</h2>
        {canAssignTeknisi(penugasan.status) && (
          <Button
            onClick={onAssignTeknisi}
            size="sm"
          >
            Assign Teknisi
          </Button>
        )}
      </div>
      {/* Teknisi list */}
      {penugasan.teknisi && penugasan.teknisi.length > 0 ? (
        <div className="space-y-3">
          {penugasan.teknisi.map((teknisi) => (
            <div key={teknisi.id} className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-medium flex-shrink-0">
                  {(teknisi.profil?.nama && typeof teknisi.profil.nama === 'string' ? teknisi.profil.nama.charAt(0).toUpperCase() : '?')}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{teknisi.profil?.nama || 'Nama tidak tersedia'}</p>
                  <p className="text-sm text-muted-foreground">{teknisi.profil?.peran || 'Teknisi'}</p>
                </div>
              </div>
              {/* Remove button jika SPV dan penugasan aktif */}
              {canAssignTeknisi(penugasan.status) && penugasan.status === 'Aktif' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveTeknisi(teknisi.teknisi_id)}
                  className="self-start sm:self-center"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm sm:text-base">Belum ada teknisi yang di-assign</p>
          {canAssignTeknisi(penugasan.status) && (
            <div className="mt-4">
              <Button
                onClick={onAssignTeknisi}
                size="sm"
              >
                Assign Teknisi Pertama
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}