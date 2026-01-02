import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";
import Image from "next/image";
import { LaporanDetail } from "./types";

interface PhotoPairsCardProps {
  laporan: LaporanDetail;
  onPhotoClick: (url: string) => void;
}

export default function PhotoPairsCard({ laporan, onPhotoClick }: PhotoPairsCardProps) {
  if (!laporan.bukti_laporan || laporan.bukti_laporan.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Bukti Laporan
        </CardTitle>
      </CardHeader>
      <CardContent>
        {laporan.bukti_laporan.some(bukti => bukti.taken_at) && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground">
              Diambil pada: {new Date(laporan.bukti_laporan.find(bukti => bukti.taken_at)?.taken_at || "").toLocaleString("id-ID")}
              {laporan.bukti_laporan.some(bukti => bukti.taken_by) && ` oleh ${laporan.pelapor.nama}`}
            </p>
          </div>
        )}
        <div className="space-y-6">
          {laporan.bukti_laporan.map((bukti) => (
            <div key={bukti.id} className="space-y-3">
              {bukti.judul && (
                <h4 className="font-medium">{bukti.judul}</h4>
              )}
              {bukti.deskripsi && (
                <p className="text-sm text-muted-foreground">{bukti.deskripsi}</p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Sebelum</p>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => onPhotoClick(bukti.before_foto_url)}>
                    <Image
                      src={bukti.before_foto_url}
                      alt="Foto sebelum"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Sesudah</p>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => onPhotoClick(bukti.after_foto_url)}>
                    <Image
                      src={bukti.after_foto_url}
                      alt="Foto sesudah"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}