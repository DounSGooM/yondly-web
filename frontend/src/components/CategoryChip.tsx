import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface CategoryChipProps {
    label: string;
    icon: string;
    active: boolean;
    onPress: () => void;
}

export default function CategoryChip({ label, icon, active, onPress }: CategoryChipProps) {
    return (
        <TouchableOpacity
            style={[styles.chip, active && styles.chipActive]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={[styles.icon, active && styles.iconActive]}>{icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    chipActive: {
        backgroundColor: '#4C7B4B',
        borderColor: '#4C7B4B',
    },
    icon: {
        fontSize: 16,
        marginRight: 6,
    },
    iconActive: {
        // Icon color doesn't change, emoji stays same
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    labelActive: {
        color: '#fff',
        fontWeight: '600',
    },
});
