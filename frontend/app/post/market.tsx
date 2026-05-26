import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { ItemType } from '../../src/types';
import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Maison', 'Vêtements', 'Électronique', 'Multimédia', 'Véhicules',
  'Sport', 'Livres', 'Enfants', 'Jeux & Jouets', 'Jardin',
  'Bricolage', 'Beauté', 'Animaux', 'Musique', 'Mobilier', 'Autre',
];

const SERVICE_CATEGORIES = [
  'Aide déménagement', 'Cours particuliers', 'Jardinage', 'Bricolage',
  'Garde d\'animaux', 'Covoiturage', 'Cuisine / Repas', 'Informatique',
  'Couture / Retouche', 'Autre',
];

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; description: string }> = {
  sale:     { label: 'Vente',   icon: 'pricetag',       color: '#4C7B4B', bg: '#e8f5e9', description: 'Vendez un objet' },
  donation: { label: 'Don',     icon: 'gift',           color: '#D97706', bg: '#FEF3C7', description: 'Donnez gratuitement' },
  exchange: { label: 'Échange', icon: 'swap-horizontal', color: '#2563EB', bg: '#DBEAFE', description: 'Échangez un objet' },
  service:  { label: 'Service', icon: 'hand-right',     color: '#7C3AED', bg: '#EDE9FE', description: 'Proposez votre aide' },
};

type Condition = 'new' | 'good' | 'repair';

// ─── Component ────────────────────────────────────────────────────────────────

export default function PostMarketScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [step, setStep] = useState(1);

  // Step 1 — commun
  const [type, setType] = useState<ItemType>('sale');
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Maison');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Step 2 — vente / échange
  const [condition, setCondition] = useState<Condition>('good');
  const [priceEuros, setPriceEuros] = useState('');
  const [allowOffers, setAllowOffers] = useState(true);

  // Step 2 — don
  const [urgencyDays, setUrgencyDays] = useState<number>(7);

  // Step 2 — échange
  const [wantedItem, setWantedItem] = useState('');

  // Step 2 — service
  const [serviceDuration, setServiceDuration] = useState('');
  const [serviceAvailability, setServiceAvailability] = useState('');

  // Step 2 — commun
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);

  const config = TYPE_CONFIG[type];

  // ─── Photos ──────────────────────────────────────────────────────────────

  const selectImageSource = () => {
    Alert.alert('Ajouter une photo', 'Choisissez une source', [
      { text: 'Appareil photo', onPress: takePhoto },
      { text: 'Galerie', onPress: pickImage },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission requise', 'Accès caméra nécessaire'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.2, base64: true });
    if (!result.canceled) {
      const uri = result.assets[0].base64
        ? `data:image/jpeg;base64,${result.assets[0].base64}`
        : result.assets[0].uri;
      setPhotos([...photos, uri]);
    }
  };

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission requise', 'Accès galerie nécessaire'); return; }
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.2, base64: true });
    if (!result.canceled) {
      const uri = result.assets[0].base64
        ? `data:image/jpeg;base64,${result.assets[0].base64}`
        : result.assets[0].uri;
      setPhotos([...photos, uri]);
    }
  };

  // ─── Fee calculation ─────────────────────────────────────────────────────

  const calculateFee = (price: number) => {
    const base = Math.round(0.05 * price * 100) / 100 + 0.49;
    const fee = Math.max(Math.min(base, 9.99), 0.99);
    return { fee: fee.toFixed(2), payout: (price - fee).toFixed(2) };
  };

  const price = parseFloat(priceEuros) || 0;
  const { fee, payout } = calculateFee(price);

  // ─── Navigation ──────────────────────────────────────────────────────────

  const handleNext = () => {
    if (step === 1) {
      if (!title.trim()) { Alert.alert('Erreur', 'Veuillez entrer un titre'); return; }
      if (type !== 'service' && photos.length === 0) { Alert.alert('Erreur', 'Ajoutez au moins une photo'); return; }
      setStep(2);
    } else if (step === 2) {
      if (type === 'sale') {
        const p = parseFloat(priceEuros);
        if (isNaN(p) || p < 3) { Alert.alert('Erreur', 'Prix minimum 3 € pour le paiement sécurisé'); return; }
      }
      if (type === 'exchange' && !wantedItem.trim()) { Alert.alert('Erreur', 'Indiquez ce que vous recherchez'); return; }
      if (type === 'service' && !serviceDuration.trim()) { Alert.alert('Erreur', 'Indiquez la durée estimée'); return; }
      setStep(3);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const limitedPhotos = photos.slice(0, 2);
      const priceCents = type === 'sale' ? Math.round(parseFloat(priceEuros) * 100) : undefined;

      const payload: Record<string, unknown> = {
        type,
        title,
        description,
        photos: limitedPhotos,
        category,
        condition: type !== 'service' ? condition : undefined,
        price_cents: priceCents,
        allow_offers: type === 'sale' ? allowOffers : undefined,
        wanted_item: type === 'exchange' ? wantedItem : undefined,
        urgency_days: type === 'donation' ? urgencyDays : undefined,
        service_duration: type === 'service' ? serviceDuration : undefined,
        service_availability: type === 'service' ? serviceAvailability : undefined,
      };

      await axios.post(`${API_URL}/items`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });

      Alert.alert('Publié !', 'Votre annonce est en ligne.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Erreur', error?.response?.data?.detail || error?.message || 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const stepTitle = step === 1 ? 'Nouvelle annonce' : step === 2 ? config.label : 'Localisation';

  const categoryList = type === 'service' ? SERVICE_CATEGORIES : CATEGORIES;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScreenHeader title={stepTitle} />

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map((s, i) => (
          <React.Fragment key={s}>
            <View style={[styles.stepDot, step >= s && { backgroundColor: config.color }]} />
            {i < 2 && <View style={[styles.stepLine, step > s && { backgroundColor: config.color }]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Step 1 ── */}
        {step === 1 && (
          <View>
            {/* Type selector */}
            <Text style={styles.label}>Type d'annonce *</Text>
            <View style={styles.typeGrid}>
              {(Object.entries(TYPE_CONFIG) as [ItemType, typeof TYPE_CONFIG[string]][]).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.typeCard, type === key && { borderColor: cfg.color, backgroundColor: cfg.bg }]}
                  onPress={() => setType(key)}
                >
                  <Ionicons name={cfg.icon as any} size={26} color={type === key ? cfg.color : '#999'} />
                  <Text style={[styles.typeLabel, type === key && { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={[styles.typeDesc, type === key && { color: cfg.color }]}>{cfg.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Photos */}
            <Text style={styles.label}>{type === 'service' ? 'Photo (optionnelle)' : 'Photos *'}</Text>
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => setPhotos(photos.filter((_, i) => i !== index))}>
                    <Ionicons name="close-circle" size={24} color="#d32f2f" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 5 && (
                <TouchableOpacity style={[styles.photoAdd, { borderColor: config.color }]} onPress={selectImageSource}>
                  <Ionicons name="camera" size={28} color={config.color} />
                  <Text style={[styles.photoAddText, { color: config.color }]}>Ajouter</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Titre */}
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              placeholder={type === 'service' ? 'Ex: Aide au jardinage, 2h' : 'Ex: Canapé d\'angle en bon état'}
              value={title}
              onChangeText={setTitle}
              maxLength={60}
            />
            <Text style={styles.hint}>{title.length}/60</Text>

            {/* Catégorie */}
            <Text style={styles.label}>Catégorie *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <Text style={styles.dropdownButtonText}>{category}</Text>
              <Ionicons name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
            </TouchableOpacity>
            {showCategoryDropdown && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                  {categoryList.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.dropdownItem, category === cat && { backgroundColor: config.bg }]}
                      onPress={() => { setCategory(cat); setShowCategoryDropdown(false); }}
                    >
                      <Text style={[styles.dropdownItemText, category === cat && { color: config.color, fontWeight: '600' }]}>{cat}</Text>
                      {category === cat && <Ionicons name="checkmark" size={18} color={config.color} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* ── Step 2 — VENTE ── */}
        {step === 2 && type === 'sale' && (
          <View>
            <Text style={styles.label}>État de l'objet *</Text>
            <ConditionPicker value={condition} onChange={setCondition} color={config.color} bg={config.bg} />

            <Text style={styles.label}>Prix *</Text>
            <View style={[styles.priceInput, { borderColor: config.color }]}>
              <TextInput
                style={[styles.priceInputField, { color: config.color }]}
                placeholder="0"
                value={priceEuros}
                onChangeText={setPriceEuros}
                keyboardType="numeric"
              />
              <Text style={[styles.priceSymbol, { color: config.color }]}>€</Text>
            </View>
            <Text style={styles.hint}>Minimum 3 € pour le paiement sécurisé</Text>

            {price >= 3 && (
              <View style={styles.feeInfo}>
                <Text style={styles.feeTitle}>Simulation des frais</Text>
                <FeeRow label="Prix de vente" value={`${price.toFixed(2)} €`} />
                <FeeRow label="Frais plateforme" value={`-${fee} €`} />
                <FeeRow label="Vous recevez" value={`${payout} €`} bold color={config.color} />
              </View>
            )}

            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleTitle}>Accepter les offres</Text>
                <Text style={styles.toggleSubtitle}>Les acheteurs peuvent proposer un prix</Text>
              </View>
              <Toggle value={allowOffers} onChange={setAllowOffers} color={config.color} />
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="État, dimensions, défauts éventuels..." value={description} onChangeText={setDescription} multiline maxLength={500} />
          </View>
        )}

        {/* ── Step 2 — DON ── */}
        {step === 2 && type === 'donation' && (
          <View>
            <Text style={styles.label}>État de l'objet *</Text>
            <ConditionPicker value={condition} onChange={setCondition} color={config.color} bg={config.bg} />

            <Text style={styles.label}>Disponible pendant</Text>
            <View style={styles.pillRow}>
              {[3, 7, 14, 30].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.pill, urgencyDays === d && { backgroundColor: config.bg, borderColor: config.color }]}
                  onPress={() => setUrgencyDays(d)}
                >
                  <Text style={[styles.pillText, urgencyDays === d && { color: config.color, fontWeight: '600' }]}>
                    {d} jours
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.infoBox, { backgroundColor: config.bg }]}>
              <Ionicons name="gift-outline" size={18} color={config.color} />
              <Text style={[styles.infoText, { color: config.color }]}>
                Votre don sera visible {urgencyDays} jours. Passé ce délai, l'annonce sera archivée automatiquement.
              </Text>
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Pourquoi vous donnez cet objet, son état précis..." value={description} onChangeText={setDescription} multiline maxLength={500} />
          </View>
        )}

        {/* ── Step 2 — ÉCHANGE ── */}
        {step === 2 && type === 'exchange' && (
          <View>
            <Text style={styles.label}>État de l'objet *</Text>
            <ConditionPicker value={condition} onChange={setCondition} color={config.color} bg={config.bg} />

            <Text style={styles.label}>Ce que vous recherchez en échange *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Vélo, matériel de cuisine, livres..."
              value={wantedItem}
              onChangeText={setWantedItem}
              maxLength={100}
            />
            <Text style={styles.hint}>{wantedItem.length}/100</Text>

            <View style={[styles.infoBox, { backgroundColor: config.bg }]}>
              <Ionicons name="swap-horizontal-outline" size={18} color={config.color} />
              <Text style={[styles.infoText, { color: config.color }]}>
                L'échange se fait en accord mutuel. Aucun paiement n'est requis.
              </Text>
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Décrivez votre objet et ce qui vous intéresse..." value={description} onChangeText={setDescription} multiline maxLength={500} />
          </View>
        )}

        {/* ── Step 2 — SERVICE ── */}
        {step === 2 && type === 'service' && (
          <View>
            <Text style={styles.label}>Durée estimée *</Text>
            <View style={styles.pillRow}>
              {['30 min', '1h', '2h', '½ journée', '1 journée'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.pill, serviceDuration === d && { backgroundColor: config.bg, borderColor: config.color }]}
                  onPress={() => setServiceDuration(d)}
                >
                  <Text style={[styles.pillText, serviceDuration === d && { color: config.color, fontWeight: '600' }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {serviceDuration === '' && <Text style={styles.hint}>Ou précisez ci-dessous</Text>}
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Durée personnalisée (ex: 3h)"
              value={serviceDuration}
              onChangeText={setServiceDuration}
              maxLength={30}
            />

            <Text style={styles.label}>Disponibilités</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: Week-ends, soirées en semaine..."
              value={serviceAvailability}
              onChangeText={setServiceAvailability}
              multiline
              maxLength={200}
            />

            <Text style={styles.label}>Description du service</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Ce que vous proposez, votre expérience, vos conditions..." value={description} onChangeText={setDescription} multiline maxLength={500} />

            <View style={[styles.infoBox, { backgroundColor: config.bg }]}>
              <Ionicons name="hand-right-outline" size={18} color={config.color} />
              <Text style={[styles.infoText, { color: config.color }]}>
                Les services sur Yondly sont basés sur l'entraide et la réciprocité.
              </Text>
            </View>
          </View>
        )}

        {/* ── Step 3 — Localisation ── */}
        {step === 3 && (
          <View>
            <View style={[styles.infoBox, { backgroundColor: config.bg, marginTop: 8 }]}>
              <Ionicons name="location-outline" size={18} color={config.color} />
              <Text style={[styles.infoText, { color: config.color }]}>
                L'adresse de votre profil sera utilisée pour la localisation. La remise se fait en main propre.
              </Text>
            </View>

            <View style={[styles.summaryCard]}>
              <Text style={styles.summaryTitle}>Récapitulatif</Text>
              <SummaryRow icon="pricetag-outline" label="Type" value={config.label} color={config.color} />
              <SummaryRow icon="text-outline" label="Titre" value={title} />
              <SummaryRow icon="folder-outline" label="Catégorie" value={category} />
              {type === 'sale' && priceEuros && <SummaryRow icon="cash-outline" label="Prix" value={`${priceEuros} €`} color={config.color} />}
              {type === 'exchange' && wantedItem && <SummaryRow icon="swap-horizontal-outline" label="Cherche" value={wantedItem} />}
              {type === 'donation' && <SummaryRow icon="time-outline" label="Durée" value={`${urgencyDays} jours`} />}
              {type === 'service' && serviceDuration && <SummaryRow icon="time-outline" label="Durée" value={serviceDuration} />}
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.buttonSecondary} onPress={() => setStep(step - 1)}>
            <Text style={[styles.buttonSecondaryText, { color: config.color }]}>Retour</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.buttonPrimary, { backgroundColor: config.color }, loading && styles.buttonDisabled]}
          onPress={step < 3 ? handleNext : handlePublish}
          disabled={loading}
        >
          <Text style={styles.buttonPrimaryText}>
            {loading ? 'Publication...' : step < 3 ? 'Suivant →' : 'Publier'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConditionPicker({ value, onChange, color, bg }: { value: string; onChange: (v: any) => void; color: string; bg: string }) {
  const options = [{ key: 'new', label: 'Neuf' }, { key: 'good', label: 'Bon état' }, { key: 'repair', label: 'À réparer' }];
  return (
    <View style={styles.pillRow}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.key}
          style={[styles.pill, { flex: 1 }, value === o.key && { backgroundColor: bg, borderColor: color }]}
          onPress={() => onChange(o.key)}
        >
          <Text style={[styles.pillText, value === o.key && { color, fontWeight: '600' }]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Toggle({ value, onChange, color }: { value: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <TouchableOpacity
      style={[styles.switch, value && { backgroundColor: color }]}
      onPress={() => onChange(!value)}
    >
      <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
    </TouchableOpacity>
  );
}

function FeeRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <View style={[styles.feeRow, bold && { borderTopWidth: 1, borderTopColor: '#e0e0e0', marginTop: 8, paddingTop: 10 }]}>
      <Text style={[styles.feeLabel, bold && { fontWeight: '700', color: color || '#333' }]}>{label}</Text>
      <Text style={[styles.feeValue, bold && { fontWeight: '700', color: color || '#333' }]}>{value}</Text>
    </View>
  );
}

function SummaryRow({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <View style={styles.summaryRow}>
      <Ionicons name={icon as any} size={16} color={color || '#666'} style={{ marginRight: 8 }} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, color ? { color, fontWeight: '600' } : {}]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f5f5' },
  stepIndicator:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: '#fff' },
  stepDot:          { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ddd' },
  stepLine:         { width: 40, height: 2, backgroundColor: '#ddd', marginHorizontal: 8 },
  content:          { flex: 1, padding: 16 },
  label:            { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  hint:             { fontSize: 12, color: '#999', marginTop: 4 },

  // Type cards
  typeGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard:         { width: '47%', backgroundColor: '#fff', borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  typeLabel:        { fontSize: 15, fontWeight: '700', color: '#444', marginTop: 4 },
  typeDesc:         { fontSize: 11, color: '#999', textAlign: 'center' },

  // Photos
  photoGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoItem:        { position: 'relative' },
  photo:            { width: 80, height: 80, borderRadius: 10 },
  photoRemove:      { position: 'absolute', top: -8, right: -8 },
  photoAdd:         { width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  photoAddText:     { fontSize: 11, marginTop: 3 },

  // Inputs
  input:            { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 13, fontSize: 15 },
  textArea:         { height: 110, textAlignVertical: 'top' },
  dropdownButton:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13 },
  dropdownButtonText: { fontSize: 15, fontWeight: '600', color: '#333' },
  dropdownMenu:     { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, marginTop: 4, overflow: 'hidden', elevation: 4 },
  dropdownItem:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  dropdownItemText: { fontSize: 14, color: '#333' },

  // Pills
  pillRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:             { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 2, borderColor: '#e0e0e0', backgroundColor: '#fff' },
  pillText:         { fontSize: 13, color: '#666' },

  // Price
  priceInput:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 2, borderRadius: 12, paddingHorizontal: 16 },
  priceInputField:  { flex: 1, fontSize: 26, fontWeight: 'bold', padding: 12 },
  priceSymbol:      { fontSize: 26, fontWeight: 'bold' },

  // Fee
  feeInfo:          { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 12 },
  feeTitle:         { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 10 },
  feeRow:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  feeLabel:         { fontSize: 14, color: '#666' },
  feeValue:         { fontSize: 14, color: '#666' },

  // Toggle
  toggleRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 12 },
  toggleTitle:      { fontSize: 15, fontWeight: '600', color: '#333' },
  toggleSubtitle:   { fontSize: 12, color: '#999', marginTop: 2 },
  switch:           { width: 50, height: 30, borderRadius: 15, backgroundColor: '#ccc', justifyContent: 'center', padding: 2 },
  switchThumb:      { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff' },
  switchThumbActive:{ alignSelf: 'flex-end' },

  // Info box
  infoBox:          { flexDirection: 'row', borderRadius: 10, padding: 12, marginTop: 12, gap: 8 },
  infoText:         { flex: 1, fontSize: 13, lineHeight: 18 },

  // Summary
  summaryCard:      { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 16 },
  summaryTitle:     { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 12 },
  summaryRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  summaryLabel:     { fontSize: 13, color: '#888', width: 80 },
  summaryValue:     { flex: 1, fontSize: 13, color: '#333' },

  // Footer
  footer:           { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0', gap: 8 },
  buttonPrimary:    { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonSecondary:  { paddingHorizontal: 20, paddingVertical: 15, borderRadius: 12, borderWidth: 2, borderColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  buttonPrimaryText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonSecondaryText: { fontSize: 15, fontWeight: '600' },
  buttonDisabled:   { opacity: 0.6 },
});
