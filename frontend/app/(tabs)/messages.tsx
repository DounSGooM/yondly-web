import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { Swipeable } from 'react-native-gesture-handler';

import { API_URL } from '../../src/config/api';

interface Conversation {
  itemId: string;
  itemTitle: string;
  itemPhoto?: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  hasUnread: boolean;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    try {
      // Récupérer tous les messages de l'utilisateur
      const response = await axios.get(`${API_URL}/messages/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const messages = response.data;

      // Grouper les messages par conversation (item_id + autre utilisateur)
      const convMap = new Map<string, any>();

      for (const msg of messages) {
        const otherUserId = msg.from_id === user?.id ? msg.to_id : msg.from_id;
        const convKey = `${msg.item_id}_${otherUserId}`;

        if (!convMap.has(convKey) || new Date(msg.created_at) > new Date(convMap.get(convKey).lastMessageTime)) {
          // Récupérer les détails de l'item et de l'utilisateur
          const itemResponse = await axios.get(`${API_URL}/items/${msg.item_id}`);
          const userResponse = await axios.get(`${API_URL}/users/${otherUserId}`);

          // Count unread messages for this conversation
          const unreadCount = messages.filter((m: any) =>
            m.item_id === msg.item_id &&
            m.from_id === otherUserId &&
            m.to_id === user?.id &&
            !m.read_by?.includes(user?.id)
          ).length;

          convMap.set(convKey, {
            itemId: msg.item_id,
            itemTitle: itemResponse.data.title,
            itemPhoto: itemResponse.data.photos?.[0],
            otherUserId: otherUserId,
            otherUserName: userResponse.data.display_name || userResponse.data.email,
            lastMessage: msg.text,
            lastMessageTime: msg.created_at,
            unreadCount,
            hasUnread: unreadCount > 0,
          });
        }
      }

      const convList = Array.from(convMap.values()).sort(
        (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      setConversations(convList);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteConversation = async (itemId: string, deleteForAll: boolean = false) => {
    try {
      await axios.delete(`${API_URL}/messages/conversation/${itemId}`, {
        params: { delete_for_all: deleteForAll },
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove from local state
      setConversations(convs => convs.filter(c => c.itemId !== itemId));
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Suppression impossible');
    }
  };

  const confirmDelete = (item: Conversation, isOwner: boolean) => {
    if (isOwner) {
      // Owner can choose to delete for self or all
      Alert.alert(
        'Supprimer la conversation',
        'Voulez-vous supprimer cette conversation ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Pour moi seulement',
            onPress: () => handleDeleteConversation(item.itemId, false),
          },
          {
            text: 'Pour tous',
            style: 'destructive',
            onPress: () => handleDeleteConversation(item.itemId, true),
          },
        ]
      );
    } else {
      // Non-owner can only delete for self
      Alert.alert(
        'Supprimer la conversation',
        'Voulez-vous masquer cette conversation ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Masquer',
            style: 'destructive',
            onPress: () => handleDeleteConversation(item.itemId, false),
          },
        ]
      );
    }
  };


  useEffect(() => {
    fetchConversations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const renderRightActions = (item: Conversation) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => confirmDelete(item, false)} // Simplified - we'll determine ownership in the function
      >
        <Ionicons name="trash" size={24} color="#fff" />
        <Text style={styles.deleteText}>Supprimer</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item)}
      overshootRight={false}
    >
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() =>
          router.push({
            pathname: '/chat-detail',
            params: {
              itemId: item.itemId,
              otherUserId: item.otherUserId,
              itemTitle: item.itemTitle,
            },
          } as any)
        }
      >
        {item.itemPhoto ? (
          <Image source={{ uri: item.itemPhoto }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImage, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={32} color="#ccc" />
          </View>
        )}

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.itemTitle}
            </Text>
            <Text style={styles.timeText}>
              {format(new Date(item.lastMessageTime), 'dd MMM', { locale: fr })}
            </Text>
          </View>

          <View style={styles.userRow}>
            <Ionicons name="person-circle-outline" size={16} color="#666" />
            <Text style={styles.userName}>{item.otherUserName}</Text>
          </View>

          <Text style={styles.lastMessage} numberOfLines={2}>
            {item.lastMessage}
          </Text>

          {item.hasUnread && (
            <View style={styles.unreadDot} />
          )}
        </View>

        <Ionicons name="chevron-forward" size={24} color="#ccc" />
      </TouchableOpacity>
    </Swipeable>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Aucune conversation</Text>
          <Text style={styles.emptySubtext}>
            Vos discussions apparaîtront ici
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.itemId}_${item.otherUserId}`}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4C7B4B']}
            />
          }
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    padding: 16,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#999',
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4C7B4B',
  },
  deleteAction: {
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginBottom: 12,
  },
  deleteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
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
    marginTop: 8,
  },
});
