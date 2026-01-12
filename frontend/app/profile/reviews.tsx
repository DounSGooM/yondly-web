import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

interface Review {
    id: string;
    rating: number;
    comment?: string;
    created_at: string;
    reviewer: {
        id: string;
        display_name: string;
        photo_url?: string;
    };
    item_title?: string;
    item_image?: string;
}

export default function ReviewsScreen() {
    const router = useRouter();
    const { user, token } = useAuthStore();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const response = await axios.get(`${API_URL}/users/${user?.id}/ratings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReviews(response.data);
        } catch (error) {
            console.error('Fetch reviews error:', error);
            Alert.alert('Erreur', 'Impossible de charger les avis');
        } finally {
            setLoading(false);
        }
    };

    const renderReview = ({ item }: { item: Review }) => (
        <View style={styles.reviewCard}>
            <View style={styles.headerRow}>
                <View style={styles.reviewerInfo}>
                    <Image
                        source={
                            item.reviewer.photo_url
                                ? { uri: item.reviewer.photo_url }
                                : require('../../assets/images/yondly-icon.png')
                        }
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={styles.reviewerName}>{item.reviewer.display_name}</Text>
                        <Text style={styles.date}>
                            {format(new Date(item.created_at), 'd MMMM yyyy', { locale: fr })}
                        </Text>
                    </View>
                </View>
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color="#fff" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
            </View>

            {item.comment && (
                <Text style={styles.comment}>{item.comment}</Text>
            )}

            {item.item_title && (
                <View style={styles.itemContext}>
                    <Ionicons name="pricetag-outline" size={14} color="#666" />
                    <Text style={styles.itemTitle} numberOfLines={1}>
                        Concerne : {item.item_title}
                    </Text>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4C7B4B" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="Avis reçus" />

            <FlatList
                data={reviews}
                renderItem={renderReview}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="star-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>Aucun avis pour le moment</Text>
                        <Text style={styles.emptySubtext}>
                            Les avis apparaîtront ici une fois que vous aurez réalisé des échanges.
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
    },
    reviewerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    date: {
        fontSize: 12,
        color: '#999',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    ratingText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    comment: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        marginBottom: 12,
    },
    itemContext: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 8,
        borderRadius: 8,
        gap: 6,
    },
    itemTitle: {
        fontSize: 12,
        color: '#666',
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
});
