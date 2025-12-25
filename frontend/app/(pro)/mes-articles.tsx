
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';

export default function MesArticlesScreen() {
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            console.log('Fetching pro items...');
            const response = await axios.get(`${API_URL}/pro/items`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Pro items response:', response.data);
            setItems(response.data.items || []);
        } catch (error) {
            console.error('Error fetching items:', error);
            Alert.alert('Erreur', 'Impossible de charger vos articles');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const deleteItem = async (itemId: string) => {
        Alert.alert(
            "Suppression",
            "Voulez-vous vraiment supprimer cet article ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/items/${itemId}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            // Refresh list locally
                            setItems(current => current.filter(i => i.id !== itemId));
                            Alert.alert("Succès", "Article supprimé");
                        } catch (error: any) {
                            Alert.alert("Erreur", error.response?.data?.detail || "Impossible de supprimer");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Image
                source={{ uri: item.photos?.[0] || 'https://via.placeholder.com/150' }}
                style={styles.image}
            />
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.price}>{(item.price_cents / 100).toFixed(2)}€</Text>
                <View style={styles.statusBadge}>
                    <Text style={[
                        styles.statusText,
                        item.status === 'active' ? styles.statusActive : styles.statusSold
                    ]}>
                        {item.status === 'active' ? 'En ligne' : item.status === 'sold' ? 'Vendu' : item.status}
                    </Text>
                </View>
                <Text style={styles.date}>Ajouté le {new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteItem(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#d32f2f" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScreenHeader title="Mes Articles Seconde Main" rightAction={
                <TouchableOpacity onPress={() => router.push('/(pro)/nouvel-article')}>
                    <Ionicons name="add-circle" size={32} color="#4C7B4B" />
                </TouchableOpacity>
            } />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4C7B4B" />
                </View>
            ) : items.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="shirt-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Aucun article en vente.</Text>
                    <Text style={styles.emptySub}>Mettez en avant vos produits de seconde main.</Text>
                    <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(pro)/nouvel-article')}>
                        <Text style={styles.ctaText}>Ajouter un article</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16 },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center'
    },
    image: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#eee' },
    info: { flex: 1, marginLeft: 12 },
    title: { fontSize: 16, fontWeight: '600', color: '#333' },
    price: { fontSize: 16, fontWeight: 'bold', color: '#4C7B4B', marginTop: 4 },
    date: { fontSize: 12, color: '#999', marginTop: 4 },
    statusBadge: { flexDirection: 'row', marginTop: 4 },
    statusText: { fontSize: 12, fontWeight: '500' },
    statusActive: { color: '#4caf50' },
    statusSold: { color: '#9e9e9e' },
    deleteBtn: { padding: 8 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#666', marginTop: 16 },
    emptySub: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },
    ctaButton: {
        marginTop: 24,
        backgroundColor: '#4C7B4B',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    ctaText: { color: '#fff', fontWeight: 'bold' },
});
