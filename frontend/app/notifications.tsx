import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../src/store/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

import { API_URL } from '../src/config/api';
import ScreenHeader from '../src/components/ScreenHeader';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    data?: any;
}

const NOTIFICATION_ICONS: Record<string, { icon: string; color: string }> = {
    order_status: { icon: 'cart', color: '#1976d2' },
    rental_status: { icon: 'key', color: '#4C7B4B' },
    payment: { icon: 'card', color: '#2196f3' },
    dispute: { icon: 'warning', color: '#f44336' },
    system: { icon: 'information-circle', color: '#666' },
    message: { icon: 'chatbubble', color: '#e91e63' },
    promo: { icon: 'pricetag', color: '#9c27b0' },
};

export default function NotificationsScreen() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await axios.get(`${API_URL}/notifications/user`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(response.data);
            setUnreadCount(response.data.filter((n: Notification) => !n.read).length);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.put(
                `${API_URL}/notifications/mark-all-read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all read:', error);
        }
    };

    const handlePressNotification = async (notification: Notification) => {
        // 1. Mark as read
        if (!notification.read) {
            try {
                await axios.put(
                    `${API_URL}/notifications/${notification.id}/read`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                // Optimistic update
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error('Error marking read:', error);
            }
        }

        // 2. Navigate based on type/data
        const { type, data } = notification;

        if (type === 'order_status' && data?.order_id) {
            router.push(`/order-detail?id=${data.order_id}`);
        } else if (type === 'rental_status' && data?.rental_id) {
            router.push(`/rental/detail?id=${data.rental_id}`);
        } else if (type === 'dispute' && data?.dispute_id) {
            router.push(`/order/dispute-detail?id=${data.dispute_id}` as any);
        } else if (type === 'message' && data?.conversation_id) {
            router.push(`/chat-detail?id=${data.conversation_id}` as any);
        }
        // Default action: just stay on screen (item is now read)
    };

    const renderItem = ({ item }: { item: Notification }) => {
        const iconConfig = NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.system;

        return (
            <TouchableOpacity
                style={[styles.card, !item.read && styles.unreadCard]}
                onPress={() => handlePressNotification(item)}
            >
                <View style={[styles.iconContainer, { backgroundColor: iconConfig.color + '20' }]}>
                    <Ionicons name={iconConfig.icon as any} size={24} color={iconConfig.color} />
                </View>
                <View style={styles.contentContainer}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.title, !item.read && styles.unreadTitle]}>
                            {item.title}
                        </Text>
                        {!item.read && <View style={styles.dot} />}
                    </View>
                    <Text style={styles.message} numberOfLines={2}>
                        {item.message}
                    </Text>
                    <Text style={styles.time}>
                        {format(new Date(item.created_at), 'd MMM, HH:mm', { locale: fr })}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <ScreenHeader
                title="Notifications"
                rightAction={
                    unreadCount > 0 && (
                        <TouchableOpacity onPress={handleMarkAllRead} style={{ padding: 8 }}>
                            <Ionicons name="checkmark-done-circle" size={24} color="#4C7B4B" />
                        </TouchableOpacity>
                    )
                }
            />

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4C7B4B" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                loadNotifications();
                            }}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyTitle}>Rien à signaler</Text>
                            <Text style={styles.emptyText}>
                                Vous n'avez pas de nouvelles notifications pour le moment.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    markReadButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 20,
    },
    card: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    unreadCard: {
        backgroundColor: '#f0f9f0',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contentContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    unreadTitle: {
        color: '#000',
        fontWeight: '700',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4C7B4B',
        marginLeft: 8,
    },
    message: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
        lineHeight: 20,
    },
    time: {
        fontSize: 12,
        color: '#999',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});
