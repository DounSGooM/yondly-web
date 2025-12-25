import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as Colors, Typography, Spacing, BorderRadius } from '../theme';

interface MarketHeaderProps {
    location?: string;
    onLocationPress?: () => void;
    onNotificationPress?: () => void;
    searchQuery?: string;
    onSearchChange?: (text: string) => void;
}

export default function MarketHeader({
    location = 'Poitiers',
    onLocationPress,
    onNotificationPress,
    searchQuery = '',
    onSearchChange,
}: MarketHeaderProps) {
    return (
        <View style={styles.container}>
            {/* Top row: Logo, Location, Notification */}
            <View style={styles.topRow}>
                <Image
                    source={require('../../assets/images/yondly-icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <TouchableOpacity style={styles.locationButton} onPress={onLocationPress}>
                    <Ionicons name="location" size={16} color={Colors.primary} />
                    <Text style={styles.locationText}>{location}</Text>
                    <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
                    <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher..."
                    placeholderTextColor={Colors.textSecondary}
                    value={searchQuery}
                    onChangeText={onSearchChange}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        paddingTop: 50, // Status bar
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    logo: {
        width: 32,
        height: 32,
        marginRight: Spacing.sm,
    },
    locationButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
        marginRight: Spacing.sm,
    },
    locationText: {
        fontSize: Typography.sm,
        fontWeight: Typography.semibold,
        color: Colors.textPrimary,
        marginLeft: 4,
        marginRight: 4,
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        height: 44,
    },
    searchIcon: {
        marginRight: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.textPrimary,
    },
});
