'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PenugasanWithRelations, PenugasanError } from '@/lib/penugasan/types';
import { PENUGASAN_STATUS, PENUGASAN_KATEGORI } from '@/lib/penugasan/constants';
import { PenugasanDetailHeaderManager } from "@/components/penugasan/detail-penugasan/penugasan-detail-header-manager";
import { PenugasanDetailOverview } from "@/components/penugasan/detail-penugasan/penugasan-detail-overview";
import { PenugasanDetailTeknisi } from "@/components/penugasan/detail-penugasan/penugasan-detail-teknisi";
import { PenugasanDetailAlat } from "@/components/penugasan/detail-penugasan/penugasan-detail-alat";
import { PenugasanDetailProgressManager } from "@/components/penugasan/detail-penugasan/penugasan-detail-progress-manager";

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

  // Data fetching dengan proper error handling
  useEffect(() => {
    const fetchPenugasanDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/manager/penugasan/${penugasanId}?include=supervisor,teknisi,alat,laporan_progres`);

        if (!response.ok) {
          if (response.status === 404) {
            router.push('/views/manager/penugasan?error=Penugasan tidak ditemukan');
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
          message: err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data penugasan',
          code: 'FETCH_ERROR'
        });
      } finally {
        setLoading(false);
      }
    };

    if (penugasanId) {
      fetchPenugasanDetail();
    }
  }, [penugasanId, refreshTrigger, router]);

  // Action handlers - Manager hanya bisa view, tidak ada action
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Fitur export akan segera hadir');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-muted rounded mb-6"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Error</h2>
          <p className="text-destructive">{error.message}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!penugasan) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-muted p-6 text-center">
          <p className="text-muted-foreground">Penugasan tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header dengan component khusus manager */}
      <PenugasanDetailHeaderManager
        penugasan={penugasan}
        onRefresh={handleRefresh}
      />

      {/* Tabs untuk detail penugasan */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teknisi">Teknisi</TabsTrigger>
          <TabsTrigger value="alat">Alat</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <PenugasanDetailOverview penugasan={penugasan} />
        </TabsContent>

        <TabsContent value="teknisi" className="mt-6">
          <PenugasanDetailTeknisi 
            penugasan={penugasan} 
            onAssignTeknisi={() => {}} 
            onRemoveTeknisi={() => {}} 
          />
        </TabsContent>

        <TabsContent value="alat" className="mt-6">
          <PenugasanDetailAlat 
            penugasan={penugasan} 
            onAssignAlat={() => {}} 
            onReturnAlat={() => {}} 
          />
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <PenugasanDetailProgressManager penugasan={penugasan} />
        </TabsContent>
      </Tabs>
    </div>
  );
}