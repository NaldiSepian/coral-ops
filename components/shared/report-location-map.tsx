"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import untuk MapComponent
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";
import { Button } from "../ui/button";
import { MapPin } from "lucide-react";

const DEFAULT_ICON_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png";
const DEFAULT_RETINA_ICON_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png";
const DEFAULT_SHADOW_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png";

interface ReportLocationMapProps {
  reportPosition: [number, number];
  assignmentPosition?: [number, number];
}

export function ReportLocationMap({
  reportPosition,
  assignmentPosition,
}: ReportLocationMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fix marker icon paths for Leaflet in client-side
  useEffect(() => {
    if (isClient) {
      import("leaflet").then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: DEFAULT_RETINA_ICON_URL,
          iconUrl: DEFAULT_ICON_URL,
          shadowUrl: DEFAULT_SHADOW_URL,
        });
      });
    }
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative z-10">
      <MapContainer
        center={reportPosition}
        zoom={15}
        style={{ height: "300px", width: "100%" }}
        className="rounded-lg"
        zoomControl={true}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <Marker position={reportPosition}>
          <Popup>
            <div className="text-sm">
              <p>
                <strong>Lokasi Laporan</strong>
              </p>
              <p>Lat: {reportPosition[0].toFixed(6)}</p>
              <p>Lng: {reportPosition[1].toFixed(6)}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => {
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${reportPosition[0]},${reportPosition[1]}`;
                  window.open(mapsUrl, "_blank");
                }}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Buka di Maps
              </Button>
            </div>
          </Popup>
        </Marker>
        {assignmentPosition && (
          <Marker position={assignmentPosition}>
            <Popup>
              <div className="text-sm">
                <p>
                  <strong>Lokasi Penugasan</strong>
                </p>
                <p>Lat: {assignmentPosition[0].toFixed(6)}</p>
                <p>Lng: {assignmentPosition[1].toFixed(6)}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => {
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${assignmentPosition[0]},${assignmentPosition[1]}`;
                    window.open(mapsUrl, "_blank");
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Buka di Maps
                </Button>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
