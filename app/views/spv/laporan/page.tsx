"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import ValidasiLaporanPage from "./validasi/page";
import RiwayatLaporanPage from "./riwayat/page";

export default function LaporanTeknisiPage() {
  const [stats, setStats] = useState({ pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/supervisor/laporan-validasi?status=Menunggu");
        const data = await response.json();
        if (response.ok) {
          setStats({ pending: data.stats?.pending || 0 });
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Laporan Progres Teknisi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Validasi dan monitor laporan dari teknisi lapangan
        </p>
      </header>

      <Tabs defaultValue="validasi" className="w-full">
        <TabsList>
          <TabsTrigger value="validasi" className="relative">
            Validasi Laporan
            {!loading && stats.pending > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="validasi" className="mt-6">
          <ValidasiLaporanPage />
        </TabsContent>

        <TabsContent value="riwayat" className="mt-6">
          <RiwayatLaporanPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}