import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PenugasanWithRelations } from "@/lib/penugasan/types";
import { canAssignAlat } from "@/lib/penugasan/utils";
import Image from "next/image";

interface PenugasanDetailAlatProps {
  penugasan: PenugasanWithRelations;
  onAssignAlat: () => void;
  onReturnAlat: (alatId: number) => void;
}

function groupPhotos(
  items: NonNullable<PenugasanWithRelations["alat"]>,
  key: "foto_ambil" | "foto_kembali",
  label: string
) {
  const allPhotos: Array<{ url: string; alatId: number; nama: string }> = [];
  items.forEach((item) => {
    const photos = item[key];
    if (photos && photos.length > 0) {
      photos.forEach((p) => {
        allPhotos.push({ url: p.url, alatId: item.alat_id, nama: item.alat?.nama || `Alat ${item.alat_id}` });
      });
    }
  });
  if (allPhotos.length === 0) return null;

  const groups: { [key: string]: { url: string; alatNames: Set<string> } } = {};
  allPhotos.forEach((p) => {
    if (!groups[p.url]) {
      groups[p.url] = { url: p.url, alatNames: new Set() };
    }
    groups[p.url].alatNames.add(p.nama);
  });

  const entries = Object.values(groups);
  const allSame = entries.length === 1;

  return { entries, allSame, label };
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

  const fotoAmbil = groupPhotos(penugasan.alat || [], "foto_ambil", "Foto Pengambilan Alat");
  const fotoKembali = groupPhotos(penugasan.alat || [], "foto_kembali", "Foto Pengembalian Alat");

  const showPhotoSection = fotoAmbil || fotoKembali;

  return (
    <div className="rounded-lg border p-4 sm:p-6">
      {/* Daftar Alat */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
        <h2 className="text-base sm:text-lg font-medium">Alat Assigned</h2>
        {canAssignAlat(penugasan.status) && (
          <Button onClick={onAssignAlat} size="sm">
            Assign Alat
          </Button>
        )}
      </div>
      {aggregatedAlat.length > 0 ? (
        <div className="space-y-3">
          {aggregatedAlat.map((alat) => (
            <div key={alat.alatId} className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center font-medium flex-shrink-0">
                  {alat.nama.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{alat.nama}</p>
                  <p className="text-sm text-muted-foreground">Jumlah total: {alat.totalJumlah}</p>
                  {alat.dipinjamJumlah > 0 && alat.dipinjamJumlah !== alat.totalJumlah && (
                    <p className="text-xs text-muted-foreground">Masih dipinjam: {alat.dipinjamJumlah}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={alat.dipinjamJumlah > 0 ? 'default' : 'secondary'}>
                  {alat.dipinjamJumlah > 0 ? 'Dipinjam' : 'Dikembalikan'}
                </Badge>
                {canAssignAlat(penugasan.status) && alat.dipinjamJumlah > 0 && (
                  <Button variant="outline" size="sm" onClick={() => onReturnAlat(alat.alatId)}>
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
              <Button onClick={onAssignAlat} size="sm">
                Assign Alat Pertama
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Foto Bukti Pengambilan & Pengembalian */}
      {showPhotoSection && (
        <div className="mt-6 pt-6 border-t space-y-6">
          {[fotoAmbil, fotoKembali].filter(Boolean).map((section) => {
            const { entries, allSame, label } = section!;
            return (
              <div key={label} className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">{label}</h3>
                {allSame ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Semua alat menggunakan foto bukti yang sama
                    </p>
                    <div className="relative aspect-video max-w-sm rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(entries[0].url, '_blank')}>
                      <Image src={entries[0].url} alt={label} fill className="object-cover" />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {entries.map((entry) => (
                      <div key={entry.url} className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {Array.from(entry.alatNames).join(', ')}
                        </p>
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(entry.url, '_blank')}>
                          <Image src={entry.url} alt={label} fill className="object-cover" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
