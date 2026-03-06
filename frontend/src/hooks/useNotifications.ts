import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Ne pas essayer d'obtenir le push token en développement (cause des erreurs)
    // Les notifications locales fonctionnent sans
    if (Platform.OS !== 'web') {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          setExpoPushToken(token);
        }
      }).catch(err => {
        console.log('Push notifications setup skipped:', err.message);
      });
    }

    // Listener pour les notifications reçues
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Listener pour les interactions avec les notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4C7B4B',
      });
    } catch (e) {
      console.log('Error setting notification channel:', e);
    }
  }

  if (Device.isDevice) {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission de notification refusée');
        return;
      }

      // Les notifications locales fonctionnent même sans push token
      // Le push token n'est nécessaire que pour les notifications serveur (FCM)
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (projectId) {
          token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        }
      } catch (e) {
        // C'est normal en développement Expo Go - les notifications locales fonctionneront quand même
        console.log('Push token non disponible (normal en Expo Go)');
      }
    } catch (e) {
      console.log('Error during notification setup:', e);
    }
  } else {
    console.log('Les notifications nécessitent un appareil physique');
  }

  return token;
}

export async function scheduleLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Immédiatement
  });
}

export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}
