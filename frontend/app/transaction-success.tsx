import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Share,
    SafeAreaView,
    Dimensions,
    Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_HEIGHT < 700;

interface TransactionData {
    type: 'sale' | 'rental' | 'donation' | 'basket';
    itemTitle: string;
    amount: number;
    co2_kg: number;
    trees_equivalent: number;
    car_km_avoided: number;
    points_earned: number;
}

export default function TransactionSuccessScreen() {
    const router = useRouter();
    const { refreshUser } = useAuthStore();
    const params = useLocalSearchParams<{
        orderId: string;
        type: string;
        itemTitle: string;
        amount: string;
        co2_kg: string;
        successTitle?: string;
        successMessage?: string;
        nextPath?: string;
    }>();

    const [data, setData] = useState<TransactionData | null>(null);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        const co2_kg = parseFloat(params.co2_kg || '0') || 5;
        setData({
            type: (params.type as 'sale' | 'rental' | 'donation') || 'sale',
            itemTitle: params.itemTitle || 'Article',
            amount: parseFloat(params.amount || '0'),
            co2_kg: co2_kg,
            trees_equivalent: Math.round(co2_kg / 21 * 12),
            car_km_avoided: Math.round(co2_kg / 0.12),
            points_earned: Math.round(co2_kg * 10),
        });
        refreshUser();
    }, []);

    const getTypeEmoji = () => {
        switch (data?.type) {
            case 'donation': return '🎁';
            case 'rental': return '🔄';
            case 'basket': return '🧺';
            default: return '💰';
        }
    };

    const handleShare = async () => {
        await Share.share({
            message: `🌍 J'ai économisé ${data?.co2_kg} kg de CO2 grâce à Loop !`,
        }).catch(() => { });
    };

    const handleDone = () => {
        if (params.nextPath) {
            router.replace(params.nextPath as any);
        } else {
            router.replace('/(tabs)/accueil');
        }
    };

    if (!data) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {/* Mascot GIF */}
                <View style={styles.mascotContainer}>
                    <Image
                        source={require('../assets/mascot.gif')}
                        style={styles.mascotImage}
                        resizeMode="contain"
                    />
                </View>

                {/* Success Text */}
                <View style={styles.header}>
                    <Text style={styles.title}>{params.successTitle || '🎉 Félicitations !'}</Text>
                    {params.successMessage ? (
                        <Text style={styles.subtitle}>{params.successMessage}</Text>
                    ) : (
                        <Text style={styles.subtitle}>{getTypeEmoji()} {data.itemTitle}</Text>
                    )}
                    {data.amount > 0 && (
                        <Text style={styles.amount}>{(data.amount / 100).toFixed(2)} €</Text>
                    )}
                </View>

                {/* Impact Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{data.co2_kg.toFixed(1)}</Text>
                        <Text style={styles.statLabel}>kg CO2</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>🌳 {data.trees_equivalent}</Text>
                        <Text style={styles.statLabel}>mois</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>🚗 {data.car_km_avoided}</Text>
                        <Text style={styles.statLabel}>km</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>+{data.points_earned}</Text>
                        <Text style={styles.statLabel}>pts</Text>
                    </View>
                </View>

                {/* Spacer */}
                <View style={styles.spacer} />

                {/* Buttons */}
                <View style={styles.buttons}>
                    <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                        <Ionicons name="share-outline" size={18} color="#4C7B4B" />
                        <Text style={styles.shareBtnText}>Partager</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
                        <Text style={[styles.doneBtnText, { textAlign: 'center' }]}>
                            {params.nextPath ? 'Continuer' : 'Terminé'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: isSmallScreen ? 10 : 20,
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    mascotContainer: {
        alignItems: 'center',
        marginBottom: isSmallScreen ? 8 : 16,
    },
    mascotImage: {
        width: isSmallScreen ? 140 : 180,
        height: isSmallScreen ? 140 : 180,
    },
    header: {
        alignItems: 'center',
        marginBottom: isSmallScreen ? 12 : 20,
    },
    title: {
        fontSize: isSmallScreen ? 22 : 28,
        fontWeight: 'bold',
        color: '#4C7B4B',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    amount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4C7B4B',
        marginTop: 8,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: isSmallScreen ? 12 : 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#e0e0e0',
    },
    statValue: {
        fontSize: isSmallScreen ? 16 : 18,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    statLabel: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
    },
    spacer: {
        flex: 1,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
    },
    shareBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#4C7B4B',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 6,
    },
    shareBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4C7B4B',
    },
    doneBtn: {
        flex: 1,
        backgroundColor: '#4C7B4B',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    doneBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});
