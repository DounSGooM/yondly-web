import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { isLocationAllowed, AllowedZone, getActiveZones } from '../config/geoRestriction';

// DEV MODE: Set to true to simulate being in Poitiers
const DEV_SIMULATE_POITIERS = true;
const POITIERS_COORDS = { latitude: 46.5802, longitude: 0.3404 };

export interface GeoRestrictionState {
    isChecking: boolean;
    isAllowed: boolean | null;
    currentZone: AllowedZone | null;
    nearestZone: AllowedZone | null;
    userLocation: { latitude: number; longitude: number } | null;
    error: string | null;
    checkLocation: () => Promise<void>;
}

export function useGeoRestriction(): GeoRestrictionState {
    const [isChecking, setIsChecking] = useState(true);
    const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
    const [currentZone, setCurrentZone] = useState<AllowedZone | null>(null);
    const [nearestZone, setNearestZone] = useState<AllowedZone | null>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const checkLocation = async () => {
        setIsChecking(true);
        setError(null);

        try {
            let latitude: number;
            let longitude: number;

            // DEV MODE: Use simulated Poitiers location
            if (DEV_SIMULATE_POITIERS) {
                console.log('🗺️ DEV MODE: Simulating location in Poitiers');
                latitude = POITIERS_COORDS.latitude;
                longitude = POITIERS_COORDS.longitude;
            } else {
                // Request location permission
                const { status } = await Location.requestForegroundPermissionsAsync();

                if (status !== 'granted') {
                    setError('permission_denied');
                    setIsAllowed(false);
                    setIsChecking(false);
                    return;
                }

                // Get current location
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                latitude = location.coords.latitude;
                longitude = location.coords.longitude;
            }

            setUserLocation({ latitude, longitude });

            // Check if location is in an allowed zone
            const result = isLocationAllowed(latitude, longitude);

            setIsAllowed(result.allowed);
            setCurrentZone(result.zone);
            setNearestZone(result.nearestZone);

        } catch (err: any) {
            console.error('Geo-restriction check error:', err);
            setError(err.message || 'location_error');
            // On error, allow access (fail-open for better UX)
            // Change to setIsAllowed(false) for strict mode
            setIsAllowed(true);
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        checkLocation();
    }, []);

    return {
        isChecking,
        isAllowed,
        currentZone,
        nearestZone,
        userLocation,
        error,
        checkLocation,
    };
}

// Helper to get formatted zone list for display
export function getFormattedActiveZones(): string[] {
    return getActiveZones().map(zone => zone.displayName);
}
