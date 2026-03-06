import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';

export default function ProTabLayout() {
    const user = useAuthStore((state) => state.user);
    // Services are stored in user.services (array of strings)
    // Valid services: 'sale', 'rent', 'anti_waste'
    const services = user?.services || [];
    // If no services defined (legacy user), show all or default? 
    // Let's assume show all for safety if field missing, or show none?
    // Safer to show all if undefined to avoid blocking features for existing users.
    const hasSale = services.length === 0 || services.includes('sale');
    const hasRent = services.includes('rent');
    const hasAntiWaste = services.length === 0 || services.includes('anti_waste');

    // Single mode checks
    const isAntiWasteOnly = services.length === 1 && services[0] === 'anti_waste';
    const isRentalOnly = services.length === 1 && services[0] === 'rent';
    const isSaleOnly = services.length === 1 && services[0] === 'sale';

    // Determine the creation route based on service
    let createRoute = '/(pro)/nouveau-panier'; // Default fallback
    if (isRentalOnly) createRoute = '/(pro)/nouvelle-location';
    else if (isSaleOnly) createRoute = '/(pro)/nouvel-article';
    else if (hasSale && !hasAntiWaste && !hasRent) createRoute = '/(pro)/nouvel-article';
    // For mixed mode, ideally a selection screen. For now, defaulting to one or sticking to current behavior?
    // User asked for the button. If mixed, we might need a "New" dispatcher.
    // For simplicity in this step, if mixed, we point to 'nouveau-panier' or we could default to 'nouvel-article'.
    // Let's create a 'creation-dispatcher' hidden route or reuse one.
    // Actually, distinct tabs for each creation might be better if we want valid hrefs.

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#4C7B4B',
                tabBarInactiveTintColor: '#999',
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 0,
                    paddingTop: 12,
                    paddingBottom: 28,
                    height: 85,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    marginTop: 6,
                },
            }}
        >
            {/* 1. ACCUEIL (Gauche) */}
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Accueil',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "home" : "home-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />

            {/* 2. BOUTON + CENTRAL - Anti-Waste Creation */}
            <Tabs.Screen
                name="nouveau-panier"
                options={{
                    title: '',
                    href: (!isRentalOnly && !isSaleOnly) ? undefined : null,
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.addButton}>
                            <Ionicons name="add" size={32} color="#fff" />
                        </View>
                    ),
                }}
            />

            {/* Sale Creation - Only show if Sale Only */}
            <Tabs.Screen
                name="nouvel-article"
                options={{
                    title: '',
                    href: isSaleOnly ? undefined : null,
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.addButton}>
                            <Ionicons name="add" size={32} color="#fff" />
                        </View>
                    ),
                }}
            />

            {/* Rent Creation - Only show if Rent Only */}
            <Tabs.Screen
                name="nouvelle-location"
                options={{
                    title: '',
                    href: isRentalOnly ? undefined : null,
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.addButton}>
                            <Ionicons name="add" size={32} color="#fff" />
                        </View>
                    ),
                }}
            />

            {/* 3. COMPTE (Droite) */}
            <Tabs.Screen
                name="profil"
                options={{
                    title: 'Compte',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "person" : "person-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />

            {/* HIDDEN TABS (Accessible via Dashboard or Profile) */}
            <Tabs.Screen name="mes-articles" options={{ href: null }} />
            <Tabs.Screen name="mes-locations" options={{ href: null }} />
            <Tabs.Screen name="historique" options={{ href: null }} />
            <Tabs.Screen name="mes-paniers" options={{ href: null }} />
            <Tabs.Screen name="scanner-retrait" options={{ href: null }} />
            <Tabs.Screen name="chiffre-affaires" options={{ href: null }} />
            <Tabs.Screen name="analytics" options={{ href: null }} />
            <Tabs.Screen name="aide-pro" options={{ href: null }} />
            <Tabs.Screen name="payouts" options={{ href: null }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    addButton: {
        backgroundColor: '#4C7B4B',
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#4C7B4B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
