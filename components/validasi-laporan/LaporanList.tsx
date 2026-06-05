import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Check, X } from "lucide-react";
import { LaporanItem } from "./types";
import { getStatusBadge, getProgressStatusColor } from "./ui-components";

interface LaporanListProps {
  laporan: LaporanItem[];
  onDetail: (id: number) => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export default function LaporanList({ laporan, onDetail, onApprove, onReject }: LaporanListProps) {
  return (
    <div className="space-y-4">
      {laporan.map((laporanItem) => (
        <Card key={laporanItem.id} className={`p-4 sm:p-6 ${getProgressStatusColor(laporanItem.status_progres)}`}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Left: Info */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h3 className="font-semibold text-sm sm:text-base truncate">
                  {laporanItem.penugasan.judul}
                </h3>
                <Badge variant="secondary" className="w-fit text-xs">
                  {laporanItem.penugasan.kategori}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{laporanItem.pelapor.nama}</span>
                  <span className="text-xs">• Teknisi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(laporanItem.tanggal_laporan).toLocaleDateString("id-ID")}
                </div>
              </div>

              {laporanItem.catatan && (
                <p className="text-sm text-foreground">
                  Catatan: <strong>{laporanItem.catatan}</strong>
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {laporanItem.status_progres && (
                  <p className="text-sm text-foreground">
                    Progres Kerja: <strong>{laporanItem.status_progres}</strong>
                  </p>
                )}
                {laporanItem.persentase_progres != null && (
                  <Badge className="w-fit font-semibold bg-primary text-primary-foreground">
                    {laporanItem.persentase_progres}%
                  </Badge>
                )}
              </div>

              {/* Foto thumbnail */}
              {laporanItem.foto_url && (
                <div className="mt-3">
                  <img
                    src={laporanItem.foto_url}
                    alt="Laporan"
                    className="h-20 w-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => window.open(laporanItem.foto_url, "_blank")}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      console.error('Failed to load image:', laporanItem.foto_url);
                    }}
                  />
                </div>
              )}

              {/* Validasi info */}
              {laporanItem.status_validasi !== "Menunggu" && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded space-y-1">
                  <div>
                    Divalidasi oleh: <span className="font-medium text-foreground">{laporanItem.validator?.nama}</span>
                  </div>
                  <div>
                    {new Date(laporanItem.divalidasi_pada || "").toLocaleString("id-ID")}
                  </div>
                  {laporanItem.catatan_validasi && (
                    <div className="italic text-foreground">{laporanItem.catatan_validasi}</div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Status & Action */}
            <div className="flex flex-col gap-2 sm:items-end w-full sm:w-auto">
              {getStatusBadge(laporanItem.status_validasi)}

              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDetail(laporanItem.id)}
                  className="flex-1 sm:flex-none"
                >
                  Detail
                </Button>
                {laporanItem.status_validasi === "Menunggu" && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onApprove(laporanItem.id)}
                      className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onReject(laporanItem.id)}
                      className="flex-1 sm:flex-none"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}