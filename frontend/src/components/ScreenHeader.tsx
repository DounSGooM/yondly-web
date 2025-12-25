import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface ScreenHeaderProps {
    title?: string | React.ReactNode;
    onBack?: () => void;
    rightAction?: React.ReactNode;
}

export default function ScreenHeader({ title, onBack, rightAction }: ScreenHeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            try {
                router.back();
            } catch (e) {
                // Fallback if back navigation fails
                router.push('/(tabs)/market');
            }
        }
    };

    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            {typeof title === 'string' ? (
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
            ) : (
                title
            )}
            <View style={styles.rightContainer}>
                {rightAction || <View style={{ width: 40 }} />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50, // Safe area top (adjust if needed, assumes standard StatusBar height)
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    title: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    rightContainer: {
        width: 40,
        alignItems: 'flex-end',
    },
});
