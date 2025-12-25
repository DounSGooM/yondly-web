import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../src/store/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import OfferMessage from '../src/components/OfferMessage';
import BookingMessage from '../src/components/BookingMessage';
import { Message as MessageType, Offer } from '../src/types';
import { getLevelBadge } from '../src/utils/levelBadges';

import { API_URL } from '../src/config/api';
import ScreenHeader from '../src/components/ScreenHeader';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  // Support both 'id' (from item-detail) and 'itemId' (from messages list)
  const itemId = (params.itemId || params.id) as string;
  const { user, token } = useAuthStore();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [offers, setOffers] = useState<Record<string, Offer>>({});
  const [bookings, setBookings] = useState<Record<string, any>>({});
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [item, setItem] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (itemId) {
      console.log('Chat detail - itemId:', itemId);
      fetchItem();
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // Poll every 5s
      return () => clearInterval(interval);
    } else {
      console.log('Chat detail - No itemId found in params:', params);
    }
  }, [itemId]);

  const fetchItem = async () => {
    try {
      const response = await axios.get(`${API_URL}/items/${itemId}`);
      setItem(response.data);
    } catch (error) {
      console.error('Error fetching item:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/item/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);

      // Fetch offers for messages that have offer_id
      const offerIds = response.data
        .filter((msg: MessageType) => msg.offer_id)
        .map((msg: MessageType) => msg.offer_id);

      if (offerIds.length > 0) {
        const offersMap: Record<string, Offer> = {};
        await Promise.all(
          offerIds.map(async (offerId: string) => {
            try {
              const offerResponse = await axios.get(`${API_URL}/offers/${offerId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              offersMap[offerId] = offerResponse.data;
            } catch (error) {
              console.error(`Error fetching offer ${offerId}:`, error);
            }
          })
        );
        setOffers(offersMap);
      }

      // Fetch bookings for messages that have booking_id
      const bookingIds = response.data
        .filter((msg: MessageType) => (msg as any).booking_id)
        .map((msg: MessageType) => (msg as any).booking_id);

      if (bookingIds.length > 0) {
        const bookingsMap: Record<string, any> = {};
        await Promise.all(
          bookingIds.map(async (bookingId: string) => {
            try {
              const bookingResponse = await axios.get(`${API_URL}/bookings/${bookingId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              bookingsMap[bookingId as string] = bookingResponse.data;
            } catch (error) {
              console.error(`Error fetching booking ${bookingId}:`, error);
            }
          })
        );
        setBookings(bookingsMap);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await axios.put(
        `${API_URL}/messages/mark-read/${itemId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleEndReached = () => {
    // Mark messages as read when user scrolls to the end (bottom)
    markMessagesAsRead();
  };


  const sendMessage = async () => {
    if (!inputText.trim() || !item) return;

    const toId = user?.id === item.owner_id
      ? messages.find(m => m.from_id !== user?.id)?.from_id || item.owner_id
      : item.owner_id;

    setSending(true);
    try {
      await axios.post(
        `${API_URL}/messages`,
        {
          item_id: itemId,
          to_id: toId,
          text: inputText.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInputText('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item: message }: { item: MessageType }) => {
    const isMine = message.from_id === user?.id;
    const isCurrentUserSeller = item?.owner_id === user?.id;

    // If this is an offer message, render the special OfferMessage component
    if (message.offer_id && offers[message.offer_id]) {
      return (
        <View style={styles.messageContainer}>
          <OfferMessage
            message={message}
            offer={offers[message.offer_id]}
            isCurrentUserSeller={isCurrentUserSeller}
            currentUserId={user?.id || ''}
            onOfferUpdated={fetchMessages}
          />
        </View>
      );
    }

    // If this is a booking message, render the BookingMessage component
    if ((message as any).booking_id && bookings[(message as any).booking_id]) {
      return (
        <View style={styles.messageContainer}>
          <BookingMessage
            message={message}
            booking={bookings[(message as any).booking_id]}
            isCurrentUserOwner={isCurrentUserSeller}
            currentUserId={user?.id || ''}
            onBookingUpdated={fetchMessages}
          />
        </View>
      );
    }

    // Regular message
    return (
      <View
        style={[
          styles.messageContainer,
          isMine ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
          <Text style={[styles.messageText, isMine && styles.myMessageText]}>
            {message.text}
          </Text>
          <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
            {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4C7B4B" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScreenHeader
        title={
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>{item?.title || 'Chat'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Text style={styles.headerSubtitle}>
                {item?.owner?.display_name || 'Utilisateur'}
              </Text>
              {item?.owner?.level && (
                <Text style={{ fontSize: 12 }}>{getLevelBadge(item.owner.level).label.split(' ')[1]}</Text>
              )}
            </View>
          </View>
        }
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucun message</Text>
            <Text style={styles.emptySubtext}>Commencez la conversation!</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Votre message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          <Ionicons
            name={sending ? 'hourglass' : 'send'}
            size={24}
            color={inputText.trim() && !sending ? '#fff' : '#ccc'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  // header, backButton, headerInfo removed
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  theirMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    backgroundColor: '#4C7B4B',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  myMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
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
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4C7B4B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
});
