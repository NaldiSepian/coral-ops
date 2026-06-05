// Location parsing utilities for PostGIS geometries

const HEX_STRING_REGEX = /^[0-9a-fA-F]+$/;

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Parse WKB/EWKB POINT geometry to coordinates [latitude, longitude]
 */
export function parseWkbPoint(hexString: string): [number, number] | null {
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

/**
 * Parse various location formats to coordinates [latitude, longitude]
 */
export function parseLocation(locationData: any): [number, number] | null {
  if (!locationData) return null;

  if (typeof locationData === 'string') {
    if (HEX_STRING_REGEX.test(locationData.trim())) {
      return parseWkbPoint(locationData);
    }

    // Handle EWKT format: SRID=4326;POINT(longitude latitude)
    if (locationData.includes('SRID=')) {
      const wktPart = locationData.split(';')[1];
      if (wktPart) {
        const match = wktPart.match(/POINT\(([^ ]+) ([^)]+)\)/);
        if (match) {
          const longitude = parseFloat(match[1]);
          const latitude = parseFloat(match[2]);
          return [latitude, longitude];
        }
      }
    }

    const match = locationData.match(/POINT\(([^ ]+) ([^)]+)\)/);
    if (match) {
      const longitude = parseFloat(match[1]);
      const latitude = parseFloat(match[2]);
      return [latitude, longitude];
    }

    try {
      const geoJson = JSON.parse(locationData);
      if (geoJson.type === 'Point' && Array.isArray(geoJson.coordinates) && geoJson.coordinates.length === 2) {
        const [longitude, latitude] = geoJson.coordinates;
        return [latitude, longitude];
      }
    } catch (e) {}

  } else if (typeof locationData === 'object' && locationData.coordinates) {
    // PostGIS format: { type: "Point", coordinates: [longitude, latitude] }
    const [longitude, latitude] = locationData.coordinates;
    if (typeof longitude === 'number' && typeof latitude === 'number') {
      return [latitude, longitude];
    }
  } else if (Array.isArray(locationData) && locationData.length === 2) {
    const [longitude, latitude] = locationData;
    if (typeof longitude === 'number' && typeof latitude === 'number') {
      return [latitude, longitude];
    }
  }

  return null;
}

/**
 * Convert location data to display format POINT(longitude latitude)
 */
export function getLocationDisplayText(locationData: any): string {
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
      if (wktPart) {
        const match = wktPart.match(/POINT\(([^ ]+) ([^)]+)\)/);
        if (match) {
          const longitude = parseFloat(match[1]);
          const latitude = parseFloat(match[2]);
          return `POINT(${longitude.toFixed(6)} ${latitude.toFixed(6)})`;
        }
      }
    }

    const match = locationData.match(/POINT\(([^ ]+) ([^)]+)\)/);
    if (match) {
      const longitude = parseFloat(match[1]);
      const latitude = parseFloat(match[2]);
      return `POINT(${longitude.toFixed(6)} ${latitude.toFixed(6)})`;
    }

    try {
      const geoJson = JSON.parse(locationData);
      if (geoJson.type === 'Point' && Array.isArray(geoJson.coordinates) && geoJson.coordinates.length === 2) {
        const [longitude, latitude] = geoJson.coordinates;
        return `POINT(${longitude.toFixed(6)} ${latitude.toFixed(6)})`;
      }
    } catch (e) {}

  } else if (typeof locationData === 'object' && locationData.coordinates) {
    // PostGIS format: { type: "Point", coordinates: [longitude, latitude] }
    const [longitude, latitude] = locationData.coordinates;
    if (typeof longitude === 'number' && typeof latitude === 'number') {
      return `POINT(${longitude.toFixed(6)} ${latitude.toFixed(6)})`;
    }
  } else if (Array.isArray(locationData) && locationData.length === 2) {
    const [longitude, latitude] = locationData;
    if (typeof longitude === 'number' && typeof latitude === 'number') {
      return `POINT(${longitude.toFixed(6)} ${latitude.toFixed(6)})`;
    }
  }

  return 'Lokasi tidak ditentukan';
}