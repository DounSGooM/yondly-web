import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Envoyer une notification locale
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any
) {
  // Ne pas envoyer de notifications sur web
  if (Platform.OS === 'web') {
    console.log('Notification (web):', title, body);
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Immédiatement
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * Notification pour une nouvelle offre (vendeur)
 */
export async function notifyNewOffer(
  itemTitle: string,
  buyerName: string,
  offerAmount: number
) {
  await sendLocalNotification(
    '💰 Nouvelle offre !',
    `${buyerName} propose ${(offerAmount / 100).toFixed(2)}€ pour "${itemTitle}"`,
    { type: 'new_offer' }
  );
}

/**
 * Notification pour un achat direct (vendeur)
 */
export async function notifyDirectPurchase(
  itemTitle: string,
  buyerName: string,
  amount: number
) {
  await sendLocalNotification(
    '🎉 Article vendu !',
    `${buyerName} a acheté "${itemTitle}" pour ${(amount / 100).toFixed(2)}€`,
    { type: 'direct_purchase' }
  );
}

/**
 * Notification pour un don réclamé (donneur)
 */
export async function notifyDonationClaimed(
  itemTitle: string,
  claimerName: string
) {
  await sendLocalNotification(
    '✅ Don réclamé !',
    `${claimerName} souhaite récupérer votre don "${itemTitle}"`,
    { type: 'donation_claimed' }
  );
}

/**
 * Notification pour offre acceptée (acheteur)
 */
export async function notifyOfferAccepted(
  itemTitle: string,
  offerAmount: number,
  hoursRemaining: number
) {
  await sendLocalNotification(
    '✅ Offre acceptée !',
    `Votre offre de ${(offerAmount / 100).toFixed(2)}€ pour "${itemTitle}" a été acceptée. Payez dans les ${hoursRemaining}h.`,
    { type: 'offer_accepted' }
  );
}

/**
 * Notification pour offre refusée (acheteur)
 */
export async function notifyOfferDeclined(
  itemTitle: string,
  offerAmount: number
) {
  await sendLocalNotification(
    '❌ Offre refusée',
    `Votre offre de ${(offerAmount / 100).toFixed(2)}€ pour "${itemTitle}" a été refusée`,
    { type: 'offer_declined' }
  );
}

/**
 * Demander les permissions de notifications
 */
export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') return true;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}
