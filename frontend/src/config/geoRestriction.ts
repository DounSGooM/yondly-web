/**
 * Geo-Restriction Configuration
 * 
 * This file defines the zones where the app is available.
 * Zones are now fetched from the API, with local data as fallback.
 */

import { API_URL } from './api';

export interface Commune {
    name: string;
    population: number;
    isActive: boolean;
}

export interface AllowedZone {
    id: string;
    name: string;
    displayName: string;
    type?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    radius?: number;
    isActive: boolean;
    launchDate?: string;
    communes?: Commune[];
}

// API endpoint for zones
const ZONES_API = `${API_URL}/zones/active`;

// Cache for zones
let cachedZones: AllowedZone[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch active zones from API
 */
export const fetchActiveZonesFromAPI = async (): Promise<AllowedZone[]> => {
    // Return cached data if still valid
    if (cachedZones && Date.now() - lastFetchTime < CACHE_DURATION) {
        return cachedZones;
    }

    try {
        const response = await fetch(ZONES_API);
        if (response.ok) {
            const zones = await response.json();
            cachedZones = zones;
            lastFetchTime = Date.now();
            return zones;
        }
    } catch (error) {
        console.log('Failed to fetch zones from API, using fallback');
    }

    // Fallback to local data
    return FALLBACK_ZONES;
};

/**
 * Get active communes from zones
 */
export const getActiveCommunes = async (): Promise<string[]> => {
    const zones = await fetchActiveZonesFromAPI();
    const communes: string[] = [];

    for (const zone of zones) {
        if (zone.communes) {
            for (const commune of zone.communes) {
                if (commune.isActive) {
                    communes.push(commune.name);
                }
            }
        }
    }

    return communes;
};

/**
 * Check if a city/commune name is in an active zone
 */
export const isCommuneActive = async (communeName: string): Promise<boolean> => {
    const activeCommunes = await getActiveCommunes();
    return activeCommunes.some(c =>
        c.toLowerCase() === communeName.toLowerCase() ||
        communeName.toLowerCase().includes(c.toLowerCase())
    );
};

// Fallback zones (used when API is unavailable)
const FALLBACK_ZONES: AllowedZone[] = [
    {
        id: 'grand-poitiers',
        name: 'Grand Poitiers',
        displayName: 'Grand Poitiers',
        isActive: true,
        communes: [
            { name: 'Poitiers', population: 88665, isActive: true },
            { name: 'Buxerolles', population: 10100, isActive: true },
            { name: 'Saint-Benoît', population: 7500, isActive: true },
            { name: 'Migné-Auxances', population: 6200, isActive: true },
            { name: 'Chasseneuil-du-Poitou', population: 5200, isActive: true },
            { name: 'Vouneuil-sous-Biard', population: 5300, isActive: true },
            { name: 'Mignaloux-Beauvoir', population: 4800, isActive: true },
            { name: 'Fontaine-le-Comte', population: 4100, isActive: true },
            { name: 'Montamisé', population: 3800, isActive: true },
            { name: 'Ligugé', population: 3100, isActive: true },
            { name: 'Béruges', population: 2300, isActive: true },
            { name: 'Biard', population: 1900, isActive: true },
            { name: 'Sèvres-Anxaumont', population: 2100, isActive: true },
            { name: 'Croutelle', population: 1100, isActive: true },
        ],
    },
];

// Legacy exports for backward compatibility
export const ALLOWED_ZONES = FALLBACK_ZONES;

export const getActiveZones = (): AllowedZone[] => {
    return FALLBACK_ZONES.filter(zone => zone.isActive);
};

export const isZoneActive = (zoneId: string): boolean => {
    const zone = FALLBACK_ZONES.find(z => z.id === zoneId);
    return zone?.isActive ?? false;
};

export const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const findNearestZone = (
    latitude: number,
    longitude: number
): { zone: AllowedZone; distance: number } | null => {
    // This is now less relevant since we use commune names, not coordinates
    return null;
};

export const isLocationAllowed = (
    latitude: number,
    longitude: number
): { allowed: boolean; zone: AllowedZone | null; nearestZone: AllowedZone | null } => {
    // For backward compatibility - returns allowed by default
    // Real geo-check should use isCommuneActive() with city name
    return { allowed: true, zone: FALLBACK_ZONES[0], nearestZone: null };
};

