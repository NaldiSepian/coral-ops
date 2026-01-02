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

  const areAllToolPhotosSame = laporan.tool_photos.length > 0 && laporan.tool_photos.every(photo => photo.foto_url === laporan.tool_photos![0].foto_url);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Bukti Pengambilan Alat
        </CardTitle>
      </CardHeader>
      <CardContent>
        {areAllToolPhotosSame ? (
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
            {laporan.tool_photos.map((toolPhoto) => (
              <div key={toolPhoto.id} className="space-y-2">
                <p className="text-sm font-medium">
                  {toolPhoto.alat?.nama || `Alat ${toolPhoto.alat_id}`}
                </p>
                <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => onPhotoClick(toolPhoto.foto_url)}>
                  <Image
                    src={toolPhoto.foto_url}
                    alt={`Bukti pengambilan ${toolPhoto.alat?.nama || `alat ${toolPhoto.alat_id}`}`}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}