import React, { useState, useEffect } from 'react';
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
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../src/store/authStore';
import { API_URL } from '../../src/config/api';

type OfferKind = 'ANTIGASPI_SALE' | 'RENTAL';
type DateType = 'DLC' | 'DDM' | 'NONE';
type StepId = 1 | 2 | 3;

const STEPS = [
    { id: 1, title: 'Type', icon: 'apps' },
    { id: 2, title: 'Détails', icon: 'document-text' },
    { id: 3, title: 'Spécificités', icon: 'settings' },
];

const CATEGORIES = [
    { value: 'food', label: 'Alimentaire', icon: 'restaurant' },
    { value: 'equipment', label: 'Équipement', icon: 'construct' },
    { value: 'textile', label: 'Textile', icon: 'shirt' },
    { value: 'electronics', label: 'Électronique', icon: 'phone-portrait' },
    { value: 'furniture', label: 'Mobilier', icon: 'bed' },
    { value: 'other', label: 'Autre', icon: 'ellipsis-horizontal' },
];

export default function ProOfferScreen() {
    const router = useRouter();
    const token = useAuthStore((state) => state.token);

    const [currentStep, setCurrentStep] = useState<StepId>(1);
    const [loading, setLoading] = useState(false);
    const [canPublish, setCanPublish] = useState<boolean | null>(null);

    // Step 1: Type selection
    const [offerKind, setOfferKind] = useState<OfferKind | null>(null);

    // Step 2: Common fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('food');
    const [photos, setPhotos] = useState<string[]>([]);
    const [priceCents, setPriceCents] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [locationLabel, setLocationLabel] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [city, setCity] = useState('');

    // Step 3 Anti-gaspi specific
    const [isFood, setIsFood] = useState(true);
    const [allergensText, setAllergensText] = useState('');
    const [dateType, setDateType] = useState<DateType>('NONE');
    const [dateValue, setDateValue] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickupStart, setPickupStart] = useState<Date>(new Date());
    const [pickupEnd, setPickupEnd] = useState<Date>(new Date(Date.now() + 2 * 60 * 60 * 1000));
    const [pickupInstructions, setPickupInstructions] = useState('');

    // Step 3 Rental specific
    const [depositCents, setDepositCents] = useState('');
    const [minDurationHours, setMinDurationHours] = useState('24');
    const [maxDurationHours, setMaxDurationHours] = useState('168');
    const [lateFeeCents, setLateFeeCents] = useState('0');
    const [usageRules, setUsageRules] = useState('');

    useEffect(() => {
        checkCanPublish();
    }, []);

    const checkCanPublish = async () => {
        try {
            const [verifRes, stripeRes] = await Promise.all([
                fetch(`${API_URL}/pro/verification`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/pro/stripe/status`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const verif = await verifRes.json();
            const stripe = await stripeRes.json();

            const approved = verif?.status === 'APPROVED';
            const payouts = stripe?.payouts_enabled === true;
            setCanPublish(approved && payouts);
        } catch (e) {
            setCanPublish(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission requise', 'Accès à la galerie nécessaire');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setPhotos([...photos, result.assets[0].uri]);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const validateStep = (): boolean => {
        switch (currentStep) {
            case 1:
                if (!offerKind) {
                    Alert.alert('Erreur', 'Veuillez sélectionner un type d\'offre');
                    return false;
                }
                return true;

            case 2:
                if (!title.trim()) {
                    Alert.alert('Erreur', 'Veuillez entrer un titre');
                    return false;
                }
                if (photos.length === 0) {
                    Alert.alert('Erreur', 'Veuillez ajouter au moins une photo');
                    return false;
                }
                if (!priceCents || parseInt(priceCents) <= 0) {
                    Alert.alert('Erreur', 'Veuillez entrer un prix valide');
                    return false;
                }
                if (!city.trim()) {
                    Alert.alert('Erreur', 'Veuillez entrer une ville');
                    return false;
                }
                return true;

            case 3:
                if (offerKind === 'ANTIGASPI_SALE') {
                    if (dateType !== 'NONE' && !dateValue) {
                        Alert.alert('Erreur', 'Veuillez sélectionner une date');
                        return false;
                    }
                    if (!pickupInstructions.trim()) {
                        Alert.alert('Erreur', 'Veuillez entrer les instructions de retrait');
                        return false;
                    }
                } else if (offerKind === 'RENTAL') {
                    if (!depositCents || parseInt(depositCents) <= 0) {
                        Alert.alert('Erreur', 'Veuillez entrer un montant de caution');
                        return false;
                    }
                    if (!usageRules.trim()) {
                        Alert.alert('Erreur', 'Veuillez entrer les règles d\'utilisation');
                        return false;
                    }
                }
                return true;

            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep()) {
            setCurrentStep((currentStep + 1) as StepId);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((currentStep - 1) as StepId);
        } else {
            router.back();
        }
    };

    const handlePublish = async () => {
        if (!validateStep()) return;

        if (canPublish === false) {
            Alert.alert(
                'Publication impossible',
                'Votre compte PRO doit être vérifié et les paiements activés avant de publier des offres.',
                [{ text: 'OK' }]
            );
            return;
        }

        setLoading(true);
        try {
            // Step 1: Create draft offer
            const offerRes = await fetch(`${API_URL}/pro/offers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    kind: offerKind,
                    title,
                    description,
                    category,
                    photos,
                    price_cents: parseInt(priceCents) * 100,
                    quantity: parseInt(quantity),
                    location_label: locationLabel || city,
                    postal_code: postalCode,
                    city,
                }),
            });

            if (!offerRes.ok) {
                const err = await offerRes.json();
                throw new Error(err.detail || 'Erreur création offre');
            }

            const { id: offerId } = await offerRes.json();

            // Step 2: Add specific data
            if (offerKind === 'ANTIGASPI_SALE') {
                const antigaspiRes = await fetch(`${API_URL}/pro/offers/${offerId}/antigaspi`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        is_food: isFood,
                        allergens_text: allergensText || null,
                        date_type: dateType,
                        date_value: dateValue?.toISOString() || null,
                        pickup_slots: [{
                            start_at: pickupStart.toISOString(),
                            end_at: pickupEnd.toISOString(),
                        }],
                        pickup_instructions: pickupInstructions,
                    }),
                });
                if (!antigaspiRes.ok) {
                    const err = await antigaspiRes.json();
                    throw new Error(err.detail || 'Erreur données anti-gaspi');
                }
            } else if (offerKind === 'RENTAL') {
                const rentalRes = await fetch(`${API_URL}/pro/offers/${offerId}/rental`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        deposit_amount_cents: parseInt(depositCents) * 100,
                        min_duration_hours: parseInt(minDurationHours),
                        max_duration_hours: parseInt(maxDurationHours),
                        late_fee_per_day_cents: parseInt(lateFeeCents) * 100,
                        usage_rules: usageRules,
                    }),
                });
                if (!rentalRes.ok) {
                    const err = await rentalRes.json();
                    throw new Error(err.detail || 'Erreur données location');
                }
            }

            // Step 3: Publish
            const publishRes = await fetch(`${API_URL}/pro/offers/${offerId}/publish`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!publishRes.ok) {
                const err = await publishRes.json();
                throw new Error(err.detail || 'Erreur publication');
            }

            Alert.alert(
                '✅ Offre publiée !',
                'Votre offre est maintenant visible par les utilisateurs.',
                [{ text: 'OK', onPress: () => router.replace('/(pro)/dashboard') }]
            );
        } catch (error: any) {
            Alert.alert('Erreur', error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                    <View style={styles.stepItem}>
                        <View style={[
                            styles.stepCircle,
                            currentStep >= step.id && styles.stepCircleActive,
                            currentStep > step.id && styles.stepCircleCompleted,
                        ]}>
                            {currentStep > step.id ? (
                                <Ionicons name="checkmark" size={16} color="#fff" />
                            ) : (
                                <Ionicons name={step.icon as any} size={16} color={currentStep >= step.id ? '#fff' : '#999'} />
                            )}
                        </View>
                        <Text style={[styles.stepLabel, currentStep >= step.id && styles.stepLabelActive]}>
                            {step.title}
                        </Text>
                    </View>
                    {index < STEPS.length - 1 && (
                        <View style={[styles.stepLine, currentStep > step.id && styles.stepLineActive]} />
                    )}
                </React.Fragment>
            ))}
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Type d'offre</Text>
            <Text style={styles.stepSubtitle}>Que souhaitez-vous proposer ?</Text>

            <TouchableOpacity
                style={[styles.typeCard, offerKind === 'ANTIGASPI_SALE' && styles.typeCardActive]}
                onPress={() => setOfferKind('ANTIGASPI_SALE')}
            >
                <View style={[styles.typeIcon, offerKind === 'ANTIGASPI_SALE' && styles.typeIconActive]}>
                    <Ionicons name="leaf" size={32} color={offerKind === 'ANTIGASPI_SALE' ? '#fff' : '#4C7B4B'} />
                </View>
                <View style={styles.typeInfo}>
                    <Text style={[styles.typeTitle, offerKind === 'ANTIGASPI_SALE' && styles.typeTitleActive]}>
                        Anti-gaspi
                    </Text>
                    <Text style={styles.typeDesc}>
                        Vente de produits à prix réduit (retrait sur place uniquement)
                    </Text>
                </View>
                {offerKind === 'ANTIGASPI_SALE' && (
                    <Ionicons name="checkmark-circle" size={24} color="#4C7B4B" />
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.typeCard, offerKind === 'RENTAL' && styles.typeCardActive]}
                onPress={() => setOfferKind('RENTAL')}
            >
                <View style={[styles.typeIcon, offerKind === 'RENTAL' && styles.typeIconActive]}>
                    <Ionicons name="key" size={32} color={offerKind === 'RENTAL' ? '#fff' : '#3b82f6'} />
                </View>
                <View style={styles.typeInfo}>
                    <Text style={[styles.typeTitle, offerKind === 'RENTAL' && styles.typeTitleActive]}>
                        Location
                    </Text>
                    <Text style={styles.typeDesc}>
                        Location de matériel avec caution (remise en main propre)
                    </Text>
                </View>
                {offerKind === 'RENTAL' && (
                    <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                )}
            </TouchableOpacity>

            {canPublish === false && (
                <View style={styles.warningBox}>
                    <Ionicons name="warning" size={20} color="#f59e0b" />
                    <Text style={styles.warningText}>
                        Votre compte PRO doit être vérifié et les paiements activés avant de publier.
                    </Text>
                </View>
            )}
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Détails de l'offre</Text>
            <Text style={styles.stepSubtitle}>Informations générales</Text>

            <Text style={styles.label}>Titre *</Text>
            <TextInput
                style={styles.input}
                placeholder="Ex: Panier de légumes du jour"
                value={title}
                onChangeText={setTitle}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Décrivez votre offre en détail..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
            />

            <Text style={styles.label}>Photos *</Text>
            <View style={styles.photosRow}>
                {photos.map((uri, index) => (
                    <View key={index} style={styles.photoWrapper}>
                        <Image source={{ uri }} style={styles.photoThumb} />
                        <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(index)}>
                            <Ionicons name="close-circle" size={24} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                ))}
                {photos.length < 5 && (
                    <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
                        <Ionicons name="camera" size={28} color="#4C7B4B" />
                        <Text style={styles.addPhotoText}>Ajouter</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Text style={styles.label}>Catégorie</Text>
            <View style={styles.categoriesRow}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.value}
                        style={[styles.categoryChip, category === cat.value && styles.categoryChipActive]}
                        onPress={() => setCategory(cat.value)}
                    >
                        <Ionicons name={cat.icon as any} size={16} color={category === cat.value ? '#fff' : '#666'} />
                        <Text style={[styles.categoryLabel, category === cat.value && styles.categoryLabelActive]}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.row}>
                <View style={styles.col}>
                    <Text style={styles.label}>Prix (€) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="5"
                        value={priceCents}
                        onChangeText={setPriceCents}
                        keyboardType="numeric"
                    />
                </View>
                <View style={styles.col}>
                    <Text style={styles.label}>Quantité</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="1"
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            <Text style={styles.label}>Ville *</Text>
            <TextInput
                style={styles.input}
                placeholder="Paris"
                value={city}
                onChangeText={setCity}
            />

            <Text style={styles.label}>Code postal</Text>
            <TextInput
                style={styles.input}
                placeholder="75001"
                value={postalCode}
                onChangeText={setPostalCode}
                keyboardType="numeric"
                maxLength={5}
            />
        </View>
    );

    const renderStep3AntiGaspi = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Détails Anti-gaspi</Text>
            <Text style={styles.stepSubtitle}>Informations spécifiques aux produits</Text>

            <View style={styles.switchRow}>
                <Text style={styles.label}>Produit alimentaire ?</Text>
                <TouchableOpacity
                    style={[styles.toggle, isFood && styles.toggleActive]}
                    onPress={() => setIsFood(!isFood)}
                >
                    <Text style={[styles.toggleText, isFood && styles.toggleTextActive]}>
                        {isFood ? 'Oui' : 'Non'}
                    </Text>
                </TouchableOpacity>
            </View>

            {isFood && (
                <>
                    <Text style={styles.label}>Allergènes (facultatif)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Gluten, lait, œufs..."
                        value={allergensText}
                        onChangeText={setAllergensText}
                    />

                    <Text style={styles.label}>Type de date</Text>
                    <View style={styles.dateTypeRow}>
                        {(['NONE', 'DLC', 'DDM'] as DateType[]).map((dt) => (
                            <TouchableOpacity
                                key={dt}
                                style={[styles.dateTypeBtn, dateType === dt && styles.dateTypeBtnActive]}
                                onPress={() => setDateType(dt)}
                            >
                                <Text style={[styles.dateTypeBtnText, dateType === dt && styles.dateTypeBtnTextActive]}>
                                    {dt === 'NONE' ? 'Aucune' : dt}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {dateType !== 'NONE' && (
                        <>
                            <Text style={styles.label}>Date {dateType} *</Text>
                            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
                                <Ionicons name="calendar" size={20} color="#4C7B4B" />
                                <Text style={styles.datePickerText}>
                                    {dateValue ? dateValue.toLocaleDateString('fr-FR') : 'Sélectionner une date'}
                                </Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={dateValue || new Date()}
                                    mode="date"
                                    onChange={(e, date) => {
                                        setShowDatePicker(false);
                                        if (date) setDateValue(date);
                                    }}
                                />
                            )}
                        </>
                    )}
                </>
            )}

            <Text style={[styles.label, { marginTop: 20 }]}>Créneau de retrait *</Text>
            <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={18} color="#3b82f6" />
                <Text style={styles.infoText}>Le client viendra récupérer sa commande pendant ce créneau.</Text>
            </View>
            <Text style={styles.slotText}>
                {pickupStart.toLocaleString('fr-FR')} → {pickupEnd.toLocaleString('fr-FR')}
            </Text>

            <Text style={styles.label}>Instructions de retrait *</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ex: Présentez-vous à l'accueil avec votre QR code..."
                value={pickupInstructions}
                onChangeText={setPickupInstructions}
                multiline
                numberOfLines={3}
            />
        </View>
    );

    const renderStep3Rental = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Détails Location</Text>
            <Text style={styles.stepSubtitle}>Conditions de location</Text>

            <Text style={styles.label}>Montant de la caution (€) *</Text>
            <TextInput
                style={styles.input}
                placeholder="50"
                value={depositCents}
                onChangeText={setDepositCents}
                keyboardType="numeric"
            />

            <View style={styles.row}>
                <View style={styles.col}>
                    <Text style={styles.label}>Durée min (heures)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="24"
                        value={minDurationHours}
                        onChangeText={setMinDurationHours}
                        keyboardType="numeric"
                    />
                </View>
                <View style={styles.col}>
                    <Text style={styles.label}>Durée max (heures)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="168"
                        value={maxDurationHours}
                        onChangeText={setMaxDurationHours}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            <Text style={styles.label}>Pénalité de retard (€/jour)</Text>
            <TextInput
                style={styles.input}
                placeholder="10"
                value={lateFeeCents}
                onChangeText={setLateFeeCents}
                keyboardType="numeric"
            />

            <Text style={styles.label}>Règles d'utilisation *</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ex: Ne pas utiliser sous la pluie, ranger après usage..."
                value={usageRules}
                onChangeText={setUsageRules}
                multiline
                numberOfLines={5}
            />

            <View style={styles.infoBox}>
                <Ionicons name="shield-checkmark" size={18} color="#10b981" />
                <Text style={styles.infoText}>
                    Un état des lieux sera obligatoire à la remise et au retour du matériel.
                </Text>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nouvelle Offre PRO</Text>
                <View style={{ width: 40 }} />
            </View>

            {renderStepIndicator()}

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && offerKind === 'ANTIGASPI_SALE' && renderStep3AntiGaspi()}
                {currentStep === 3 && offerKind === 'RENTAL' && renderStep3Rental()}
            </ScrollView>

            <View style={styles.footer}>
                {currentStep < 3 ? (
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextButtonText}>Continuer</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.buttonDisabled]}
                        onPress={handlePublish}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="rocket" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>Publier l'offre</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: '#fff',
    },
    stepItem: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e5e5e5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCircleActive: {
        backgroundColor: '#4C7B4B',
    },
    stepCircleCompleted: {
        backgroundColor: '#10b981',
    },
    stepLabel: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
    },
    stepLabelActive: {
        color: '#4C7B4B',
        fontWeight: '600',
    },
    stepLine: {
        width: 40,
        height: 2,
        backgroundColor: '#e5e5e5',
        marginHorizontal: 8,
    },
    stepLineActive: {
        backgroundColor: '#10b981',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    stepContent: {},
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 24,
    },
    typeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#e5e5e5',
    },
    typeCardActive: {
        borderColor: '#4C7B4B',
        backgroundColor: '#f0fdf4',
    },
    typeIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f0fdf4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    typeIconActive: {
        backgroundColor: '#4C7B4B',
    },
    typeInfo: {
        flex: 1,
    },
    typeTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    typeTitleActive: {
        color: '#4C7B4B',
    },
    typeDesc: {
        fontSize: 13,
        color: '#6b7280',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    photosRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    photoWrapper: {
        position: 'relative',
    },
    photoThumb: {
        width: 80,
        height: 80,
        borderRadius: 12,
    },
    removePhotoBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
    },
    addPhotoBtn: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4C7B4B',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addPhotoText: {
        fontSize: 11,
        color: '#4C7B4B',
        marginTop: 4,
    },
    categoriesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        gap: 6,
    },
    categoryChipActive: {
        backgroundColor: '#4C7B4B',
    },
    categoryLabel: {
        fontSize: 13,
        color: '#666',
    },
    categoryLabelActive: {
        color: '#fff',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    col: {
        flex: 1,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggle: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    toggleActive: {
        backgroundColor: '#4C7B4B',
    },
    toggleText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    toggleTextActive: {
        color: '#fff',
    },
    dateTypeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateTypeBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
    },
    dateTypeBtnActive: {
        backgroundColor: '#4C7B4B',
    },
    dateTypeBtnText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    dateTypeBtnTextActive: {
        color: '#fff',
    },
    datePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    datePickerText: {
        fontSize: 16,
        color: '#333',
    },
    slotText: {
        fontSize: 14,
        color: '#4C7B4B',
        fontWeight: '600',
        marginTop: 8,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 12,
        gap: 10,
        marginTop: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#1e40af',
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fffbeb',
        padding: 12,
        borderRadius: 12,
        gap: 10,
        marginTop: 16,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: '#92400e',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
    },
    nextButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#4C7B4B',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    submitButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#10b981',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
