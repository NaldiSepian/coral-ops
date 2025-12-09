"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface PendingStats {
  total_pending: number;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<PendingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/manager/penugasan-final-validasi?limit=1", {
        cache: "no-store"
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal memuat statistik");
      }

      setStats(data.stats || { total_pending: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Manager</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview penugasan dan status validasi
        </p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pending Validasi Card */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Penugasan Menunggu Final Validasi</h2>
              <p className="text-sm text-muted-foreground">
                Penugasan yang siap untuk final review dan approval
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Badge variant="default" className="text-base px-3 py-1">
                  {stats?.total_pending || 0} Penugasan
                </Badge>
                {(stats?.total_pending || 0) === 0 && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
            <div>
              <Link href="/views/manager/penugasan-final-validasi">
                <Button size="lg" className="gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Lihat Penugasan
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-xs text-blue-700 font-medium mb-2">Total Penugasan Aktif</div>
          <div className="text-2xl font-bold text-blue-900">-</div>
          <p className="text-xs text-blue-600 mt-2">Menunggu data</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-xs text-green-700 font-medium mb-2">Penugasan Selesai</div>
          <div className="text-2xl font-bold text-green-900">-</div>
          <p className="text-xs text-green-600 mt-2">Menunggu data</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-xs text-purple-700 font-medium mb-2">Penugasan Ditolak</div>
          <div className="text-2xl font-bold text-purple-900">-</div>
          <p className="text-xs text-purple-600 mt-2">Menunggu data</p>
        </Card>
      </div>
    </section>
  );
}