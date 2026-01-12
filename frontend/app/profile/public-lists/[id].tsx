import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../../src/store/authStore';
import { PublicList, Item } from '../../../src/types';
import { API_URL } from '../../../src/config/api';
import ItemGridCard from '../../../src/components/ItemGridCard';

export default function PublicListDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { token, user } = useAuthStore();
    const [list, setList] = useState<PublicList | null>(null);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Item[]>([]);

    useEffect(() => {
        if (id) {
            fetchListDetails();
        }
    }, [id]);

    const fetchListDetails = async () => {
        try {
            const response = await axios.get(`${API_URL}/public-lists/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setList(response.data);
            setItems(response.data.items || []); // Backend populates "items"
        } catch (error) {
            console.error('Error fetching list details:', error);
            Alert.alert('Erreur', 'Impossible de charger la liste.');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!list) return;
        try {
            await Share.share({
                message: `Découvre ma liste "${list.name}" sur Loop !`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        Alert.alert(
            'Retirer',
            'Retirer cet article de la liste ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Retirer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Optimistic update
                            setItems(current => current.filter(i => i.id !== itemId));

                            await axios.delete(`${API_URL}/public-lists/${id}/items/${itemId}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de retirer l\'article.');
                            fetchListDetails(); // Revert on error
                        }
                    },
                },
            ]
        );
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.titleRow}>
                <View style={styles.iconContainer}>
                    <Ionicons name="list" size={32} color="#ffb74d" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.listName}>{list?.name}</Text>
                    <Text style={styles.listDesc}>{list?.description || 'Aucune description'}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color="#4C7B4B" />
                <Text style={styles.shareText}>Partager</Text>
            </TouchableOpacity>
        </View>
    );

    const renderItem = ({ item }: { item: Item }) => (
        <View style={styles.itemWrapper}>
            <ItemGridCard
                item={item}
            />
            {list?.user_id === user?.id && (
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.id)}
                >
                    <Ionicons name="close-circle" size={24} color="#ef5350" />
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4C7B4B" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: list?.name || 'Liste', headerBackTitle: 'Retour' }} />

            <View style={styles.appBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.appBarTitle} numberOfLines={1}>{list?.name}</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderHeader}
                columnWrapperStyle={styles.columnWrapper}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="basket-outline" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>Cette liste est vide pour le moment.</Text>
                        <Text style={styles.emptySubtext}>Ajoutez des articles depuis le catalogue !</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 4,
    },
    appBarTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    headerContainer: {
        padding: 20,
        backgroundColor: '#fff',
        marginBottom: 16,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff3e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    listName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    listDesc: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f8e9',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    shareText: {
        color: '#4C7B4B',
        fontWeight: '600',
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 40,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    itemWrapper: {
        width: '48%',
        marginBottom: 16,
        position: 'relative',
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
        padding: 20,
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
    },

});
