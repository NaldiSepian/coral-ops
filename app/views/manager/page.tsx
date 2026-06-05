"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  UserCheck,
  UserX,
  Wrench,
  ClipboardList,
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle,
  Package
} from "lucide-react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";

interface ManagerDashboardStats {
  totalTechnicians: number;
  activeTechnicians: number;
  inactiveTechnicians: number;
  totalEquipment: number;
  equipmentInUse: number;
  equipmentTotal: number;
  totalAssignments: number;
  activeAssignments: number;
  completedAssignments: number;
  totalReports: number;
  pendingReports: number;
  approvedReports: number;
  rejectedReports: number;
}

export default function ManagerViews() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [stats, setStats] = useState<ManagerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all required data in parallel - Manager sees ALL data
      const [
        usersRes,
        equipmentRes,
        assignmentsRes,
        reportsRes
      ] = await Promise.all([
        fetch("/api/supervisor/users"), // Get all users
        fetch("/api/alat"),
        fetch("/api/manager/penugasan"), // Manager endpoint untuk semua penugasan
        fetch("/api/manager/laporan") // Manager endpoint untuk semua laporan
      ]);

      if (!usersRes.ok || !equipmentRes.ok || !assignmentsRes.ok || !reportsRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [usersData, equipmentData, assignmentsData, reportsData] = await Promise.all([
        usersRes.json(),
        equipmentRes.json(),
        assignmentsRes.json(),
        reportsRes.json()
      ]);

      // Get all technicians
      const technicians = usersData.data || [];
      const totalTechnicians = technicians.length;

      // Process assignments data
      const assignments = assignmentsData.data || [];
      const totalAssignments = assignments.length;
      const activeAssignments = assignments.filter((a: any) => a.status === "Aktif").length;
      const completedAssignments = assignments.filter((a: any) => a.status === "Selesai").length;

      // Calculate active technicians from active assignments
      const activeTechniciansSet = new Set();
      const { data: penugasanTeknisi } = await supabase
        .from('penugasan_teknisi')
        .select('teknisi_id, penugasan:penugasan!inner(status)')
        .eq('penugasan.status', 'Aktif')
        .eq('penugasan.is_deleted', false);

      if (penugasanTeknisi) {
        penugasanTeknisi.forEach((pt: any) => {
          activeTechniciansSet.add(pt.teknisi_id);
        });
      }

      const activeTechniciansCount = activeTechniciansSet.size;
      const inactiveTechniciansCount = totalTechnicians - activeTechniciansCount;

      // Process equipment data
      const equipment = equipmentData.data || [];
      const totalEquipment = equipment.length;
      const equipmentInUse = equipment.reduce((sum: number, item: any) => 
        sum + (item.stok_total - item.stok_tersedia), 0
      );
      const equipmentTotal = equipment.reduce((sum: number, item: any) => 
        sum + item.stok_total, 0
      );

      // Process reports data
      const reports = reportsData.data || [];
      const totalReports = reports.length;
      const pendingReports = reports.filter((r: any) => r.status_validasi === "Menunggu").length;
      const approvedReports = reports.filter((r: any) => r.status_validasi === "Disetujui").length;
      const rejectedReports = reports.filter((r: any) => r.status_validasi === "Ditolak").length;

      setStats({
        totalTechnicians,
        activeTechnicians: activeTechniciansCount,
        inactiveTechnicians: inactiveTechniciansCount,
        totalEquipment,
        equipmentInUse,
        equipmentTotal,
        totalAssignments,
        activeAssignments,
        completedAssignments,
        totalReports,
        pendingReports,
        approvedReports,
        rejectedReports
      });

      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const handleRefresh = () => {
    fetchDashboardStats();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        title="Dashboard Manager"
        subtitle="Monitoring Operasional"
        description="Pantau performa keseluruhan, efisiensi, dan metrik kunci operasional"
        loading={loading}
        onRefresh={handleRefresh}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Grid */}
      {!loading && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Team Overview */}
          <StatCard
            title="Tim Teknisi"
            icon={Users}
            color="blue"
            stats={[
              { label: "Teknisi", value: stats.totalTechnicians },
              { label: "Aktif", value: stats.activeTechnicians, icon: UserCheck, iconColor: "text-primary" },
              { label: "Idle", value: stats.inactiveTechnicians, icon: UserX, iconColor: "text-secondary" }
            ]}
          />

          {/* Equipment Management */}
          <StatCard
            title="Inventaris Alat"
            icon={Wrench}
            color="orange"
            stats={[
              { label: "Alat", value: stats.totalEquipment },
              { label: "Sedang Dipakai", value: stats.equipmentInUse, icon: Wrench, iconColor: "text-primary" },
              { label: "Total Stok", value: stats.equipmentTotal, icon: Package, iconColor: "text-secondary" }
            ]}
          />

          {/* Assignment Performance */}
          <StatCard
            title="Penugasan Kerja"
            icon={ClipboardList}
            color="purple"
            stats={[
              { label: "Penugasan", value: stats.totalAssignments },
              { label: "Aktif", value: stats.activeAssignments, icon: Clock, iconColor: "text-primary" },
              { label: "Selesai", value: stats.completedAssignments, icon: CheckCircle, iconColor: "text-secondary" }
            ]}
          />

          {/* Report Analytics */}
          <StatCard
            title="Laporan Progres"
            icon={FileText}
            color="green"
            stats={[
              { label: "Laporan", value: stats.totalReports },
              { label: "Menunggu", value: stats.pendingReports, icon: Clock, iconColor: "text-primary" },
              { label: "Disetujui", value: stats.approvedReports, icon: CheckCircle, iconColor: "text-secondary" },
              { label: "Ditolak", value: stats.rejectedReports, icon: AlertTriangle, iconColor: "text-destructive" }
            ]}
          />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-3 sm:p-4">
              <div className="animate-pulse space-y-2 sm:space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && !loading && (
        <div className="text-center text-sm text-muted-foreground">
          Terakhir diperbarui: {new Date(lastUpdated).toLocaleString("id-ID")}
        </div>
      )}
    </div>
  );
}
