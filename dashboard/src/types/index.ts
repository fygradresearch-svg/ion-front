export interface Alerta {
  OBJECTID: number;
  ESTADO_DESC: string;
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
  lat: number;
  lng: number;
}
