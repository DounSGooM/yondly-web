
export const getProximityLabel = (distanceKm?: number): string => {
    if (distanceKm === undefined || distanceKm === null) return 'Distance inconnue';

    if (distanceKm < 0.5) return 'Même rue';
    if (distanceKm < 2) return 'Même quartier';
    if (distanceKm < 5) return 'Même ville'; // Adjusted slightly as "Même ville" usually fits < 5km in dense areas
    if (distanceKm < 10) return 'Ville voisine';
    return 'Même agglomération';
};
