import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { PublicList } from '../../src/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { API_URL } from '../../src/config/api';

export default function PublicListsScreen() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [lists, setLists] = useState<PublicList[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListDesc, setNewListDesc] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchLists();
    }, []);

    const fetchLists = async () => {
        try {
            // In a real app, we might filter by user_id to see MY lists, 
            // but the endpoint currently returns all lists or filtered by user_id.
            // We need to know our own user_id from store, but let's assume get_my_items style or pass user_id param.
            // The backend endpoint `get_public_lists` takes optional `user_id`.
            const user = useAuthStore.getState().user;
            if (!user) return;

            const response = await axios.get(`${API_URL}/public-lists`, {
                params: { user_id: user.id },
                headers: { Authorization: `Bearer ${token}` },
            });
            setLists(response.data);
        } catch (error) {
            console.error('Error fetching lists:', error);
            Alert.alert('Erreur', 'Impossible de charger vos listes.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newListName.trim()) return;

        setCreating(true);
        try {
            const response = await axios.post(
                `${API_URL}/public-lists`,
                { name: newListName, description: newListDesc },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLists([response.data, ...lists]);
            setModalVisible(false);
            setNewListName('');
            setNewListDesc('');
            Alert.alert('Succès', 'Liste créée !');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de créer la liste (réservé aux Experts).');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Supprimer',
            'Voulez-vous supprimer cette liste ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer', style: 'destructive', onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/public-lists/${id}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            setLists(prev => prev.filter(l => l.id !== id));
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de supprimer la liste.');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: PublicList }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/profile/public-lists/${item.id}`)}
        >
            <View style={styles.iconContainer}>
                <Ionicons name="list" size={24} color="#ffb74d" />
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.nameText}>{item.name}</Text>
                {item.description ? <Text style={styles.descText} numberOfLines={1}>{item.description}</Text> : null}
                <Text style={styles.detailsText}>
                    {item.item_ids?.length || 0} articles • {format(new Date(item.created_at), 'dd MMM yyyy', { locale: fr })}
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
                <Text style={styles.headerTitle}>Mes Listes Publiques</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={24} color="#4C7B4B" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4C7B4B" />
                </View>
            ) : lists.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="albums-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Aucune liste publique</Text>
                    <Text style={styles.emptySubtext}>
                        Créez des listes thématiques pour partager vos sélections (ex: "Coin bébé", "Déménagement").
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={lists}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                />
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nouvelle Liste</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Nom de la liste (ex: Rentrée Scolaire)"
                            value={newListName}
                            onChangeText={setNewListName}
                        />

                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            placeholder="Description (optionnelle)"
                            value={newListDesc}
                            onChangeText={setNewListDesc}
                            multiline
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.createButton, (!newListName.trim() || creating) && styles.disabledButton]}
                                onPress={handleCreate}
                                disabled={!newListName.trim() || creating}
                            >
                                {creating ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.createButtonText}>Créer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        justifyContent: 'space-between',
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
    addButton: {
        padding: 8,
        marginRight: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
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
        backgroundColor: '#fff3e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    contentContainer: {
        flex: 1,
    },
    nameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    descText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    detailsText: {
        fontSize: 12,
        color: '#999',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    createButton: {
        backgroundColor: '#4C7B4B',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    cancelButtonText: {
        color: '#333',
        fontWeight: '600',
    },
    createButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
