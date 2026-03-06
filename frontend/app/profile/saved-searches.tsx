import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { SavedSearch } from '../../src/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { API_URL } from '../../src/config/api';

export default function SavedSearchesScreen() {
    const router = useRouter();
    const { token, user } = useAuthStore();
    const [searches, setSearches] = useState<SavedSearch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSearches();
    }, []);

    const fetchSearches = async () => {
        try {
            const response = await axios.get(`${API_URL}/saved-searches`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSearches(response.data);
        } catch (error) {
            console.error('Error fetching saved searches:', error);
            Alert.alert('Erreur', 'Impossible de charger vos recherches sauvegardées.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Supprimer',
            'Voulez-vous supprimer cette recherche ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer', style: 'destructive', onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/saved-searches/${id}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            setSearches(prev => prev.filter(s => s.id !== id));
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de supprimer la recherche.');
                        }
                    }
                }
            ]
        );
    };

    const handlePress = (search: SavedSearch) => {
        // Navigate to market with params
        // We pass params via query to market screen
        // Assuming market screen can read these params (we might need to update market.tsx to read params from router)
        // Actually tabs navigation with params is tricky in Expo Router v2/v3 sometimes.
        // But we can try pushing to /market with params, or update global state.
        // Let's try pushing to market with query params.
        // But market is a tab... router.push('/(tabs)/market') might work.

        const params = new URLSearchParams();
        if (search.query) params.append('q', search.query);
        if (search.category) params.append('category', search.category);

        router.push(`/(tabs)/market?${params.toString()}` as any);
    };

    const renderItem = ({ item }: { item: SavedSearch }) => (
        <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
            <View style={styles.iconContainer}>
                <Ionicons name="search" size={24} color="#4C7B4B" />
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.queryText}>
                    {item.query || 'Tous les articles'}
                </Text>
                <Text style={styles.detailsText}>
                    {item.category || 'Toutes catégories'} • {format(new Date(item.created_at), 'dd MMM yyyy', { locale: fr })}
                </Text>
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#ff5252" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mes Recherches Sauvegardées</Text>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4C7B4B" />
                </View>
            ) : searches.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="bookmarks-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Aucune recherche sauvegardée</Text>
                    <Text style={styles.emptySubtext}>
                        Faites une recherche dans le Marché et cliquez sur le signet pour la sauvegarder.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={searches}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    list: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contentContainer: {
        flex: 1,
    },
    queryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    detailsText: {
        fontSize: 12,
        color: '#666',
    },
    deleteButton: {
        padding: 8,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
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
