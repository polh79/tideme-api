// Types pour l'API TideME (Marées uniquement)

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
  extremes: TideExtreme[]; // Tous les extremes sur 48h
  maxTide: TideExtreme; // Prochaine haute mer
  minTide: TideExtreme; // Prochaine basse mer
  currentHeight: number; // Hauteur actuelle calculée (mètres)
  coefficient: number; // 20-120
  isRising: boolean; // Marée montante ou descendante
  waterLevel: number; // Niveau normalisé 0-1 pour animation
}
