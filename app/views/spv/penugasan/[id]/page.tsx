'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PenugasanWithRelations, PenugasanError } from '@/lib/penugasan/types';
import { PENUGASAN_STATUS, PENUGASAN_KATEGORI } from '@/lib/penugasan/constants';
import { canCancelPenugasan, canCompletePenugasan } from '@/lib/penugasan/utils';
import { PenugasanDetailHeader } from "@/components/penugasan/detail-penugasan/penugasan-detail-header";
import { PenugasanDetailOverview } from "@/components/penugasan/detail-penugasan/penugasan-detail-overview";
import { PenugasanDetailTeknisi } from "@/components/penugasan/detail-penugasan/penugasan-detail-teknisi";
import { PenugasanDetailAlat } from "@/components/penugasan/detail-penugasan/penugasan-detail-alat";
import { PenugasanDetailProgress } from "@/components/penugasan/detail-penugasan/penugasan-detail-progress";
import { AssignTeknisiDialog } from "@/components/penugasan/assign/assign-teknisi-dialog";
import { AssignAlatDialog } from "@/components/penugasan/assign/assign-alat-dialog";

export default function PenugasanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const penugasanId = params.id as string;

  // State management dengan proper typing
  const [penugasan, setPenugasan] = useState<PenugasanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PenugasanError | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Dialog states
  const [showAssignTeknisi, setShowAssignTeknisi] = useState(false);
  const [showAssignAlat, setShowAssignAlat] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Data fetching dengan proper error handling
  useEffect(() => {
    const fetchPenugasanDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/penugasan/${penugasanId}?include=supervisor,teknisi,alat,laporan_progres`);

        if (!response.ok) {
          if (response.status === 404) {
            router.push('/views/spv/penugasan?error=Penugasan tidak ditemukan');
            return;
          }
          if (response.status === 403) {
            setError({ message: 'Anda tidak memiliki akses untuk melihat penugasan ini', code: 'FORBIDDEN' });
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPenugasan(data.data);
      } catch (err) {
        console.error('Failed to fetch penugasan detail:', err);
        setError({
          message: err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data',
          code: 'NETWORK_ERROR'
        });
      } finally {
        setLoading(false);
      }
    };

    if (penugasanId) {
      fetchPenugasanDetail();
    }
  }, [penugasanId, refreshTrigger, router]);

  // Action handlers dengan proper implementation
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEdit = () => {
    router.push(`/views/spv/penugasan/${penugasanId}/edit`);
  };

  const handleAssignTeknisi = () => {
    setShowAssignTeknisi(true);
  };

  const handleAssignAlat = () => {
    setShowAssignAlat(true);
  };

  const handleRemoveTeknisi = async (teknisiId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus teknisi ini dari penugasan?')) return;

    try {
      const response = await fetch(`/api/penugasan/${penugasanId}/assign-teknisi`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teknisi_id: teknisiId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove teknisi');
      }

      handleRefresh();
    } catch (err) {
      console.error('Failed to remove teknisi:', err);
      setError({
        message: 'Gagal menghapus teknisi',
        code: 'UPDATE_ERROR'
      });
    }
  };

  const handleReturnAlat = async (alatId: number) => {
    if (!confirm('Apakah Anda yakin ingin mengembalikan alat ini?')) return;

    try {
      const response = await fetch(`/api/penugasan/${penugasanId}/assign-alat`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alat_id: alatId }),
      });

      if (!response.ok) {
        throw new Error('Failed to return alat');
      }

      handleRefresh();
    } catch (err) {
      console.error('Failed to return alat:', err);
      setError({
        message: 'Gagal mengembalikan alat',
        code: 'UPDATE_ERROR'
      });
    }
  };

  const handleCancel = async () => {
    if (!penugasan || !canCancelPenugasan(penugasan.status)) return;

    if (confirm('Apakah Anda yakin ingin membatalkan penugasan ini?')) {
      try {
        const response = await fetch(`/api/penugasan/${penugasanId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Dibatalkan' }),
        });

        if (!response.ok) {
          throw new Error('Failed to cancel penugasan');
        }

        handleRefresh();
      } catch (err) {
        console.error('Failed to cancel penugasan:', err);
        setError({
          message: 'Gagal membatalkan penugasan',
          code: 'UPDATE_ERROR'
        });
      }
    }
  };

  const handleDelete = async () => {
    if (!penugasan || penugasan.status !== 'Dibatalkan') return;

    if (confirm('Apakah Anda yakin ingin menghapus penugasan ini? Tindakan ini tidak dapat dibatalkan.')) {
      try {
        const response = await fetch(`/api/penugasan/${penugasanId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Failed to delete penugasan');
        }

        // Redirect ke list penugasan setelah berhasil delete
        router.push('/views/spv/penugasan?success=Penugasan berhasil dihapus');
      } catch (err) {
        console.error('Failed to delete penugasan:', err);
        setError({
          message: 'Gagal menghapus penugasan',
          code: 'DELETE_ERROR'
        });
      }
    }
  };

  const handleComplete = async () => {
    if (!penugasan || !canCompletePenugasan(penugasan.status)) return;

    if (confirm('Apakah Anda yakin ingin menandai penugasan ini sebagai selesai?')) {
      try {
        const response = await fetch(`/api/penugasan/${penugasanId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Selesai' }),
        });

        if (!response.ok) {
          throw new Error('Failed to complete penugasan');
        }

        handleRefresh();
      } catch (err) {
        console.error('Failed to complete penugasan:', err);
        setError({
          message: 'Gagal menyelesaikan penugasan',
          code: 'UPDATE_ERROR'
        });
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!penugasan) return;

    // Create export data
    const exportData = {
      penugasan: {
        id: penugasan.id,
        judul: penugasan.judul,
        kategori: penugasan.kategori,
        status: penugasan.status,
        frekuensi_laporan: penugasan.frekuensi_laporan,
        start_date: penugasan.start_date,
        end_date: penugasan.end_date,
        lokasi: penugasan.lokasi,
        supervisor: penugasan.supervisor,
        created_at: penugasan.created_at
      },
      teknisi: penugasan.teknisi || [],
      alat: penugasan.alat || [],
      laporan_progres: penugasan.laporan_progres || []
    };

    // Convert to JSON and download
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `penugasan-${penugasan.id}-${penugasan.judul.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // TODO: Implementasi UI dengan proper layout sudah selesai
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton - responsive */}
        <div className="animate-pulse space-y-4">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
            <div className="space-y-1">
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="h-6 sm:h-8 bg-muted rounded w-48 sm:w-64"></div>
              <div className="flex flex-wrap gap-2">
                <div className="h-5 bg-muted rounded w-16"></div>
                <div className="h-5 bg-muted rounded w-20"></div>
                <div className="h-4 bg-muted rounded w-24"></div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="h-8 bg-muted rounded w-8"></div>
              <div className="h-8 bg-muted rounded w-12"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 sm:h-20 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 sm:p-6 text-center">
        <h3 className="text-base sm:text-lg font-medium text-destructive">Terjadi Kesalahan</h3>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={handleRefresh}
            className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
          >
            Coba Lagi
          </button>
          <button
            onClick={() => router.push('/views/spv/penugasan')}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Kembali ke List
          </button>
        </div>
      </div>
    );
  }

  if (!penugasan) {
    return (
      <div className="text-center py-12">
        <p className="text-sm sm:text-base text-muted-foreground">Data penugasan tidak ditemukan</p>
        <button
          onClick={() => router.push('/views/spv/penugasan')}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Kembali ke List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header dengan component */}
      <PenugasanDetailHeader
        penugasan={penugasan}
        onRefresh={handleRefresh}
        onCancel={handleCancel}
        onDelete={handleDelete}
        onComplete={handleComplete}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="grid w-full grid-cols-4 gap-2 rounded-lg p-2 mb-5 text-xs sm:text-sm bg-background">
          {[
            { value: 'overview', label: 'Overview', icon: '📊' },
            { value: 'teknisi', label: 'Teknisi', icon: '👥' },
            { value: 'alat', label: 'Alat', icon: '🔧' },
            { value: 'progress', label: 'Progress', icon: '📈' }
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex h-full flex-col items-center justify-center gap-1.5 rounded-md px-2 py-2 text-[12px] border border-accent sm:text-sm bg-popover hover:bg-accent/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="text-lg sm:hidden" aria-hidden>
                {tab.icon}
              </span>
              <span className="hidden sm:inline-block">{tab.label}</span>
              <span className="sm:hidden text-[11px] font-medium">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <PenugasanDetailOverview penugasan={penugasan} onEdit={handleEdit} />
        </TabsContent>

        {/* Teknisi Tab */}
        <TabsContent value="teknisi">
          <PenugasanDetailTeknisi
            penugasan={penugasan}
            onAssignTeknisi={handleAssignTeknisi}
            onRemoveTeknisi={handleRemoveTeknisi}
          />
        </TabsContent>        {/* Alat Tab */}
        <TabsContent value="alat">
          <PenugasanDetailAlat
            penugasan={penugasan}
            onAssignAlat={handleAssignAlat}
            onReturnAlat={handleReturnAlat}
          />
        </TabsContent>

        <TabsContent value="progress">
          <PenugasanDetailProgress
            penugasan={penugasan}
          />
        </TabsContent>
      </Tabs>

      <AssignTeknisiDialog
        penugasanId={penugasan.id}
        open={showAssignTeknisi}
        onOpenChange={(open) => setShowAssignTeknisi(open)}
        onSuccess={handleRefresh}
        excludeTeknisiIds={(penugasan.teknisi || []).map((teknisi) => teknisi.teknisi_id).filter(Boolean) as string[]}
      />
      <AssignAlatDialog
        penugasanId={penugasan.id}
        open={showAssignAlat}
        onOpenChange={(open) => setShowAssignAlat(open)}
        onSuccess={handleRefresh}
      />
      {/* EditPenugasanDialog akan diimplementasi sebagai komponen terpisah */}
    </div>
  );
}
