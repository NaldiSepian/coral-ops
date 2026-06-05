import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import Image from "next/image";
import { LaporanDetail } from "./types";

interface ToolPhotosCardProps {
  laporan: LaporanDetail;
  onPhotoClick: (url: string) => void;
}

export default function ToolPhotosCard({ laporan, onPhotoClick }: ToolPhotosCardProps) {
  if (!laporan.tool_photos || laporan.tool_photos.length === 0) return null;

  const groupedToolPhotos = laporan.tool_photos.reduce<{
    [key: string]: Array<{
      id: number;
      foto_url: string;
      alat_id: number;
      alat?: { nama: string; tipe_alat: string };
    }>
  }>((groups, photo) => {
    if (!groups[photo.foto_url]) {
      groups[photo.foto_url] = [];
    }
    groups[photo.foto_url].push(photo);
    return groups;
  }, {});

  const allSame = Object.keys(groupedToolPhotos).length === 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Bukti Pengambilan Alat
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allSame ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Semua alat menggunakan foto bukti yang sama
            </p>
            <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => onPhotoClick(laporan.tool_photos![0].foto_url)}>
              <Image
                src={laporan.tool_photos![0].foto_url}
                alt="Bukti pengambilan alat"
                fill
                className="object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedToolPhotos).map(([fotoUrl, photos]) => {
              const toolNames = photos.map(p => p.alat?.nama || `Alat ${p.alat_id}`).join(', ');
              return (
                <div key={fotoUrl} className="space-y-2">
                  <p className="text-sm font-medium">{toolNames}</p>
                  {photos.length > 1 && (
                    <p className="text-xs text-muted-foreground">{photos.length}x alat</p>
                  )}
                  <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => onPhotoClick(fotoUrl)}>
                    <Image
                      src={fotoUrl}
                      alt={`Bukti pengambilan ${toolNames}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}