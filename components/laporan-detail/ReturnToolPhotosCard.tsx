import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import Image from "next/image";
import { LaporanDetail } from "./types";

interface ReturnToolPhotosCardProps {
  laporan: LaporanDetail;
  onPhotoClick: (url: string) => void;
}

export default function ReturnToolPhotosCard({ laporan, onPhotoClick }: ReturnToolPhotosCardProps) {
  if (!laporan.return_tool_photos || laporan.return_tool_photos.length === 0) return null;

  const areAllReturnToolPhotosSame = laporan.return_tool_photos.length > 0 && laporan.return_tool_photos.every(photo => photo.foto_url === laporan.return_tool_photos![0].foto_url);

  const groupedReturnToolPhotos = laporan.return_tool_photos.length > 0 ? (() => {
    const groups: { [key: string]: Array<{ id: number; foto_url: string; alat_id: number; alat?: { nama: string; tipe_alat: string; } }> } = {};
    laporan.return_tool_photos.forEach((photo) => {
      if (!groups[photo.foto_url]) {
        groups[photo.foto_url] = [];
      }
      groups[photo.foto_url].push(photo);
    });
    return groups;
  })() : {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Bukti Pengembalian Alat
        </CardTitle>
      </CardHeader>
      <CardContent>
        {areAllReturnToolPhotosSame ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Semua alat menggunakan foto bukti yang sama
            </p>
            <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => onPhotoClick(laporan.return_tool_photos![0].foto_url)}>
              <Image
                src={laporan.return_tool_photos[0].foto_url}
                alt="Bukti pengembalian alat"
                fill
                className="object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(groupedReturnToolPhotos).map(([fotoUrl, photos]) => {
                const toolNames = photos.map(p => p.alat?.nama || `Alat ${p.alat_id}`).join(', ');
                return (
                  <div key={fotoUrl} className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {toolNames}
                    </p>
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => onPhotoClick(fotoUrl)}>
                      <Image
                        src={fotoUrl}
                        alt={`Bukti pengembalian ${toolNames}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}