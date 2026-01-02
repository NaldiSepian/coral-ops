"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import ValidationDialog from "@/components/validasi-laporan/ValidationDialog";
import LaporanList from "@/components/validasi-laporan/LaporanList";
import { SearchBar, EmptyState } from "@/components/validasi-laporan/ui-components";
import { LaporanItem } from "@/components/validasi-laporan/types";

export default function ValidasiLaporanPage() {
  const [laporan, setLaporan] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  // Validation dialog states
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationAction, setValidationAction] = useState<'approve' | 'reject' | null>(null);
  const [validationNote, setValidationNote] = useState('');
  const [validating, setValidating] = useState(false);
  const [selectedLaporanId, setSelectedLaporanId] = useState<number | null>(null);

  const fetchLaporan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("status", "Menunggu");

      const response = await fetch(`/api/supervisor/laporan-validasi?${params}`, {
        cache: "no-store"
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal memuat laporan");
      }

      setLaporan(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setLaporan([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan, refreshTrigger]);

  const filteredLaporan = useMemo(() => {
    if (!searchQuery) return laporan;
    return laporan.filter(
      (l) =>
        l.penugasan.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.pelapor.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [laporan, searchQuery]);

  const handleDetail = (laporanId: number) => {
    router.push(`/views/spv/laporan/${laporanId}`);
  };

  const handleApprove = async (laporanId: number) => {
    setSelectedLaporanId(laporanId);
    setValidationAction('approve');
    setValidationNote('');
    setShowValidationDialog(true);
  };

  const handleReject = async (laporanId: number) => {
    setSelectedLaporanId(laporanId);
    setValidationAction('reject');
    setValidationNote('');
    setShowValidationDialog(true);
  };

  const handleValidation = async (action: 'approve' | 'reject') => {
    if (!selectedLaporanId) return;

    // Ensure status is exactly "Disetujui" or "Ditolak"
    const validationStatus = action === 'approve' ? 'Disetujui' : 'Ditolak';

    setValidating(true);
    try {
      const response = await fetch(`/api/laporan/${selectedLaporanId}/validasi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status_validasi: validationStatus,
          catatan_validasi: validationNote.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal melakukan validasi');
      }

      // Refresh data
      setRefreshTrigger((prev) => prev + 1);
      
      // Close dialog and reset state
      setShowValidationDialog(false);
      setValidationAction(null);
      setValidationNote('');
      setSelectedLaporanId(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat validasi');
    } finally {
      setValidating(false);
    }
  };

  const openValidationDialog = (action: 'approve' | 'reject', laporanId: number) => {
    setSelectedLaporanId(laporanId);
    setValidationAction(action);
    setValidationNote('');
    setShowValidationDialog(true);
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Validasi Laporan Progres</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review dan validasi laporan dari teknisi lapangan
        </p>
      </header>

      {/* Search */}
      <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Laporan List */}
      {!loading && filteredLaporan.length > 0 && (
        <LaporanList
          laporan={filteredLaporan}
          onDetail={handleDetail}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Empty State */}
      {!loading && filteredLaporan.length === 0 && <EmptyState />}

      {/* Validation Dialog */}
      <ValidationDialog
        open={showValidationDialog}
        onOpenChange={setShowValidationDialog}
        validationAction={validationAction}
        validationNote={validationNote}
        onValidationNoteChange={setValidationNote}
        onValidation={handleValidation}
        validating={validating}
      />

    </section>
  );
}
