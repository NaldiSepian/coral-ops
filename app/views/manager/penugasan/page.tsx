'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PenugasanListItem, PenugasanFilters, StatusPenugasan, KategoriPenugasan } from '@/lib/penugasan/types';
import { PENUGASAN_STATUS, PENUGASAN_KATEGORI } from '@/lib/penugasan/constants';

export default function PenugasanPage() {
  const [penugasanData, setPenugasanData] = useState<PenugasanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Partial<PenugasanFilters>>({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, hasMore: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid'>('grid');

  const router = useRouter();

  useEffect(() => {
    const fetchPenugasan = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          search: searchQuery,
          sortBy,
          sortOrder,
          ...Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
          )
        });

        const response = await fetch(`/api/manager/penugasan?${params}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPenugasanData(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.total || 0,
          hasMore: data.hasMore || false
        }));
      } catch (err) {
        console.error('Failed to fetch penugasan:', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data');
        setPenugasanData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPenugasan();
  }, [pagination.page, searchQuery, filters, sortBy, sortOrder]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (newFilters: Partial<PenugasanFilters>) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleViewDetail = (id: number) => {
    router.push(`/views/manager/penugasan/${id}`);
  };

  const handleRefresh = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActiveAlatCount = (item: PenugasanListItem) => {
    if (!item.alat || !Array.isArray(item.alat)) return 0;
    
    // Hitung semua alat yang di-assign (tanpa memperdulikan status return)
    return item.alat.length;
  };

  // Calculate stats dari penugasanData array (current page only)
  const stats = {
    total: pagination.total,
    aktif: penugasanData.filter(item => item.status === 'Aktif').length,
    selesai: penugasanData.filter(item => item.status === 'Selesai').length,
    dibatalkan: penugasanData.filter(item => item.status === 'Dibatalkan').length,
  };

  return (
    <div className="space-y-6">
      {/* Header dengan title dan stats */}
      <div className="flex flex-col space-y-4 xl:flex-row xl:items-center xl:justify-between xl:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Penugasan</h1>
          <p className="text-muted-foreground">Pantau semua penugasan teknisi</p>
        </div>
      </div>

      {/* Quick stats cards - responsive: Mobile 1+2x2, Desktop 1x5 */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-5">
        {/* Total - full width on mobile/tablet, 1 column on desktop */}
        <div className="rounded-lg border p-4 text-center lg:col-span-1">
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-sm text-muted-foreground">Total Penugasan</p>
        </div>

        {/* Sisanya dalam 2x2 grid pada mobile/tablet, masing-masing 1 kolom pada desktop */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 lg:col-span-4">
          <div className="rounded-lg border p-4 text-center">
            <div className="text-xl font-bold text-blue-600">{stats.aktif}</div>
            <p className="text-sm text-muted-foreground">Aktif</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-xl font-bold text-green-600">{stats.selesai}</div>
            <p className="text-sm text-muted-foreground">Selesai</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-xl font-bold text-red-600">{stats.dibatalkan}</div>
            <p className="text-sm text-muted-foreground">Dibatalkan</p>
          </div>
        </div>
      </div>

      {/* Filters dan search bar - responsive */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-row gap-2 flex-1 overflow-x-auto">
          {/* Search input */}
          <input
            type="text"
            placeholder="Cari penugasan..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 min-w-0 rounded-md border px-3 py-2 text-sm"
          />

          {/* Status filter dropdown */}
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange({ ...filters, status: e.target.value as StatusPenugasan || undefined })}
            className="rounded-md border px-2 py-2 text-sm min-w-0 w-32 sm:w-auto xl:w-48"
          >
            <option value="">Status</option>
            <option value="Aktif">{PENUGASAN_STATUS.AKTIF}</option>
            <option value="Selesai">{PENUGASAN_STATUS.SELESAI}</option>
            <option value="Dibatalkan">{PENUGASAN_STATUS.DIBATALKAN}</option>
          </select>

          {/* Kategori filter dropdown */}
          <select
            value={filters.kategori || ''}
            onChange={(e) => handleFilterChange({ ...filters, kategori: e.target.value as KategoriPenugasan || undefined })}
            className="rounded-md border px-2 py-2 text-sm min-w-0 w-32 sm:w-auto xl:w-48"
          >
            <option value="">Kategori</option>
            <option value="Rekonstruksi">{PENUGASAN_KATEGORI.REKONSTRUKSI}</option>
            <option value="Instalasi">{PENUGASAN_KATEGORI.INSTALASI}</option>
            <option value="Perawatan">{PENUGASAN_KATEGORI.PERAWATAN}</option>
          </select>
        </div>

        {/* View controls - removed table view */}
        <div className="flex gap-2 self-start xl:self-center">
          <button
            onClick={handleRefresh}
            className="p-2 rounded bg-muted hover:bg-muted/80"
            title="Refresh"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Data display */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <p>Terjadi kesalahan: {error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {penugasanData.length > 0 ? (
              <div className="space-y-4">
                {penugasanData.map((item) => (
                  <div key={item.id} className="rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left side - Title and badges */}
                      <div className="flex-1 space-y-2">
                        <h3 className="font-medium text-lg">{item.judul}</h3>
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            item.status === 'Aktif' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'Selesai' ? 'bg-green-100 text-green-800' :
                            item.status === 'Dibatalkan' ? 'bg-red-100 text-red-800' :
                            item.status === 'Menunggu Validasi' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            item.kategori === 'Rekonstruksi' ? 'bg-orange-100 text-orange-800' :
                            item.kategori === 'Instalasi' ? 'bg-purple-100 text-purple-800' :
                            'bg-cyan-100 text-cyan-800'
                          }`}>
                            {item.kategori}
                          </span>
                        </div>
                      </div>

                      {/* Center - Date and supervisor info */}
                      <div className="flex-1 space-y-1 text-sm text-muted-foreground">
                        <div className="flex flex-col sm:flex-row sm:gap-4">
                          <span>Mulai: {new Date(item.start_date).toLocaleDateString('id-ID')}</span>
                          {item.end_date && <span>Selesai: {new Date(item.end_date).toLocaleDateString('id-ID')}</span>}
                        </div>
                        {item.supervisor && <div>Supervisor: {item.supervisor.nama}</div>}
                      </div>

                      {/* Right side - Stats and action */}
                      <div className="flex items-center justify-between lg:justify-end gap-6">
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">{item.teknisi?.[0]?.count || 0}</span>
                            <span>Teknisi</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">{getActiveAlatCount(item)}</span>
                            <span>Alat</span>
                          </span>
                        </div>

                        <button
                          onClick={() => handleViewDetail(item.id)}
                          className="px-4 py-2 text-sm rounded border hover:bg-muted transition-colors"
                        >
                          Lihat Detail
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Tidak ada penugasan ditemukan</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Halaman {pagination.page} dari {Math.ceil(pagination.total / pagination.limit)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="rounded border px-3 py-1 disabled:opacity-50 hover:bg-muted"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
              className="rounded border px-3 py-1 disabled:opacity-50 hover:bg-muted"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}