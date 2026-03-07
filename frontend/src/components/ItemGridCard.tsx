import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors as Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { getLevelBadge } from '../utils/levelBadges';

interface ItemGridCardProps {
  item: any;
  layout?: 'grid' | 'list';
}

// Quick ADEME-based CO2 estimates (kg)
const QUICK_CO2_ESTIMATES: Record<string, number> = {
  'Électronique': 50, 'High-Tech': 50,
  'Vêtements': 12, 'Mode': 12,
  'Maison': 50, 'Meubles': 50,
  'Sports': 20, 'Loisirs': 20,
  'Livres': 1.5, 'Jouets': 8,
  'Bricolage': 25, 'Jardin': 25,
  'default': 10,
};

export default function ItemGridCard({ item, layout = 'grid' }: ItemGridCardProps) {
  const router = useRouter();

  const getUrgencyColor = (hours: number) => {
    if (hours <= 6) return Colors.error;
    if (hours <= 24) return Colors.warning;
    return Colors.success;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      electronics: '📱',
      furniture: '🛋️',
      clothing: '👕',
      sports: '⚽',
      books: '📚',
      children: '🧸',
      hobbies: '🎨',
      home: '🏠',
      vehicles: '🚗',
      tools: '🔧',
      other: '➕',
    };
    return icons[category] || '🏷️';
  };

  const formatPrice = (cents: number) => {
    return `${(cents / 100).toFixed(0)}€`;
  };

  // Get CO2 estimate from category or AI
  const getCO2Estimate = () => {
    if (item.co2_estimate && item.co2_estimate.co2_saved_kg) {
      return item.co2_estimate.co2_saved_kg.toFixed(1);
    }
    const category = item.category || 'default';
    return QUICK_CO2_ESTIMATES[category] || QUICK_CO2_ESTIMATES['default'];
  };

  return (
    <TouchableOpacity
      style={[styles.card, layout === 'list' && styles.cardList]}
      onPress={() => router.push(`/item-detail?id=${item.id}` as any)}
      activeOpacity={0.8}
    >
      {/* Image Container */}
      <View style={[styles.imageContainer, layout === 'list' && styles.imageContainerList]}>

        {item.photos && item.photos.length > 0 ? (
          <Image
            source={{ uri: item.photos[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={48} color={Colors.border} />
          </View>
        )}


        {/* CO2 Badge - Show on all items except anti-gaspi */}
        {item.type !== 'antigaspi' && (
          <View style={styles.co2Badge}>
            <Ionicons name="leaf" size={12} color={Colors.primary} />
            <Text style={styles.co2Text}>-{getCO2Estimate()}kg</Text>
          </View>
        )}

        {/* Urgency Badge for donations */}
        {item.type === 'donation' && item.urgency_hours && (
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency_hours) }]}>
            <Ionicons name="time" size={12} color="#fff" />
            <Text style={styles.urgencyText}>{item.urgency_hours}h</Text>
          </View>
        )}

        {/* Price Badge for sales */}
        {item.type === 'sale' && item.price_cents && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{formatPrice(item.price_cents)}</Text>
          </View>
        )}

        {/* Rent Badge */}
        {item.type === 'rent' && item.price_per_day_cents && (
          <View style={styles.rentBadge}>
            <Text style={styles.rentText}>{formatPrice(item.price_per_day_cents)}/j</Text>
          </View>
        )}
      </View>

      {/* Info Container */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Distance or Location */}
        {item.distance_km !== undefined ? (
          <View style={styles.distanceRow}>
            <Ionicons name="location" size={14} color={Colors.primary} />
            <Text style={styles.distanceText}>{item.distance_km.toFixed(1)} km</Text>
          </View>
        ) : item.location?.address ? (
          <View style={styles.distanceRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.addressText} numberOfLines={1}>{item.location.address}</Text>
          </View>
        ) : null}

        {/* Owner Avatar (if available) */}
        {item.owner?.photo_url && (
          <View style={styles.ownerRow}>
            <Image
              source={{ uri: item.owner.photo_url }}
              style={styles.ownerAvatar}
            />
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.ownerName} numberOfLines={1}>
                {item.owner.display_name || item.owner.username}
              </Text>
              {item.owner.level && (
                <View style={{ backgroundColor: getLevelBadge(item.owner.level).color, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 8 }}>
                  <Text style={{ fontSize: 8, color: '#fff', fontWeight: 'bold' }}>{getLevelBadge(item.owner.level).label.split(' ')[1]}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  cardList: {
    flexDirection: 'row',
    height: 120, // Fixed height for list view
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.background,
  },
  imageContainerList: {
    width: 120,
    height: '100%',
    aspectRatio: undefined, // Remove aspect ratio for list view
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  urgencyBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  urgencyText: {
    color: '#fff',
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  priceBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    ...Shadows.button,
  },
  priceText: {
    color: Colors.textInverse,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  rentBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.info,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    ...Shadows.button,
  },
  rentText: {
    color: Colors.textInverse,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  co2Badge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
    ...Shadows.button,
  },
  co2Text: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  infoContainer: {
    padding: Spacing.md,
    flex: 1, // Take remaining space in list view
    justifyContent: 'space-between', // Distribute content vertically
  },
  title: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.base * Typography.tight,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  distanceText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
  addressText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 6,
  },
  ownerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.border,
  },
  ownerName: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
});
