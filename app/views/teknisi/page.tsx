"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AssignmentCard } from "@/components/teknisi/assignment-card";
import { KendalaDialog } from "@/components/teknisi/kendala-dialog";
import { ProgressDialog } from "@/components/teknisi/progress-dialog";
import { ReturnToolsDialog } from "@/components/teknisi/return-tools-dialog";
import { PenugasanWithRelations, StatusPenugasan } from "@/lib/penugasan/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCcw, Search } from "lucide-react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

type ActiveToolList = NonNullable<PenugasanWithRelations["alat"]>;

const VALIDATION_FILTERS: Array<{ value: StatusPenugasan | "ALL"; label: string }> = [
  { value: "ALL", label: "Semua Status" },
  { value: "Aktif", label: "Aktif" },
  { value: "Menunggu Validasi", label: "Menunggu Validasi" },
  { value: "Selesai", label: "Selesai" },
  { value: "Dibatalkan", label: "Dibatalkan" },
  { value: "Ditolak", label: "Ditolak" },
];

export default function TeknisiViews() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<PenugasanWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [kendalaDialogOpen, setKendalaDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressContext, setProgressContext] = useState<{
    id: number;
    title: string;
    reports: number;
    hasActiveTools: boolean;
  } | null>(null);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnContext, setReturnContext] = useState<{
    id: number;
    title: string;
    tools: ActiveToolList;
  } | null>(null);
  const [kendalaAssignmentId, setKendalaAssignmentId] = useState<number | null>(null);
  const [validationFilter, setValidationFilter] = useState<StatusPenugasan | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

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

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/teknisi/penugasan", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Gagal memuat penugasan");
      }
      setAssignments(payload.data || []);
      setLastUpdated(new Date().toISOString());
      
      // Debug logging
      if (payload.data && payload.data.length > 0) {
        console.log('[Fetch Assignments] First assignment:', {
          id: payload.data[0].id,
          judul: payload.data[0].judul,
          laporan_count: payload.data[0].laporan_progres?.length,
          latest_report: payload.data[0].laporan_progres?.[0]
        });
      }
    } catch (err) {
      setAssignments([]);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat penugasan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [supabase, fetchAssignments]);

  const handleKendalaClick = (assignmentId: number) => {
    setKendalaAssignmentId(assignmentId);
    setKendalaDialogOpen(true);
  };

  const handleKendalaDialogChange = (open: boolean) => {
    setKendalaDialogOpen(open);
    if (!open) {
      setKendalaAssignmentId(null);
    }
  };

  const hasFinalProgress = (assignment: PenugasanWithRelations) =>
    (assignment.laporan_progres || []).some((report) => report.status_progres === "Selesai");

  const assignmentHasActiveTools = (assignment: PenugasanWithRelations) =>
    (assignment.alat || []).some((item) => !item.is_returned);

  const getActiveTools = (assignment: PenugasanWithRelations): ActiveToolList =>
    (assignment.alat?.filter((item) => !item.is_returned) ?? []) as ActiveToolList;

  const isReportLocked = (assignment: PenugasanWithRelations) =>
    assignment.status !== "Aktif" || hasFinalProgress(assignment);

  const handleProgressClick = (assignment: PenugasanWithRelations) => {
    if (isReportLocked(assignment)) {
      setInfo("Penugasan ini sedang menunggu validasi supervisor & manager.");
      return;
    }
    setProgressContext({
      id: assignment.id,
      title: assignment.judul,
      reports: assignment.laporan_progres?.length || 0,
      hasActiveTools: assignmentHasActiveTools(assignment),
    });
    setProgressDialogOpen(true);
  };

  const handleViewDetail = (assignment: PenugasanWithRelations) => {
    router.push(`/views/teknisi/${assignment.id}`);
  };

  const handleReturnClick = (assignment: PenugasanWithRelations) => {
    const activeTools = getActiveTools(assignment);
    if (activeTools.length === 0) {
      setInfo("Semua alat untuk penugasan ini sudah dikembalikan.");
      return;
    }
    setReturnContext({
      id: assignment.id,
      title: assignment.judul,
      tools: activeTools,
    });
    setReturnDialogOpen(true);
  };

  const handleProgressDialogChange = (open: boolean) => {
    setProgressDialogOpen(open);
    if (!open) {
      setProgressContext(null);
    }
  };

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

  const showComingSoon = (feature: string) => {
    setInfo(`${feature} akan hadir di iterasi berikutnya. Tetap lanjutkan progres di lapangan ya!`);
  };

  const filteredAssignments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return assignments.filter((assignment) => {
      const matchesValidation = validationFilter === "ALL" || assignment.status === validationFilter;
      const matchesSearch = !normalizedSearch
        || assignment.judul.toLowerCase().includes(normalizedSearch)
        || assignment.lokasi_text?.toLowerCase().includes(normalizedSearch)
        || assignment.kategori.toLowerCase().includes(normalizedSearch);
      return matchesValidation && matchesSearch;
    });
  }, [assignments, searchTerm, validationFilter]);

  const hasActiveFilters =
    validationFilter !== "ALL" ||
    searchTerm.trim() !== "";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Eksekusi Penugasan oleh Teknisi</p>
        <div>
          <h1 className="text-2xl font-bold leading-tight">Penugasan Saya</h1>
          <p className="text-sm text-muted-foreground">Pantau progres, laporkan kendala, dan mulai pekerjaan sesuai SOP.</p>
        </div>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchAssignments}>
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {info && !error && (
        <Alert>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{info}</span>
            <Button variant="ghost" size="sm" onClick={() => setInfo(null)}>
              Tutup
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? "Memuat penugasan..." : `${filteredAssignments.length} dari ${assignments.length} penugasan`}
            {lastUpdated && !loading && ` • diperbarui ${new Date(lastUpdated).toLocaleTimeString("id-ID")}`}
          </p>
          <Button onClick={fetchAssignments} variant="outline" size="sm" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="sr-only sm:not-sr-only sm:ml-2">Menyegarkan</span>
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-2">Refresh</span>
              </>
            )}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[180px_minmax(0,1fr)_auto] lg:items-center">
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Validasi</Label>
            <Select value={validationFilter} onValueChange={(value) => setValidationFilter(value as StatusPenugasan | "ALL")}>
              <SelectTrigger>
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                {VALIDATION_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cari Penugasan</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Judul / lokasi / kategori"
                className="pl-8"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValidationFilter("ALL");
                  setSearchTerm("");
                }}
              >
                Bersihkan Filter
              </Button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((index) => (
            <Card key={index} className="space-y-3 border-dashed p-4">
              <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded bg-muted" />
            </Card>
          ))}
        </div>
      ) : filteredAssignments.length > 0 ? (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              warning={getWarningMessage(assignment)}
              onReport={() => handleProgressClick(assignment)}
              onKendala={() => handleKendalaClick(assignment.id)}
              onReturnTool={() => handleReturnClick(assignment)}
              onViewDetail={() => handleViewDetail(assignment)}
              canReport={!isReportLocked(assignment)}
              canKendala={!isReportLocked(assignment)}
              canReturn={assignmentHasActiveTools(assignment)}
              lockedReason={hasFinalProgress(assignment)
                ? "Laporan akhir sudah dikirim dan menunggu validasi."
                : assignment.status !== "Aktif"
                  ? "Status penugasan belum aktif."
                  : undefined}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-base font-medium">
            {hasActiveFilters ? "Tidak ada penugasan yang cocok dengan filter" : "Belum ada penugasan aktif untuk Anda"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Coba ubah kata kunci atau reset filter di atas."
              : "Supervisor akan memberi tahu jika ada pekerjaan baru. Silakan tetap stand-by."}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setValidationFilter("ALL");
                setSearchTerm("");
              }}
            >
              Reset Filter
            </Button>
          )}
        </Card>
      )}

      <ProgressDialog
        open={progressDialogOpen}
        onOpenChange={handleProgressDialogChange}
        assignmentId={progressContext?.id ?? null}
        assignmentTitle={progressContext?.title}
        existingReports={progressContext?.reports || 0}
        userId={userId}
        hasActiveTools={progressContext?.hasActiveTools}
        onSuccess={() => {
          fetchAssignments();
        }}
      />

      <KendalaDialog
        open={kendalaDialogOpen}
        onOpenChange={handleKendalaDialogChange}
        assignmentId={kendalaAssignmentId}
        userId={userId}
        onSuccess={() => {
          fetchAssignments();
        }}
      />

      <ReturnToolsDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        assignmentId={returnContext?.id ?? null}
        assignmentTitle={returnContext?.title}
        userId={userId}
        tools={returnContext?.tools || []}
        onSuccess={() => {
          fetchAssignments();
        }}
      />
    </div>
  );
}
