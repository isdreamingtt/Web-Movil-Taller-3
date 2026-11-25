import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { firstValueFrom, timeout } from 'rxjs';

export interface CapturedLocation {
  lat: number;
  lng: number;
  label: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: {
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);

  async getCurrentLocation(): Promise<CapturedLocation> {
    if (Capacitor.isNativePlatform()) {
      let perms = await Geolocation.checkPermissions();
      if (perms.location !== 'granted' && perms.coarseLocation !== 'granted') {
        perms = await Geolocation.requestPermissions();
      }
      if (perms.location !== 'granted' && perms.coarseLocation !== 'granted') {
        throw new Error(
          'Permiso de ubicación denegado. Habilítalo en ajustes o escribe el lugar manualmente.',
        );
      }
    }

    let lat: number;
    let lng: number;

    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
      lat = Number(pos.coords.latitude.toFixed(6));
      lng = Number(pos.coords.longitude.toFixed(6));
    } catch (err: unknown) {
      throw new Error(this.mapLocationError(err));
    }

    const label = await this.reverseGeocode(lat, lng);
    return { lat, lng, label };
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&accept-language=es`;

    try {
      const res = await firstValueFrom(
        this.http.get<NominatimResponse>(url).pipe(timeout(5000)),
      );
      const addr = res?.address;
      if (!addr) {
        return res?.display_name?.slice(0, 150) || fallback;
      }

      const area = addr.suburb || addr.neighbourhood;
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.county;
      const region = addr.state || addr.country;

      const parts: string[] = [];
      for (const part of [area, city, region]) {
        if (part && !parts.includes(part)) {
          parts.push(part);
        }
      }

      const formatted = parts.slice(0, 2).join(', ');
      return (formatted || fallback).slice(0, 150);
    } catch {
      return fallback;
    }
  }

  private mapLocationError(err: unknown): string {
    const code = (err as { code?: number })?.code;
    const msg = String((err as { message?: string })?.message || '').toLowerCase();

    if (code === 1 || msg.includes('denied') || msg.includes('permission')) {
      return 'Permiso de ubicación denegado. Habilítalo o escribe el lugar manualmente.';
    }
    if (code === 2 || msg.includes('unavailable') || msg.includes('disabled')) {
      return 'Ubicación no disponible. Verifica que el GPS esté encendido.';
    }
    if (code === 3 || msg.includes('timeout')) {
      return 'Tiempo de espera agotado al obtener el GPS. Intenta nuevamente o escríbelo manualmente.';
    }
    return 'No se pudo obtener la ubicación actual. Puedes escribir el lugar manualmente.';
  }
}