import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, BorderRadius, Shadows } from '../theme';

function ShimmerBox({ style }: { style: any }) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return <Animated.View style={[{ backgroundColor: '#e0e0e0', opacity }, style]} />;
}

export function SkeletonGridCard() {
    return (
        <View style={styles.card}>
            <ShimmerBox style={styles.image} />
            <View style={styles.content}>
                <ShimmerBox style={styles.titleLine} />
                <ShimmerBox style={styles.titleLineShort} />
                <ShimmerBox style={styles.priceLine} />
            </View>
        </View>
    );
}

export function SkeletonListCard() {
    return (
        <View style={styles.listCard}>
            <ShimmerBox style={styles.listImage} />
            <View style={styles.listContent}>
                <ShimmerBox style={styles.titleLine} />
                <ShimmerBox style={styles.titleLineShort} />
                <ShimmerBox style={styles.priceLine} />
            </View>
        </View>
    );
}

export default function SkeletonGrid({ count = 6, layout = 'grid' }: { count?: number; layout?: 'grid' | 'list' }) {
    const items = Array.from({ length: count });
    if (layout === 'list') {
        return (
            <View style={styles.listContainer}>
                {items.map((_, i) => <SkeletonListCard key={i} />)}
            </View>
        );
    }
    return (
        <View style={styles.gridContainer}>
            {items.map((_, i) => <SkeletonGridCard key={i} />)}
        </View>
    );
}

const styles = StyleSheet.create({
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12,
    },
    listContainer: {
        padding: 16,
        gap: 12,
    },
    card: {
        width: '47%',
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        ...Shadows.card,
    },
    image: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 0,
    },
    content: {
        padding: 12,
        gap: 8,
    },
    titleLine: {
        height: 14,
        borderRadius: 4,
        width: '90%',
    },
    titleLineShort: {
        height: 14,
        borderRadius: 4,
        width: '60%',
    },
    priceLine: {
        height: 18,
        borderRadius: 4,
        width: '40%',
        marginTop: 4,
    },
    listCard: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        height: 120,
        ...Shadows.card,
    },
    listImage: {
        width: 120,
        height: '100%',
    },
    listContent: {
        flex: 1,
        padding: 12,
        gap: 8,
        justifyContent: 'center',
    },
});
