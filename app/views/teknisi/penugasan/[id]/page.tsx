"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PenugasanWithRelations } from "@/lib/penugasan/types";
import PenugasanDetail from "@/components/teknisi/penugasan-detail";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { KendalaDialog } from "@/components/teknisi/kendala-dialog";
import { ProgressDialog } from "@/components/teknisi/progress-dialog";
import { ReturnToolsDialog } from "@/components/teknisi/return-tools-dialog";
import { parseLocation, getLocationDisplayText } from "@/lib/utils/location";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface ProgressReport {
  id: number;
  status_progres: string;
  catatan: string;
  foto_url: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  persentase_progres: number;
  pairs?: Array<{
    id?: number;
    pair_key: string;
    judul?: string;
    deskripsi?: string;
    before_foto_url?: string;
    after_foto_url?: string;
  }>;
}

export default function TeknisiAssignmentDetail() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;
  const supabase = useMemo(() => createSupabaseClient(), []);

  const [assignment, setAssignment] = useState<PenugasanWithRelations | null>(null);
  const [progressReports, setProgressReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [kendalaDialogOpen, setKendalaDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.user?.id || null);
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const fetchAssignmentDetail = useCallback(async () => {
    if (!assignmentId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/teknisi/penugasan/${assignmentId}?include=supervisor,teknisi,alat,laporan_progres,kehadiran,perpanjangan`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Gagal memuat detail penugasan");
      }

      setAssignment(payload.data);
      
      // Process progress reports - API already returns properly structured pairs
      const processedReports = (payload.data.laporan_progres || []).map((report: any) => {
        return {
          ...report,
          // Ensure latitude and longitude are proper numbers
          latitude: typeof report.latitude === 'number' ? report.latitude : null,
          longitude: typeof report.longitude === 'number' ? report.longitude : null,
          // pairs are already in the correct format from API
          pairs: report.bukti_laporan || []
        };
      });
      
      setProgressReports(processedReports);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat detail penugasan";
      setError(errorMessage);
      console.error('Error fetching assignment detail:', err);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchAssignmentDetail();
  }, [fetchAssignmentDetail]);

  const hasFinalProgress = (assignment: PenugasanWithRelations) =>
    (assignment.laporan_progres || []).some((report) => report.status_progres === "Selesai");

  const getActiveTools = (assignment: PenugasanWithRelations) =>
    (assignment.alat?.filter((item) => !item.is_returned) ?? []);

  const isReportLocked = (assignment: PenugasanWithRelations) =>
    assignment.status !== "Aktif" || hasFinalProgress(assignment);

  const getWarningMessage = (assignment: PenugasanWithRelations): string | null => {
    if (assignment.status === "Menunggu Validasi") {
      return "Menunggu validasi supervisor & manager untuk memastikan pekerjaan selesai";
    }
    const pendingKendala = assignment.perpanjangan?.find((item) => item.status === "Menunggu");
    if (pendingKendala) {
      return "Pengajuan kendala/perpanjangan sedang menunggu respon supervisor";
    }
    return null;
  };

  const activeTools = useMemo(() => assignment ? getActiveTools(assignment) : [], [assignment?.alat]);

  const warningMessage = useMemo(() => assignment ? getWarningMessage(assignment) : null, [assignment]);
  const attendanceStatus = useMemo(() => progressReports.length > 0 ? progressReports[progressReports.length - 1].status_progres : null, [progressReports]);
  const isReportLockedValue = useMemo(() => assignment ? isReportLocked(assignment) : false, [assignment]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
        <div className="space-y-4">
          <Card className="space-y-3 p-6">
            <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="space-y-3 p-4">
                <div className="h-5 w-1/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error || "Penugasan tidak ditemukan"}</span>
            <Button variant="outline" size="sm" onClick={fetchAssignmentDetail}>
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <PenugasanDetail
        assignment={assignment}
        progressReports={progressReports}
        loading={loading}
        error={error}
        onRetry={fetchAssignmentDetail}
        onBack={() => router.back()}
        onProgressClick={() => setProgressDialogOpen(true)}
        onKendalaClick={() => setKendalaDialogOpen(true)}
        onReturnClick={() => setReturnDialogOpen(true)}
        isReportLocked={isReportLockedValue}
        activeTools={activeTools}
        warningMessage={warningMessage}
        attendanceStatus={attendanceStatus}
      />

      {/* Dialogs */}
      <KendalaDialog
        open={kendalaDialogOpen}
        onOpenChange={setKendalaDialogOpen}
        assignmentId={assignment.id}
        userId={userId}
        onSuccess={() => {
          fetchAssignmentDetail();
        }}
      />
      <ProgressDialog
        open={progressDialogOpen}
        onOpenChange={setProgressDialogOpen}
        assignmentId={assignment.id}
        userId={userId}
        onSuccess={() => {
          fetchAssignmentDetail();
        }}
      />
      <ReturnToolsDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        assignmentId={assignment.id}
        userId={userId}
        tools={activeTools}
        onSuccess={() => {
          fetchAssignmentDetail();
        }}
      />
    </>
  );
}
