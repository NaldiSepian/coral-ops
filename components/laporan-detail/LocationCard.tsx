import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { parseLocation, calculateDistance, getLocationDisplayText } from "@/lib/utils/location";
import { ReportLocationMap } from "@/components/shared/report-location-map";
import { LaporanDetail, AssignmentDetail } from "./types";

interface LocationCardProps {
  laporan: LaporanDetail;
  assignment?: AssignmentDetail;
}

export default function LocationCard({ laporan, assignment }: LocationCardProps) {
  const reportPosition = laporan.titik_gps ? parseLocation(laporan.titik_gps) : null;
  const assignmentPosition = assignment?.lokasi ? parseLocation(assignment.lokasi) : null;

  const locationValidation = reportPosition && assignmentPosition ? (() => {
    const distance = calculateDistance(
      reportPosition[0], reportPosition[1],
      assignmentPosition[0], assignmentPosition[1]
    );
    const isValid = distance <= 5000; // Within 5km (5000 meters)
    const message = isValid
      ? `Lokasi valid (${distance.toFixed(2)}km dari lokasi penugasan)`
      : `Lokasi laporan ${distance.toFixed(2)}km dari lokasi penugasan (maksimal 5km)`;
    return { distance, isValid, message };
  })() : null;

  if (!reportPosition && !assignmentPosition) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Informasi Lokasi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">Lokasi Laporan</p>
            <p className="text-sm text-muted-foreground font-mono">
              {getLocationDisplayText(laporan.titik_gps)}
            </p>
          </div>
          {assignmentPosition && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Lokasi Penugasan</p>
              <p className="text-sm text-muted-foreground font-mono">
                {getLocationDisplayText(assignment?.lokasi)}
              </p>
            </div>
          )}
        </div>

        {locationValidation && (
          <div className={`p-3 rounded-lg border flex items-center gap-2 ${
            locationValidation.isValid
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            {locationValidation.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm font-medium">
              {locationValidation.message}
            </span>
          </div>
        )}

        {reportPosition && (
          <ReportLocationMap
            reportPosition={reportPosition}
            assignmentPosition={assignmentPosition || undefined}
          />
        )}
      </CardContent>
    </Card>
  );
}