"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LaporanDetail from "@/components/teknisi/laporan-detail";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { LaporanDetail as LaporanDetailType, LaporanDetailResponse } from "@/lib/penugasan/types";
import { parseLocation, calculateDistance } from "@/lib/utils/location";

export default function ProgressReportDetail() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  const supabase = useMemo(() => createSupabaseClient(), []);

  const [report, setReport] = useState<LaporanDetailType | null>(null);
  const [assignment, setAssignment] = useState<LaporanDetailResponse['data']['assignment'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportDetail = useCallback(async () => {
    if (!reportId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/teknisi/laporan/${reportId}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error((payload as any).error || "Gagal memuat detail laporan");
      }

      const typedPayload = payload as LaporanDetailResponse;
      const reportData = typedPayload.data.report;
      const assignmentData = typedPayload.data.assignment;
      setReport(reportData);
      setAssignment(assignmentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat laporan");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchReportDetail();
  }, [fetchReportDetail]);

  // Parse report location from titik_gps or lat/lng
  const reportPosition = useMemo(() => {
    if (!report) return null;

    // First try titik_gps
    if (report.titik_gps) {
      return parseLocation(report.titik_gps);
    }

    // Fallback to lat/lng
    if (report.latitude !== null && report.longitude !== null) {
      return [report.latitude, report.longitude] as [number, number];
    }

    return null;
  }, [report]);

  // Parse assignment location
  const assignmentPosition = useMemo(() => {
    if (!assignment?.lokasi) return null;
    return parseLocation(assignment.lokasi);
  }, [assignment]);

  // Validate report location
  const validateReportLocation = useMemo(() => {
    if (!reportPosition || !assignmentPosition) return null;

    const distance = calculateDistance(
      reportPosition[0], reportPosition[1],
      assignmentPosition[0], assignmentPosition[1]
    );

    return {
      distance,
      isValid: distance <= 5, // 5km max distance
      message: distance > 5
        ? `Lokasi laporan ${distance.toFixed(2)}km dari lokasi penugasan (maksimal 5km)`
        : `Lokasi valid (${distance.toFixed(2)}km dari lokasi penugasan)`
    };
  }, [reportPosition, assignmentPosition]);

  return (
    <LaporanDetail
      report={report}
      assignment={assignment}
      loading={loading}
      error={error}
      reportPosition={reportPosition}
      assignmentPosition={assignmentPosition}
      locationValidation={validateReportLocation}
      onRetry={fetchReportDetail}
      onBack={() => router.back()}
    />
  );
}
