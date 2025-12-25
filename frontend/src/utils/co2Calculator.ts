/**
 * CO2 Savings Calculator
 * 
 * Based on scientific estimates:
 * - Food waste generates ~2.5kg CO2 per kg of food (production, transport, decomposition)
 * - Average anti-waste basket: ~1.5kg of food
 * - Therefore: ~3.75kg CO2 saved per basket
 * 
 * Additional equivalents for visualization:
 * - 1 tree absorbs ~21kg CO2/year
 * - 1 km by car = ~0.12kg CO2
 * - 1 smartphone charge = ~0.008kg CO2
 */

export const CO2_PER_BASKET_KG = 3.75; // kg of CO2 saved per basket purchased
export const CO2_PER_DONATION_KG = 2.0; // kg of CO2 saved per food donation
export const CO2_PER_SALE_KG = 1.5; // kg of CO2 saved per second-hand item
export const CO2_PER_RENT_KG = 0.8; // kg of CO2 saved per rental (avoided production)

// Equivalences for visual impact
export const TREE_YEARLY_ABSORPTION_KG = 21;
export const CAR_KM_CO2_KG = 0.12;
export const SMARTPHONE_CHARGE_KG = 0.008;
export const SHOWER_MINUTES_KG = 0.42; // ~10 min shower

export interface CO2Impact {
    totalCO2SavedKg: number;
    basketsCount: number;
    donationsCount: number;
    salesCount: number;
    rentalsCount: number;
}

export interface CO2Equivalents {
    treeDays: number;
    carKm: number;
    smartphoneCharges: number;
    showerMinutes: number;
}

/**
 * Calculate total CO2 saved based on user activity
 */
export function calculateCO2Impact(
    basketsCount: number,
    donationsCount: number = 0,
    salesCount: number = 0,
    rentalsCount: number = 0
): CO2Impact {
    const totalCO2SavedKg =
        (basketsCount * CO2_PER_BASKET_KG) +
        (donationsCount * CO2_PER_DONATION_KG) +
        (salesCount * CO2_PER_SALE_KG) +
        (rentalsCount * CO2_PER_RENT_KG);

    return {
        totalCO2SavedKg: Math.round(totalCO2SavedKg * 10) / 10,
        basketsCount,
        donationsCount,
        salesCount,
        rentalsCount,
    };
}

/**
 * Convert CO2 savings to relatable equivalents
 */
export function getCO2Equivalents(co2Kg: number): CO2Equivalents {
    return {
        treeDays: Math.round((co2Kg / TREE_YEARLY_ABSORPTION_KG) * 365),
        carKm: Math.round(co2Kg / CAR_KM_CO2_KG),
        smartphoneCharges: Math.round(co2Kg / SMARTPHONE_CHARGE_KG),
        showerMinutes: Math.round(co2Kg / SHOWER_MINUTES_KG),
    };
}

/**
 * Get a user-friendly message based on CO2 level
 * Re-exports from levelBadges for convenience
 */
export { getLevelFromCO2 as getCO2Level } from './levelBadges';
export { getLevelProgress, getNextLevel } from './levelBadges';

/**
 * Format CO2 for display
 */
export function formatCO2(co2Kg: number): string {
    if (co2Kg < 1) {
        return `${Math.round(co2Kg * 1000)}g`;
    } else if (co2Kg < 1000) {
        return `${co2Kg.toFixed(1)}kg`;
    } else {
        return `${(co2Kg / 1000).toFixed(1)}t`;
    }
}
