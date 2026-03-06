import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';

interface NotificationBellProps {
    size?: number;
    color?: string;
}

export default function NotificationBell({ size = 24, color = '#333' }: NotificationBellProps) {
    const router = useRouter();
    const { token } = useAuthStore();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (token) {
            fetchUnreadCount();
            // Poll every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [token]);

    const fetchUnreadCount = async () => {
        try {
            if (!token) return;
            const response = await axios.get(`${API_URL}/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(response.data.count);
        } catch (error) {
            // Silently fail
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => router.push('/notifications' as any)}
        >
            <Ionicons name="notifications-outline" size={size} color={color} />
            {unreadCount > 0 && <View style={styles.dot} />}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    dot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ff4444',
    },
});
