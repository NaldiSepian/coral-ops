"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Wrench, Edit, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { EditAlatDialog } from "./edit-alat-dialog";

interface Alat {
  id: number;
  nama: string;
  tipe_alat?: string;
  deskripsi?: string;
  foto_url?: string;
  stok_total: number;
  stok_tersedia: number;
  created_at: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface AlatListProps {
  refreshTrigger?: number;
}

export function AlatList({ refreshTrigger }: AlatListProps) {
  const [alat, setAlat] = useState<Alat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingAlat, setEditingAlat] = useState<Alat | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deletingAlat, setDeletingAlat] = useState<Alat | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false
  });

  const fetchAlat = async (searchTerm = "", offset = 0) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString()
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/alat?${params}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch inventory");
      }

      const data = await response.json();
      setAlat(data.data || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch inventory");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlat(search, pagination.offset);
  }, [refreshTrigger]);

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchAlat(value, 0); // Reset to first page when searching
  };

  const handleEditAlat = (alat: Alat) => {
    setEditingAlat(alat);
    setEditDialogOpen(true);
  };

  const handleAlatUpdated = (updatedAlat: Alat) => {
    setAlat(prev => prev.map(item =>
      item.id === updatedAlat.id ? updatedAlat : item
    ));
  };

  const handleDeleteAlat = (alat: Alat) => {
    setDeletingAlat(alat);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAlat = async () => {
    if (!deletingAlat) return;

    try {
      const response = await fetch(`/api/alat/${deletingAlat.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete alat");
      }

      setAlat(prev => prev.filter(item => item.id !== deletingAlat.id));
      setDeleteDialogOpen(false);
      setDeletingAlat(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete alat");
    }
  };

  const handlePageChange = (newOffset: number) => {
    fetchAlat(search, newOffset);
  };

  const getStatusBadge = (alat: Alat) => {
    if (alat.stok_tersedia === 0) {
      return <Badge variant="destructive">Habis</Badge>;
    } else if (alat.stok_tersedia < alat.stok_total * 0.2) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Stok Rendah</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Tersedia</Badge>;
    }
  };

  if (isLoading && alat.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari alat..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {alat.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada alat terdaftar</p>
              <p className="text-sm">Tambah alat pertama untuk memulai inventaris</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {alat.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                {/* Foto Alat */}
                {item.foto_url ? (
                  <div className="relative w-full aspect-square bg-muted overflow-hidden">
                    <img
                      src={item.foto_url}
                      alt={item.nama}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-muted flex items-center justify-center">
                    <Wrench className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-2">{item.nama}</CardTitle>
                      {item.tipe_alat && (
                        <p className="text-xs text-muted-foreground mt-1">{item.tipe_alat}</p>
                      )}
                      {getStatusBadge(item)}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAlat(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAlat(item)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    {item.deskripsi && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.deskripsi}</p>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-semibold text-primary">{item.stok_total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tersedia:</span>
                        <span className={`font-semibold ${item.stok_tersedia === 0 ? 'text-destructive' : 'text-secondary'}`}>
                          {item.stok_tersedia}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-secondary rounded-full h-2 transition-all"
                          style={{ width: `${(item.stok_tersedia / item.stok_total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Menampilkan {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} dari {pagination.total} alat
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                  disabled={pagination.offset === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                  disabled={!pagination.hasMore}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <EditAlatDialog
        alat={editingAlat}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onAlatUpdated={handleAlatUpdated}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Alat</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus alat "{deletingAlat?.nama}"?
              {deletingAlat && deletingAlat.stok_tersedia < deletingAlat.stok_total && (
                <span className="block mt-2 text-yellow-600 font-medium">
                  ⚠️ Alat ini sedang dipinjam ({deletingAlat.stok_total - deletingAlat.stok_tersedia} unit).
                  Pastikan semua peminjaman sudah dikembalikan sebelum menghapus.
                </span>
              )}
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAlat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}