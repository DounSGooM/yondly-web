import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { scheduleLocalNotification, setBadgeCount } from './useNotifications';
import { AppState } from 'react-native';

import { API_URL } from '../config/api';
const POLLING_INTERVAL = 10000; // 10 secondes

export function useMessageNotifications() {
  const { token, user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const lastMessageCountRef = useRef<number>(0);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!token || !user) return;

    // Fonction pour vérifier les nouveaux messages
    const checkNewMessages = async () => {
      try {
        const response = await axios.get(`${API_URL}/messages/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const messages = response.data;

        // Compter les messages reçus (non envoyés par l'utilisateur)
        const receivedMessages = messages.filter((msg: any) => msg.to_id === user.id);
        const currentCount = receivedMessages.length;

        // Si on a plus de messages qu'avant et l'app est en background
        if (currentCount > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
          const newMessagesCount = currentCount - lastMessageCountRef.current;

          // Envoyer une notification locale
          if (appState.current !== 'active') {
            await scheduleLocalNotification(
              'Nouveau message',
              newMessagesCount === 1
                ? 'Vous avez reçu un nouveau message'
                : `Vous avez ${newMessagesCount} nouveaux messages`,
              { type: 'new_message' }
            );
          }
        }

        lastMessageCountRef.current = currentCount;
        setUnreadCount(currentCount);

        // Mettre à jour le badge
        await setBadgeCount(currentCount);
      } catch (error) {
        console.error('Error checking messages:', error);
      }
    };

    // Vérifier immédiatement
    checkNewMessages();

    // Puis vérifier régulièrement
    const interval = setInterval(checkNewMessages, POLLING_INTERVAL);

    // Écouter les changements d'état de l'app
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;

      // Quand l'app redevient active, vérifier les messages
      if (nextAppState === 'active') {
        checkNewMessages();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [token, user]);

  return { unreadCount };
}
