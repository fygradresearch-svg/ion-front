export interface Alerta {
  OBJECTID: number;
  ESTADO_DESC: string;
  ESTADO_COD?: string;
  NOMBDEP: string;
  NOMBPROV: string;
  NOMBDIST: string;
  LATITUD: number;
  LONGITUD: number;
}

export interface RankingItem {
  district: string;
  dept: string;
  count: number;
  total: number;
  atendidos: number;
  noAtendidos: number;
  lat: number;
  lng: number;
}

export interface WastePoint {
  id: number;
  lat: number;
  lng: number;
  image_url: string;
  prediction: string;
  confidence: number;
}
