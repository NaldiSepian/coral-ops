import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";
import Image from "next/image";
import { LaporanDetail } from "./types";

interface LegacyFotoCardProps {
  laporan: LaporanDetail;
  onPhotoClick: (url: string) => void;
}

export default function LegacyFotoCard({ laporan, onPhotoClick }: LegacyFotoCardProps) {
  if (!laporan.foto_url || (laporan.bukti_laporan && laporan.bukti_laporan.length > 0)) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Foto Bukti
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video max-w-md rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => onPhotoClick(laporan.foto_url)}>
          <Image
            src={laporan.foto_url}
            alt="Foto bukti"
            fill
            className="object-cover"
          />
        </div>
      </CardContent>
    </Card>
  );
}