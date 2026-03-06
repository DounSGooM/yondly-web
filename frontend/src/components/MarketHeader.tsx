import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as Colors, Typography, Spacing, BorderRadius } from '../theme';
import NotificationBell from './NotificationBell';

interface MarketHeaderProps {
    location?: string;
    onLocationPress?: () => void;
    onNotificationPress?: () => void;
    onMessagePress?: () => void;
    onViewToggle?: () => void;
    viewModeIcon?: string;
    notificationCount?: number;
    searchQuery?: string;
    onSearchChange?: (text: string) => void;
    onFilterPress?: () => void;
    onSaveSearchPress?: () => void;
    showSaveSearch?: boolean;
    activeFilters?: boolean;
}

export default function MarketHeader({
    location = 'Poitiers',
    onLocationPress,
    onNotificationPress,
    onMessagePress,
    onViewToggle,
    viewModeIcon = 'grid-outline',
    notificationCount = 0,
    searchQuery = '',
    onSearchChange,
    onFilterPress,
    onSaveSearchPress,
    showSaveSearch = false,
    activeFilters = false,
}: MarketHeaderProps) {
    return (
        <View style={styles.container}>
            {/* Top row: Logo, Location, Right Actions */}
            <View style={styles.topRow}>
                <Image
                    source={require('../../assets/images/loop-logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <TouchableOpacity style={styles.locationButton} onPress={onLocationPress}>
                    <Ionicons name="location" size={16} color={Colors.textPrimary} />
                    <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
                    {/* <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} /> */}
                </TouchableOpacity>

                <View style={styles.rightActions}>
                    {onViewToggle && (
                        <TouchableOpacity style={styles.iconButton} onPress={onViewToggle}>
                            <Ionicons name={viewModeIcon as any} size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    )}

                    <NotificationBell size={24} color={Colors.textPrimary} />

                    {onMessagePress && (
                        <TouchableOpacity style={styles.iconButton} onPress={onMessagePress}>
                            <Ionicons name="chatbubbles-outline" size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Search bar row */}
            <View style={styles.searchRow}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={location === "Don" ? "Rechercher des dons..." : "Rechercher..."}
                        placeholderTextColor={Colors.textSecondary}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                    />
                </View>

                <View style={styles.searchActions}>
                    {showSaveSearch && (
                        <TouchableOpacity style={styles.actionButton} onPress={onSaveSearchPress}>
                            <Ionicons name="bookmark-outline" size={22} color={Colors.primary} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.actionButton} onPress={onFilterPress}>
                        <Ionicons name="filter" size={22} color={activeFilters ? Colors.primary : Colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        paddingTop: 50,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        justifyContent: 'space-between',
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 90,
        height: 32,
        marginRight: Spacing.sm,
    },
    locationButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0', // Light gray pill
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: Spacing.sm,
    },
    locationText: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.textPrimary,
        marginLeft: 8,
        flex: 1,
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.error,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    searchContainer: {
        flex: 1,
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
        height: '100%',
    },
    searchActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        marginLeft: Spacing.xs,
    },
});
