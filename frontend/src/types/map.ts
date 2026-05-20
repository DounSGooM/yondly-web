export type MapPointType =
  | 'food_donation'
  | 'garden_surplus'
  | 'anti_waste_basket'
  | 'producer'
  | 'market'
  | 'amap'
  | 'solidarity_grocery'
  | 'food_association'
  | 'yondly_mobile_stop'
  | 'reuse_shop'
  | 'repair_point'
  | 'second_hand';

export type MapCategory = 'alimentaire' | 'reemploi' | 'all';

export interface MapPoint {
  id: string;
  name: string;
  type: MapPointType;
  category: MapCategory;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  description: string;
  tags: string[];
  openingHours?: string;
  actionLabel?: string;
  phone?: string;
  website?: string;
}

export interface YondlyMobileStop {
  id: string;
  city: string;
  date: string;
  schedule: string;
  location: string;
  acceptedItems: string;
  nextStop: boolean;
}

export const MAP_TYPE_META: Record<MapPointType, { label: string; icon: string; color: string }> = {
  food_donation:       { label: 'Don alimentaire',     icon: 'leaf',              color: '#2D7D46' },
  garden_surplus:      { label: 'Surplus de jardin',   icon: 'flower',            color: '#4CAF50' },
  anti_waste_basket:   { label: 'Anti-gaspi',          icon: 'timer',             color: '#E8833A' },
  producer:            { label: 'Producteur',          icon: 'farm',              color: '#059669' },
  market:              { label: 'Marché',              icon: 'storefront',        color: '#0284C7' },
  amap:                { label: 'AMAP',                icon: 'basket',            color: '#7C3AED' },
  solidarity_grocery:  { label: 'Épicerie solidaire',  icon: 'heart',             color: '#DC2626' },
  food_association:    { label: 'Association',         icon: 'people',            color: '#9333EA' },
  yondly_mobile_stop:  { label: 'Yondly Mobile',       icon: 'bus',               color: '#2D7D46' },
  reuse_shop:          { label: 'Recyclerie',          icon: 'refresh-circle',    color: '#1A73E8' },
  repair_point:        { label: 'Réparation',          icon: 'construct',         color: '#F59E0B' },
  second_hand:         { label: 'Seconde main',        icon: 'swap-horizontal',   color: '#6366F1' },
};

export const FOOD_FILTER_TYPES: MapPointType[] = [
  'food_donation', 'garden_surplus', 'anti_waste_basket',
  'producer', 'market', 'amap', 'solidarity_grocery',
  'food_association', 'yondly_mobile_stop',
];

export const ZONE_LABELS = [
  'Autour de moi',
  'Poitiers',
  'Grand Poitiers',
  'Haut-Poitou',
  'Vallées du Clain',
  'Tout le territoire PAT',
];
