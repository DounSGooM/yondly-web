import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

interface ItemGridCardProps {
  item: any;
  layout?: 'grid' | 'list';
}

const QUICK_CO2: Record<string, number> = {
  'Électronique': 50, 'High-Tech': 50,
  'Vêtements': 12, 'Mode': 12,
  'Maison': 50, 'Meubles': 50,
  'Sports': 20, 'Loisirs': 20,
  'Livres': 1.5, 'Jouets': 8,
  'Bricolage': 25, 'Jardin': 25,
  'default': 10,
};

const TYPE_COLORS: Record<string, string> = {
  donation: colors.primary,
  sale: '#1A73E8',
  rent: '#7B4FBE',
  antigaspi: colors.accent,
};

const TYPE_LABELS: Record<string, string> = {
  donation: 'Don',
  sale: 'Vente',
  rent: 'Location',
  antigaspi: 'Anti-gaspi',
};

export default function ItemGridCard({ item, layout = 'grid' }: ItemGridCardProps) {
  const router = useRouter();

  const co2 = item.co2_estimate?.co2_saved_kg?.toFixed(1)
    ?? (QUICK_CO2[item.category] || QUICK_CO2['default']);

  const typeColor = TYPE_COLORS[item.type] || colors.primary;
  const typeLabel = TYPE_LABELS[item.type] || item.type;

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(0)} €`;

  const isList = layout === 'list';

  return (
    <TouchableOpacity
      style={[styles.card, isList && styles.cardList]}
      onPress={() => router.push(`/item-detail?id=${item.id}` as any)}
      activeOpacity={0.85}
    >
      {/* Image */}
      <View style={[styles.imgBox, isList && styles.imgBoxList]}>
        {item.photos?.length > 0 ? (
          <Image source={{ uri: item.photos[0] }} style={styles.img} resizeMode="cover" />
        ) : (
          <View style={[styles.img, styles.imgPlaceholder]}>
            <Ionicons name="image-outline" size={36} color={colors.border} />
          </View>
        )}

        {/* Type pill */}
        <View style={[styles.typePill, { backgroundColor: typeColor }]}>
          <Text style={styles.typePillText}>{typeLabel}</Text>
        </View>

        {/* Urgency for donations */}
        {item.type === 'donation' && item.urgency_hours && (
          <View style={[styles.urgencyBadge, {
            backgroundColor: item.urgency_hours <= 6 ? colors.error : colors.accent
          }]}>
            <Ionicons name="time-outline" size={10} color="#fff" />
            <Text style={styles.urgencyText}>{item.urgency_hours}h</Text>
          </View>
        )}

        {/* Price overlay */}
        {item.type === 'sale' && item.price_cents > 0 && (
          <View style={[styles.pricePill, { backgroundColor: '#1A73E8' }]}>
            <Text style={styles.priceText}>{formatPrice(item.price_cents)}</Text>
          </View>
        )}
        {item.type === 'rent' && item.price_per_day_cents > 0 && (
          <View style={[styles.pricePill, { backgroundColor: '#7B4FBE' }]}>
            <Text style={styles.priceText}>{formatPrice(item.price_per_day_cents)}/j</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={isList ? 1 : 2}>{item.title}</Text>

        <View style={styles.meta}>
          {/* Distance */}
          {item.distance_km !== undefined && (
            <View style={styles.metaRow}>
              <Ionicons name="location-sharp" size={12} color={typeColor} />
              <Text style={[styles.metaText, { color: typeColor }]}>
                {item.distance_km < 1
                  ? `${(item.distance_km * 1000).toFixed(0)} m`
                  : `${item.distance_km.toFixed(1)} km`}
              </Text>
            </View>
          )}

          {/* CO2 */}
          {item.type !== 'antigaspi' && (
            <View style={styles.co2Row}>
              <Ionicons name="leaf" size={11} color={colors.primary} />
              <Text style={styles.co2Text}>-{co2} kg CO₂</Text>
            </View>
          )}
        </View>

        {/* Owner */}
        {item.owner && (
          <View style={styles.ownerRow}>
            {item.owner.photo_url ? (
              <Image source={{ uri: item.owner.photo_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Ionicons name="person" size={10} color={colors.textTertiary} />
              </View>
            )}
            <Text style={styles.ownerName} numberOfLines={1}>
              {item.owner.display_name || 'Utilisateur'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  cardList: {
    flexDirection: 'row',
    height: 110,
  },
  imgBox: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceAlt,
  },
  imgBoxList: {
    width: 110,
    aspectRatio: undefined,
    height: '100%',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  imgPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  typePillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  urgencyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  urgencyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  pricePill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  priceText: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  info: {
    padding: Spacing.md,
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  co2Row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  co2Text: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  avatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  avatarFallback: {
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerName: {
    fontSize: 11,
    color: colors.textTertiary,
    flex: 1,
  },
});
