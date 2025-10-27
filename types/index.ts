// Types pour l'application TideME

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Port {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  region: string;
  department: string;
  emoji?: string;
  distance?: number;
}

export interface TideExtreme {
  time: string; // ISO string
  height: number; // en mètres
  type: 'high' | 'low';
}

export interface TideData {
  maxTide: TideExtreme;
  minTide: TideExtreme;
  currentHeight: number; // Hauteur actuelle calculée
  coefficient: number; // 20-120
}

export interface SunData {
  sunrise: string; // HH:mm
  sunset: string; // HH:mm
}

export interface MoonPhase {
  phase: 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';
  illumination: number; // 0-1
}

export interface WaterTemperature {
  value: number; // en °C
  unit: '°C';
}

export interface AppData {
  port: Port;
  tide: TideData;
  sun: SunData;
  moon: MoonPhase;
  waterTemp: WaterTemperature;
  isDay: boolean;
}
