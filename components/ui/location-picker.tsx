// Location Picker Component using Esri World Imagery + Leaflet
// =============================================================================
// Features:
// - Interactive map dengan marker yang bisa di-drag
// - Click to place marker
// - Get coordinates dari marker position
// - Reverse geocoding (optional)
// - Modal dialog untuk selection
// =============================================================================

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Search } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import untuk menghindari SSR issues dengan Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix untuk default marker icon di Leaflet dengan Next.js
import L from 'leaflet';

// Fix marker icon paths - menggunakan CDN URLs untuk menghindari Next.js static asset issues
const DEFAULT_ICON_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png';
const DEFAULT_RETINA_ICON_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png';
const DEFAULT_SHADOW_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

// Fix marker icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: DEFAULT_RETINA_ICON_URL,
  iconUrl: DEFAULT_ICON_URL,
  shadowUrl: DEFAULT_SHADOW_URL,
});

// Multiple attempt configs to reduce GPS timeouts
const GEOLOCATION_ATTEMPTS = [
  { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
  { enableHighAccuracy: false, timeout: 7000, maximumAge: 180000 },
  { enableHighAccuracy: true, timeout: 12000, maximumAge: 600000 }
] as const;

const mapGeolocationError = (error: GeolocationPositionError) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Akses lokasi ditolak. Izinkan akses lokasi di browser Anda.';
    case error.POSITION_UNAVAILABLE:
      return 'Informasi lokasi tidak tersedia saat ini';
    case error.TIMEOUT:
      return 'Permintaan lokasi melebihi batas waktu. Coba lagi atau gunakan pencarian.';
    default:
      return 'Gagal mendapatkan lokasi. Periksa koneksi dan coba ulang.';
  }
};

interface LocationPoint {
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLocation?: LocationPoint;
  onLocationSelect: (location: LocationPoint) => void;
}

function MapComponent({
  position,
  onPositionChange
}: {
  position: [number, number];
  onPositionChange: (pos: [number, number]) => void;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Ensure Leaflet icons are properly set up after component mounts
    if (typeof window !== 'undefined') {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: DEFAULT_RETINA_ICON_URL,
        iconUrl: DEFAULT_ICON_URL,
        shadowUrl: DEFAULT_SHADOW_URL,
      });
    }
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <DynamicMap
      position={position}
      onPositionChange={onPositionChange}
    />
  );
}

// Separate component for dynamic loading
function DynamicMap({
  position,
  onPositionChange
}: {
  position: [number, number];
  onPositionChange: (pos: [number, number]) => void;
}) {
  const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
  const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
  const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
  const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ height: '400px', width: '100%' }}
      className="rounded-lg"
      key={`map-${position.join('-')}`} // Force re-render when position changes
    >
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <Marker
        position={position}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const newPos = marker.getLatLng();
            onPositionChange([newPos.lat, newPos.lng]);
          },
        }}
      >
        <Popup>
          <div className="text-sm">
            <p><strong>Koordinat:</strong></p>
            <p>Latitude: {position[0].toFixed(6)}</p>
            <p>Longitude: {position[1].toFixed(6)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag marker untuk mengubah lokasi
            </p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}

export function LocationPicker({
  open,
  onOpenChange,
  initialLocation,
  onLocationSelect
}: LocationPickerProps) {
  // Default ke Pempek coordinates jika tidak ada initial location
  const defaultLocation: LocationPoint = { latitude: -2.9916563420146383, longitude: 104.76346089583643 }; 
  const currentInitial = initialLocation || defaultLocation;

  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([
    currentInitial.latitude,
    currentInitial.longitude
  ]);

  const [manualLat, setManualLat] = useState(currentInitial.latitude.toString());
  const [manualLng, setManualLng] = useState(currentInitial.longitude.toString());

  // Geolocation states
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [geoStatus, setGeoStatus] = useState('');
  const activeGeoRequest = useRef<{ cancelled: boolean } | null>(null);
  const autoLocateTriggeredRef = useRef(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    place_id: string;
    display_name: string;
    lat: string;
    lon: string;
    type: string;
    importance: number;
  }>>([]);

  // Clear search results when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Clear search results when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchResults([]);
      setSearchQuery('');
    }
  }, [open]);

  // Auto-detect current location when dialog opens (if no initial location)
  const clearActiveGeoRequest = useCallback(() => {
    if (activeGeoRequest.current) {
      activeGeoRequest.current.cancelled = true;
      activeGeoRequest.current = null;
    }
  }, []);

  // Get current location using geolocation API
  const requestCurrentLocation = useCallback((attempt = 0) => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung oleh browser ini');
      setGeoStatus('');
      return;
    }

    setIsGettingLocation(true);
    setLocationError('');
    setGeoStatus(`Mencari lokasi (percobaan ${attempt + 1}/${GEOLOCATION_ATTEMPTS.length})...`);

    clearActiveGeoRequest();
    const controller = { cancelled: false };
    activeGeoRequest.current = controller;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (controller.cancelled) return;
        const { latitude, longitude } = position.coords;
        setSelectedPosition([latitude, longitude]);
        setManualLat(latitude.toString());
        setManualLng(longitude.toString());
        setIsGettingLocation(false);
        setGeoStatus('Lokasi berhasil ditemukan otomatis');
        setLocationError('');
        activeGeoRequest.current = null;
      },
      (error) => {
        if (controller.cancelled) return;
        const nextAttempt = attempt + 1;
        if (nextAttempt < GEOLOCATION_ATTEMPTS.length) {
          requestCurrentLocation(nextAttempt);
          return;
        }

        setIsGettingLocation(false);
        setGeoStatus('');
        setLocationError(mapGeolocationError(error));
        activeGeoRequest.current = null;
      },
      GEOLOCATION_ATTEMPTS[Math.min(attempt, GEOLOCATION_ATTEMPTS.length - 1)]
    );
  }, [clearActiveGeoRequest]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (open && !initialLocation && !autoLocateTriggeredRef.current) {
      autoLocateTriggeredRef.current = true;
      timer = setTimeout(() => {
        requestCurrentLocation();
      }, 500);
    }

    if (!open) {
      autoLocateTriggeredRef.current = false;
      clearActiveGeoRequest();
      setIsGettingLocation(false);
      setGeoStatus('');
      setLocationError('');
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [open, initialLocation, requestCurrentLocation, clearActiveGeoRequest]);

  // Search location using Nominatim (OpenStreetMap)
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setGeoStatus('');
    setSearchResults([]); // Clear previous results
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10&countrycodes=id&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setSearchResults(data);
        setLocationError('');
      } else {
        setSearchResults([]);
        setLocationError('Lokasi tidak ditemukan. Coba kata kunci yang lebih spesifik.');
      }
    } catch (error) {
      setSearchResults([]);
      setLocationError('Gagal mencari lokasi. Periksa koneksi internet Anda.');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePositionChange = (pos: [number, number]) => {
    setSelectedPosition(pos);
    setManualLat(pos[0].toString());
    setManualLng(pos[1].toString());
  };

  const handleSearchResultSelect = (result: typeof searchResults[0]) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setSelectedPosition([lat, lon]);
    setManualLat(lat.toString());
    setManualLng(lon.toString());
    setSearchResults([]); // Clear results after selection
    setSearchQuery(result.display_name); // Update search query to show selected location
  };

  const handleManualInputChange = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setSelectedPosition([lat, lng]);
    }
  };

  const handleConfirm = () => {
    onLocationSelect({
      latitude: selectedPosition[0],
      longitude: selectedPosition[1]
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset ke initial position
    if (initialLocation) {
      setSelectedPosition([initialLocation.latitude, initialLocation.longitude]);
      setManualLat(initialLocation.latitude.toString());
      setManualLng(initialLocation.longitude.toString());
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pilih Lokasi Penugasan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Location Controls */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Cari lokasi (contoh: Jakarta, Monas, dll)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={searchLocation}
                disabled={isSearching || !searchQuery.trim()}
                title="Cari lokasi"
              >
                <Search className={`h-4 w-4 ${isSearching ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => requestCurrentLocation()}
                disabled={isGettingLocation}
                title="Dapatkan lokasi saat ini"
              >
                <Navigation className={`h-4 w-4 ${isGettingLocation ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Gunakan ikon <Navigation className="inline h-3 w-3" /> untuk mendapatkan lokasi Anda saat ini, atau cari lokasi dengan ikon <Search className="inline h-3 w-3" />
            </p>
            {geoStatus && (
              <p className="text-xs text-muted-foreground">{geoStatus}</p>
            )}

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>Hasil Pencarian</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md">
                  <div className="p-2 space-y-1">
                    {searchResults.map((result) => (
                      <button
                        key={result.place_id}
                        type="button"
                        onClick={() => handleSearchResultSelect(result)}
                        className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors border-b border-border/50 last:border-b-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{result.display_name.split(',')[0]}</span>
                          <span className="text-xs text-muted-foreground">
                            {result.display_name.split(',').slice(1, 3).join(', ')}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            Lat: {parseFloat(result.lat).toFixed(4)}, Lng: {parseFloat(result.lon).toFixed(4)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Klik salah satu hasil untuk memilih lokasi tersebut
                </p>
              </div>
            )}
          </div>

          {/* Error Messages */}
          {locationError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{locationError}</p>
            </div>
          )}

          {/* Map */}
          <div className="space-y-2">
            <Label>Map</Label>
            <MapComponent
              position={selectedPosition}
              onPositionChange={handlePositionChange}
            />
            <p className="text-xs text-muted-foreground">
              Klik dan drag marker untuk memilih lokasi, atau gunakan kontrol di atas untuk mencari/dapatkan lokasi saat ini
            </p>
          </div>

          {/* Manual Coordinate Input */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                min="-90"
                max="90"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                onBlur={handleManualInputChange}
                placeholder="-6.2088"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                min="-180"
                max="180"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                onBlur={handleManualInputChange}
                placeholder="106.8456"
              />
            </div>
          </div>

          {/* Current Coordinates Display */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Koordinat Terpilih:</p>
            <p className="text-sm text-muted-foreground font-mono">
              POINT({selectedPosition[1].toFixed(6)} {selectedPosition[0].toFixed(6)})
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Format yang akan disimpan ke database
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Batal
          </Button>
          <Button onClick={handleConfirm}>
            Pilih Lokasi Ini
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}