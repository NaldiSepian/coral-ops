import { PenugasanWithRelations } from "@/lib/penugasan/types";
import { canEditPenugasan } from "@/lib/penugasan/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PencilLine } from "lucide-react";

// Dynamic import untuk MapComponent
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

const DEFAULT_ICON_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png';
const DEFAULT_RETINA_ICON_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png';
const DEFAULT_SHADOW_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

interface PenugasanDetailOverviewProps {
  penugasan: PenugasanWithRelations;
  onEdit?: () => void;
}

const HEX_STRING_REGEX = /^[0-9a-fA-F]+$/;

// Minimal EWKB parser for POINT geometries (SRID optional)
function parseWkbPoint(hexString: string): [number, number] | null {
  const normalized = hexString?.trim();
  if (!normalized || normalized.length < 34 || normalized.length % 2 !== 0) {
    return null;
  }

  if (!HEX_STRING_REGEX.test(normalized)) {
    return null;
  }

  try {
    const buffer = new ArrayBuffer(normalized.length / 2);
    const bytes = new Uint8Array(buffer);

    for (let i = 0; i < normalized.length; i += 2) {
      bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
    }

    const view = new DataView(buffer);
    const littleEndian = view.getUint8(0) === 1;
    let offset = 1;

    const type = view.getUint32(offset, littleEndian);
    offset += 4;

    const hasSrid = (type & 0x20000000) !== 0;
    const geometryType = type & 0xFF;
    if (geometryType !== 1) {
      return null;
    }

    if (hasSrid) {
      offset += 4; // Skip SRID
    }

    if (offset + 16 > view.byteLength) {
      return null;
    }

    const longitude = view.getFloat64(offset, littleEndian);
    offset += 8;
    const latitude = view.getFloat64(offset, littleEndian);

    return [latitude, longitude];
  } catch (error) {
    console.warn('Failed to parse WKB location value', error);
    return null;
  }
}

// Komponen Map untuk menampilkan lokasi (readonly)
function LocationMap({ position }: { position: [number, number] }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={position}
      zoom={15}
      style={{ height: '250px', width: '100%' }}
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
      <Marker position={position}>
        <Popup>
          <div className="text-sm">
            <p><strong>Lokasi Penugasan</strong></p>
            <p>Latitude: {position[0].toFixed(6)}</p>
            <p>Longitude: {position[1].toFixed(6)}</p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}

export function PenugasanDetailOverview({ penugasan, onEdit }: PenugasanDetailOverviewProps) {
  const canEdit = canEditPenugasan(penugasan.status);

  // Fix marker icon paths for Leaflet in client-side
  useEffect(() => {
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: DEFAULT_RETINA_ICON_URL,
        iconUrl: DEFAULT_ICON_URL,
        shadowUrl: DEFAULT_SHADOW_URL,
      });
    });
  }, []);

  // Parse koordinat dari berbagai format yang mungkin dikembalikan oleh Supabase/PostGIS
  const parseLocation = (locationData: any): [number, number] | null => {
    if (!locationData) return null;

    // Jika sudah dalam format string POINT(longitude latitude)
    if (typeof locationData === 'string') {
      // Handle EWKB hex string directly from geography column
      if (HEX_STRING_REGEX.test(locationData.trim())) {
        const coords = parseWkbPoint(locationData);
        if (coords) {
          return coords;
        }
      }

      // Handle EWKT format: SRID=4326;POINT(longitude latitude)
      if (locationData.includes('SRID=')) {
        const wktPart = locationData.split(';')[1];
        if (wktPart) {
          const match = wktPart.match(/POINT\(([^ ]+) ([^)]+)\)/);
          if (match) {
            const longitude = parseFloat(match[1]);
            const latitude = parseFloat(match[2]);
            return [latitude, longitude]; // Return sebagai [lat, lng] untuk Leaflet
          }
        }
      }

      // Handle regular WKT format
      const match = locationData.match(/POINT\(([^ ]+) ([^)]+)\)/);
      if (match) {
        const longitude = parseFloat(match[1]);
        const latitude = parseFloat(match[2]);
        return [latitude, longitude]; // Return sebagai [lat, lng] untuk Leaflet
      }

      // Jika dalam format GeoJSON string dari ST_AsGeoJSON
      try {
        const geoJson = JSON.parse(locationData);
        if (geoJson.type === 'Point' && Array.isArray(geoJson.coordinates) && geoJson.coordinates.length === 2) {
          const [longitude, latitude] = geoJson.coordinates;
          if (typeof longitude === 'number' && typeof latitude === 'number') {
            return [latitude, longitude]; // Return sebagai [lat, lng] untuk Leaflet
          }
        }
      } catch (e) {
        // Not GeoJSON, continue
      }
    }

    // Jika dalam format objek PostGIS (dari Supabase)
    if (typeof locationData === 'object' && locationData.coordinates) {
      // PostGIS format: { type: "Point", coordinates: [longitude, latitude] }
      const [longitude, latitude] = locationData.coordinates;
      if (typeof longitude === 'number' && typeof latitude === 'number') {
        return [latitude, longitude]; // Return sebagai [lat, lng] untuk Leaflet
      }
    }

    // Jika dalam format array [longitude, latitude]
    if (Array.isArray(locationData) && locationData.length === 2) {
      const [longitude, latitude] = locationData;
      if (typeof longitude === 'number' && typeof latitude === 'number') {
        return [latitude, longitude]; // Return sebagai [lat, lng] untuk Leaflet
      }
    }

    return null;
  };

  // Convert location data to display format POINT(longitude latitude)
  const getLocationDisplayText = (locationData: any): string => {
    if (!locationData) return 'Lokasi tidak ditentukan';

    if (typeof locationData === 'string') {
      if (HEX_STRING_REGEX.test(locationData.trim())) {
        const coords = parseWkbPoint(locationData);
        if (coords) {
          const [lat, lng] = coords;
          return `POINT(${lng.toFixed(6)} ${lat.toFixed(6)})`;
        }
      }

      // Handle EWKT format: SRID=4326;POINT(longitude latitude)
      if (locationData.includes('SRID=')) {
        const wktPart = locationData.split(';')[1];
        if (wktPart) return wktPart;
      }
      // Return as is if it's already WKT
      return locationData;
    }

    // For other formats, parse and format
    const coords = parseLocation(locationData);
    if (coords) {
      const [lat, lng] = coords;
      return `POINT(${lng.toFixed(6)} ${lat.toFixed(6)})`;
    }
    return 'Lokasi tidak ditentukan';
  };

  const locationCoords = parseLocation(penugasan.lokasi_text || penugasan.lokasi);
  const alatCount = penugasan.alat ? new Set(penugasan.alat.map((item) => item.alat_id)).size : 0;

  return (
    <>
      {/* Statistics cards - responsive */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-lg border p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold">{penugasan.teknisi?.length || 0}</div>
          <p className="text-xs sm:text-sm text-muted-foreground">Teknisi</p>
        </div>
        <div className="rounded-lg border p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold">{alatCount}</div>
          <p className="text-xs sm:text-sm text-muted-foreground">Alat</p>
        </div>
        <div className="rounded-lg border p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold">{penugasan.laporan_progres?.length || 0}</div>
          <p className="text-xs sm:text-sm text-muted-foreground">Laporan</p>
        </div>
        <div className="rounded-lg border p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold">
            {penugasan.end_date ?
              Math.max(0, Math.ceil((new Date(penugasan.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) :
              '∞'
            }
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Hari</p>
        </div>
      </div>

      {/* Detail Penugasan - responsive */}
      <div className="rounded-lg border p-4 sm:p-6 mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base sm:text-lg font-medium">Detail Penugasan</h2>
          {canEdit && onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit} className="self-start">
              <PencilLine className="mr-2 h-4 w-4" />
              Edit Penugasan
            </Button>
          )}
        </div>
        <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Supervisor</label>
            <p className="text-sm text-muted-foreground mt-1">{penugasan.supervisor?.nama || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Frekuensi Laporan</label>
            <p className="text-sm text-muted-foreground mt-1">{penugasan.frekuensi_laporan}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Tanggal Mulai</label>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(penugasan.start_date).toLocaleDateString('id-ID')}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Tanggal Selesai</label>
            <p className="text-sm text-muted-foreground mt-1">
              {penugasan.end_date ? new Date(penugasan.end_date).toLocaleDateString('id-ID') : 'Tidak ditentukan'}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Lokasi</label>
            <p className="text-sm text-muted-foreground mt-1 break-words">
              {getLocationDisplayText(penugasan.lokasi_text || penugasan.lokasi)}
            </p>
            {/* Tampilkan map jika koordinat tersedia */}
            {locationCoords ? (
              <div className="mt-3">
                <LocationMap position={locationCoords} />
              </div>
            ) : (
              <div className="mt-3 p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Map tidak dapat ditampilkan - koordinat tidak valid
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Format yang diharapkan: POINT(longitude latitude)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}