import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useAuthStore } from '../store/authStore';
import { PublicList, Item } from '../types';

interface AddToInspirationModalProps {
    visible: boolean;
    item: Item;
    onClose: () => void;
}

export default function AddToInspirationModal({
    visible,
    item,
    onClose,
}: AddToInspirationModalProps) {
    const { user, token } = useAuthStore();
    const [lists, setLists] = useState<PublicList[]>([]);
    const [loading, setLoading] = useState(false);
    const [addingMap, setAddingMap] = useState<{ [key: string]: boolean }>({}); // To track loading state per list

    // Create new list state
    const [isCreating, setIsCreating] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [creatingLoading, setCreatingLoading] = useState(false);

    useEffect(() => {
        if (visible && user) {
            fetchUserLists();
        }
    }, [visible, user]);

    const fetchUserLists = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/public-lists`, {
                params: { user_id: user?.id },
                headers: { Authorization: `Bearer ${token}` }
            });
            setLists(response.data);
        } catch (error) {
            console.log('Error fetching lists', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateList = async () => {
        if (!newListName.trim()) return;

        // Frontend check for level (though backend enforces it too)
        const allowedLevels = ['Arbre', 'Forêt'];
        if (user && !allowedLevels.includes(user.level)) {
            Alert.alert(
                'Niveau Insuffisant 🌱',
                'Vous devez être au moins "Arbre" (500kg CO2) pour créer des listes publiques. Continuez vos efforts !'
            );
            return;
        }

        if (user?.level === 'Arbre' && lists.length >= 3) {
            Alert.alert(
                'Limite Atteinte 🌳',
                'Les membres Arbre peuvent créer jusqu\'à 3 listes. Devenez Forêt pour en créer en illimité !'
            );
            return;
        }

        try {
            setCreatingLoading(true);
            const response = await axios.post(
                `${API_URL}/public-lists`,
                { name: newListName, description: '', item_ids: [] },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLists([response.data, ...lists]);
            setNewListName('');
            setIsCreating(false);
            // Auto add item to the new list? Maybe, but let's keep it manual for now to be safe
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Impossible de créer la liste.';
            Alert.alert('Erreur', msg);
        } finally {
            setCreatingLoading(false);
        }
    };

    const handleAddItem = async (listId: string) => {
        // Optimistic UI check? No, let's just do the call
        setAddingMap(prev => ({ ...prev, [listId]: true }));
        try {
            await axios.post(
                `${API_URL}/public-lists/${listId}/items`,
                { item_id: item.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Show success briefly
            const list = lists.find(l => l.id === listId);
            if (list) {
                // Update local list item_ids to prevent re-add and show state
                list.item_ids = [...(list.item_ids || []), item.id];
                setLists([...lists]);
            }
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Impossible d\'ajouter l\'article.';
            if (msg === 'Item already in list') {
                // Ignore if already there
            } else {
                Alert.alert('Erreur', msg);
            }
        } finally {
            setAddingMap(prev => ({ ...prev, [listId]: false }));
        }
    };

    const isItemInList = (list: PublicList) => {
        return list.item_ids?.includes(item.id);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Ajouter à une inspiration</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Item Preview */}
                    <View style={styles.itemPreview}>
                        {item.photos && item.photos.length > 0 ? (
                            <Image source={{ uri: item.photos[0] }} style={styles.itemImage} />
                        ) : (
                            <View style={[styles.itemImage, { backgroundColor: '#eee' }]} />
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.itemPrice}>{item.price_cents ? `€${item.price_cents / 100}` : 'Don'}</Text>
                        </View>
                    </View>

                    {/* Lists */}
                    {loading ? (
                        <ActivityIndicator size="large" color="#4C7B4B" style={{ marginVertical: 20 }} />
                    ) : (
                        <ScrollView style={styles.listContainer}>
                            {lists.length === 0 && !isCreating ? (
                                <View style={styles.emptyState}>
                                    <Text style={{ textAlign: 'center', color: '#666', marginBottom: 10 }}>
                                        Vous n'avez pas encore de liste.
                                    </Text>
                                    {!user || ['Graine', 'Pousse'].includes(user.level) ? (
                                        <View style={styles.levelLocked}>
                                            <Ionicons name="lock-closed" size={16} color="#666" />
                                            <Text style={styles.lockedText}>
                                                Niveau Arbre (500kg) requis pour créer des listes.
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            ) : null}

                            {lists.map(list => {
                                const added = isItemInList(list);
                                const adding = addingMap[list.id];
                                return (
                                    <TouchableOpacity
                                        key={list.id}
                                        style={[styles.listItem, added && styles.listItemAdded]}
                                        onPress={() => !added && handleAddItem(list.id)}
                                        disabled={added || adding}
                                    >
                                        <View style={styles.listIcon}>
                                            <Ionicons name="list" size={20} color="#fff" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.listName}>{list.name}</Text>
                                            <Text style={styles.listCount}>{(list.item_ids || []).length} articles</Text>
                                        </View>
                                        {adding ? (
                                            <ActivityIndicator size="small" color="#4C7B4B" />
                                        ) : added ? (
                                            <Ionicons name="checkmark-circle" size={24} color="#4C7B4B" />
                                        ) : (
                                            <Ionicons name="add-circle-outline" size={24} color="#ccc" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}

                    {/* Create New List */}
                    {user && ['Arbre', 'Forêt'].includes(user.level) && (
                        <View style={styles.createContainer}>
                            {isCreating ? (
                                <View style={styles.createForm}>
                                    <TextInput
                                        style={styles.createInput}
                                        placeholder="Nom de la liste..."
                                        value={newListName}
                                        onChangeText={setNewListName}
                                        autoFocus
                                    />
                                    <TouchableOpacity
                                        style={styles.createConfirmButton}
                                        onPress={handleCreateList}
                                        disabled={creatingLoading}
                                    >
                                        {creatingLoading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="arrow-forward" size={20} color="#fff" />}
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.createButton}
                                    onPress={() => setIsCreating(true)}
                                >
                                    <Ionicons name="add" size={20} color="#4C7B4B" />
                                    <Text style={styles.createButtonText}>Créer une nouvelle liste</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
        minHeight: 400,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    itemPreview: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    itemImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: 12,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: 14,
        color: '#4C7B4B',
        fontWeight: 'bold',
    },
    listContainer: {
        maxHeight: 300,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 10,
    },
    listItemAdded: {
        borderColor: '#e8f5e9',
        backgroundColor: '#f1f8e9',
    },
    listIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ffb74d',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    listName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    listCount: {
        fontSize: 12,
        color: '#666',
    },
    emptyState: {
        alignItems: 'center',
        padding: 20,
    },
    createContainer: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 16,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#e8f5e9',
    },
    createButtonText: {
        marginLeft: 8,
        color: '#4C7B4B',
        fontWeight: '600',
        fontSize: 15,
    },
    createForm: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    createInput: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        marginRight: 10,
    },
    createConfirmButton: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#4C7B4B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelLocked: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        backgroundColor: '#eee',
        padding: 8,
        borderRadius: 8,
    },
    lockedText: {
        fontSize: 12,
        color: '#666',
        flex: 1,
    },
});
