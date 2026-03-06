/**
 * User Level Badges based on CO2 Savings (Ethical Nature Theme)
 * 
 * Levels based on total kg of CO2 saved:
 * - Graine: 0-100 kg
 * - Pousse: 100-500 kg
 * - Arbre: 500-2500 kg
 * - Forêt: 2500+ kg
 */

export interface LevelBadge {
    level: string;
    icon: string;
    color: string;
    emoji: string;
    minCO2: number;
    maxCO2: number;
}

// CO2 thresholds for each level (in kg)
export const LEVEL_THRESHOLDS = {
    GRAINE: 0,
    POUSSE: 100,
    ARBRE: 500,
    FORET: 2500,
};

/**
 * Get level badge based on CO2 saved (in kg)
 */
export function getLevelFromCO2(co2Kg: number): LevelBadge {
    if (co2Kg < LEVEL_THRESHOLDS.POUSSE) {
        return {
            level: 'Graine',
            icon: 'seed-outline',
            color: '#8d6e63', // Earth/Seed color
            emoji: '🌱',
            minCO2: LEVEL_THRESHOLDS.GRAINE,
            maxCO2: LEVEL_THRESHOLDS.POUSSE,
        };
    } else if (co2Kg < LEVEL_THRESHOLDS.ARBRE) {
        return {
            level: 'Pousse',
            icon: 'leaf-outline',
            color: '#a5d6a7', // Light green
            emoji: '🌿',
            minCO2: LEVEL_THRESHOLDS.POUSSE,
            maxCO2: LEVEL_THRESHOLDS.ARBRE,
        };
    } else if (co2Kg < LEVEL_THRESHOLDS.FORET) {
        return {
            level: 'Arbre',
            icon: 'leaf',
            color: '#4caf50', // Medium green
            emoji: '🌳',
            minCO2: LEVEL_THRESHOLDS.ARBRE,
            maxCO2: LEVEL_THRESHOLDS.FORET,
        };
    } else {
        return {
            level: 'Forêt',
            icon: 'earth',
            color: '#2e7d32', // Deep green
            emoji: '🌲',
            minCO2: LEVEL_THRESHOLDS.FORET,
            maxCO2: Infinity,
        };
    }
}

/**
 * Get progress to next level (0-100%)
 */
export function getLevelProgress(co2Kg: number): number {
    const currentLevel = getLevelFromCO2(co2Kg);

    if (currentLevel.maxCO2 === Infinity) {
        return 100; // Max level reached
    }

    const progressInLevel = co2Kg - currentLevel.minCO2;
    const levelRange = currentLevel.maxCO2 - currentLevel.minCO2;

    return Math.min(Math.round((progressInLevel / levelRange) * 100), 100);
}

/**
 * Get next level info
 */
export function getNextLevel(co2Kg: number): { name: string; co2Needed: number } | null {
    const currentLevel = getLevelFromCO2(co2Kg);

    if (currentLevel.maxCO2 === Infinity) {
        return null; // Already at max level
    }

    const nextLevelBadge = getLevelFromCO2(currentLevel.maxCO2);
    return {
        name: nextLevelBadge.level,
        co2Needed: Math.round((currentLevel.maxCO2 - co2Kg) * 10) / 10,
    };
}

/**
 * Legacy function for backward compatibility
 * Maps any old level names to new badge structure if data is inconsistent
 */
export const getLevelBadge = (level: string = 'Graine') => {
    // Map levels to approximate CO2 values if they match old names
    const mapping: { [key: string]: number } = {
        'Novice': 0,
        'Graine': 0,
        'Habitué': 150,
        'Pousse': 150,
        'Expert': 600,
        'Arbre': 600,
        'Ambassadeur': 3000,
        'Forêt': 3000,
    };

    const co2Kg = mapping[level] ?? 0;
    const badge = getLevelFromCO2(co2Kg);

    return {
        icon: badge.icon,
        color: badge.color,
        label: badge.level,
    };
};
