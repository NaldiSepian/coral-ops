"use client";

import { PenugasanWithRelations } from "@/lib/penugasan/types";
import { formatFrekuensiLaporan } from "@/lib/penugasan/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface AssignmentCardProps {
  assignment: PenugasanWithRelations;
  warning?: string | null;
  onReport: () => void;
  onKendala: () => void;
  onReturnTool: () => void;
  onViewDetail: () => void;
  canReport: boolean;
  canKendala: boolean;
  canReturn: boolean;
  lockedReason?: string;
}

export function AssignmentCard({
  assignment,
  warning,
  onReport,
  onKendala,
  onReturnTool,
  onViewDetail,
  canReport,
  canKendala,
  canReturn,
  lockedReason,
}: AssignmentCardProps) {
  const activeAlat = assignment.alat?.filter((item) => !item.is_returned) || [];
  const totalReports = assignment.laporan_progres?.length || 0;
  const approvedReports = assignment.laporan_progres?.filter(report => report.status_validasi === "Disetujui").length || 0;
  
  // Find the latest approved report for display
  const latestApprovedReport = assignment.laporan_progres?.find(report => report.status_validasi === "Disetujui") || null;
  const latestReport = assignment.laporan_progres?.[0];
  const isLatestRejected = latestReport?.status_validasi === "Ditolak";
  
  // Use approved report for display, fallback to latest if no approved reports
  const displayProgress = latestApprovedReport || latestReport;
  const currentPercentage = displayProgress?.persentase_progres;
  
  const progressLabel = `Lapor Progres ke-${approvedReports + 1}`;

  // Debug logging
  if (assignment.id === 12 || totalReports > 0) {
    console.log(`[Assignment Card Debug] ID: ${assignment.id}`, {
      totalReports,
      displayProgress: displayProgress
        ? {
            id: displayProgress.id,
            tanggal_laporan: displayProgress.tanggal_laporan,
            status_progres: displayProgress.status_progres,
            persentase_progres: displayProgress.persentase_progres,
          }
        : null,
      latestReport: latestReport
        ? {
            id: latestReport.id,
            status_validasi: latestReport.status_validasi,
          }
        : null,
      currentPercentage,
      allReports: assignment.laporan_progres?.map((r) => ({
        id: r.id,
        tanggal: r.tanggal_laporan,
        persentase: r.persentase_progres,
        status_validasi: r.status_validasi,
      })),
    });
  }

  return (
    <Card className="p-4 flex flex-col gap-4 border shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="cursor-pointer" onClick={onViewDetail}>
            <h3 className="text-lg font-semibold leading-tight hover:text-primary transition-colors">
              {assignment.judul}
            </h3>
            <p className="text-sm text-muted-foreground">
              {assignment.kategori} •{" "}
              {formatFrekuensiLaporan(assignment.frekuensi_laporan)}
            </p>
          </div>
          <Badge variant="outline">{assignment.status}</Badge>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            Mulai: {new Date(assignment.start_date).toLocaleDateString("id-ID")}
          </p>
          <p>
            Selesai:{" "}
            {assignment.end_date
              ? new Date(assignment.end_date).toLocaleDateString("id-ID")
              : "Belum ditetapkan"}
          </p>
          <p>Supervisor: {assignment.supervisor?.nama || "Tidak diketahui"}</p>
          {displayProgress && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">
                Laporan Terakhir:
              </span> {displayProgress.status_progres}
              {currentPercentage != null && (
                <span className="text-base font-bold text-primary">
                  {currentPercentage}%
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-sm">
          <p className="font-medium">Tim:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {assignment.teknisi?.map((member) => (
              <Badge
                key={member.teknisi_id || member.id}
                variant="secondary"
                className="text-xs"
              >
                {member.profil?.nama || member.teknisi_id}
              </Badge>
            ))}
          </div>
        </div>
        <div className="text-sm">
          <p className="font-medium">Alat Dipinjam:</p>
          {activeAlat.length > 0 ? (
            <ul className="mt-1 text-muted-foreground text-sm list-disc list-inside">
              {activeAlat.map((item) => (
                <li key={item.id}>
                  {item.alat?.nama || `Alat ${item.alat_id}`} × {item.jumlah}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm mt-1">
              Tidak ada alat aktif
            </p>
          )}
        </div>
        {warning && (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-900">
            {warning}
          </div>
        )}
        {!canReport && lockedReason && (
          <p className="text-xs text-muted-foreground">{lockedReason}</p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {/* Tombol Lapor Progres */}
        <Button
          onClick={onReport}
          variant="default"
          className="flex-1 min-w-[150px]"
          disabled={!canReport}
        >
          {canReport ? progressLabel : isLatestRejected ? "Laporan Ditolak" : "Menunggu Validasi"}
        </Button>
        <Button
          onClick={onKendala}
          variant="outline"
          className="flex-1 min-w-[150px]"
          disabled={!canKendala}
        >
          Ajukan Kendala
        </Button>
        <Button
          onClick={onReturnTool}
          variant="outline"
          className="flex-1 min-w-[150px]"
          disabled={!canReturn}
        >
          Kembalikan Alat
        </Button>
      </div>
    </Card>
  );
}
