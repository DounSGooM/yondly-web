import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    Image,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';

import { API_URL } from '../../src/config/api';

export default function NouveauPanierScreen() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [step, setStep] = useState(1);
    const totalSteps = 3;

    // Step 1: Photo & Détails
    const [photo, setPhoto] = useState<string | null>(null);
    const [title, setTitle] = useState('Panier Surprise');
    const [description, setDescription] = useState('');

    // Step 2: Prix & Quantité
    const [priceEuros, setPriceEuros] = useState('3.99');
    const [originalPriceEuros, setOriginalPriceEuros] = useState('9.99');
    const [quantity, setQuantity] = useState(5);

    // Step 3: Créneau de récupération
    const [pickupStart, setPickupStart] = useState('17:00');
    const [pickupEnd, setPickupEnd] = useState('19:00');

    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        try {
            if (Platform.OS !== 'web') {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permissionResult.granted) {
                    Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à vos photos');
                    return;
                }
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setPhoto(base64Image);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
        }
    };

    const takePhoto = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à votre caméra');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setPhoto(base64Image);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Erreur', 'Impossible de prendre la photo');
        }
    };

    const selectImageSource = () => {
        Alert.alert(
            'Ajouter une photo',
            'Choisissez une source',
            [
                { text: 'Appareil photo', onPress: takePhoto },
                { text: 'Galerie', onPress: pickImage },
                { text: 'Annuler', style: 'cancel' },
            ]
        );
    };

    const handleNext = () => {
        if (step === 1) {
            if (!title.trim()) {
                Alert.alert('Erreur', 'Veuillez entrer un titre');
                return;
            }
        }
        if (step === 2) {
            const price = parseFloat(priceEuros);
            if (isNaN(price) || price <= 0) {
                Alert.alert('Erreur', 'Veuillez entrer un prix valide');
                return;
            }
            if (quantity <= 0) {
                Alert.alert('Erreur', 'Veuillez entrer une quantité valide');
                return;
            }
        }
        if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            router.back();
        }
    };

    const handlePublish = async () => {
        setLoading(true);
        try {
            const priceCents = Math.round(parseFloat(priceEuros) * 100);
            const originalPriceCents = Math.round(parseFloat(originalPriceEuros) * 100);

            await axios.post(
                `${API_URL}/items`,
                {
                    type: 'sale',
                    title,
                    description,
                    photos: photo ? [photo] : [],
                    category: 'Panier Surprise',
                    price_cents: priceCents,
                    condition: 'new',
                    quantity_available: quantity,
                    pickup_start: pickupStart,
                    pickup_end: pickupEnd,
                    location: { lat: 48.8566, lng: 2.3522 },
                    radius_km: 5,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert(
                '🎉 Panier publié !',
                `${quantity} panier(s) "${title}" sont maintenant disponibles à ${priceEuros}€.`,
                [{ text: 'Super !', onPress: () => router.replace('/(pro)/dashboard') }]
            );
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de publier');
        } finally {
            setLoading(false);
        }
    };

    const discount = Math.round((1 - parseFloat(priceEuros) / parseFloat(originalPriceEuros)) * 100) || 0;

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Photo & Description</Text>
                        <Text style={styles.stepSubtitle}>Ajoutez une photo pour attirer les clients</Text>

                        <TouchableOpacity style={styles.photoContainer} onPress={selectImageSource}>
                            {photo ? (
                                <Image source={{ uri: photo }} style={styles.photo} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Ionicons name="camera" size={48} color="#4C7B4B" />
                                    <Text style={styles.photoText}>Ajouter une photo</Text>
                                    <Text style={styles.photoHint}>Recommandé pour plus de ventes</Text>
                                </View>
                            )}
                            {photo && (
                                <TouchableOpacity
                                    style={styles.photoChange}
                                    onPress={selectImageSource}
                                >
                                    <Ionicons name="camera" size={20} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.label}>Titre du panier</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Panier Surprise"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={40}
                        />

                        <Text style={styles.label}>Description (optionnel)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Décrivez le contenu typique..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                            maxLength={150}
                        />
                    </View>
                );

            case 2:
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Prix & Quantité</Text>
                        <Text style={styles.stepSubtitle}>Définissez votre offre anti-gaspi</Text>

                        <View style={styles.priceSection}>
                            <View style={styles.priceRow}>
                                <View style={styles.priceColumn}>
                                    <Text style={styles.priceLabel}>Valeur estimée</Text>
                                    <View style={[styles.priceInputContainer, styles.priceInputSecondary]}>
                                        <TextInput
                                            style={[styles.priceInput, styles.priceInputSecondaryText]}
                                            value={originalPriceEuros}
                                            onChangeText={setOriginalPriceEuros}
                                            keyboardType="decimal-pad"
                                        />
                                        <Text style={styles.priceSuffixSecondary}>€</Text>
                                    </View>
                                </View>

                                <View style={styles.priceColumn}>
                                    <Text style={styles.priceLabel}>Prix de vente</Text>
                                    <View style={styles.priceInputContainer}>
                                        <TextInput
                                            style={styles.priceInput}
                                            value={priceEuros}
                                            onChangeText={setPriceEuros}
                                            keyboardType="decimal-pad"
                                        />
                                        <Text style={styles.priceSuffix}>€</Text>
                                    </View>
                                </View>
                            </View>

                            {discount > 0 && (
                                <View style={styles.discountBadge}>
                                    <Ionicons name="pricetag" size={16} color="#fff" />
                                    <Text style={styles.discountText}>-{discount}% de réduction</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.label}>Quantité disponible</Text>
                        <View style={styles.quantityContainer}>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                                <Ionicons name="remove" size={24} color="#4C7B4B" />
                            </TouchableOpacity>
                            <Text style={styles.quantityValue}>{quantity}</Text>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => setQuantity(quantity + 1)}
                            >
                                <Ionicons name="add" size={24} color="#4C7B4B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.revenueCard}>
                            <Text style={styles.revenueLabel}>Revenus potentiels</Text>
                            <Text style={styles.revenueValue}>
                                {(parseFloat(priceEuros) * quantity).toFixed(2)}€
                            </Text>
                        </View>
                    </View>
                );

            case 3:
                const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
                const MINUTES = ['00', '15', '30', '45'];
                const ITEM_HEIGHT = 40;

                const WheelPicker = ({
                    data,
                    value,
                    onChange
                }: {
                    data: string[];
                    value: string;
                    onChange: (val: string) => void
                }) => {
                    const scrollRef = React.useRef<ScrollView>(null);
                    const initialIndex = data.indexOf(value);

                    React.useEffect(() => {
                        if (scrollRef.current && initialIndex >= 0) {
                            scrollRef.current.scrollTo({ y: initialIndex * ITEM_HEIGHT, animated: false });
                        }
                    }, []);

                    return (
                        <View style={styles.wheelContainer}>
                            <View style={styles.wheelHighlight} />
                            <ScrollView
                                ref={scrollRef}
                                showsVerticalScrollIndicator={false}
                                snapToInterval={ITEM_HEIGHT}
                                decelerationRate="fast"
                                onMomentumScrollEnd={(e) => {
                                    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                                    if (data[index]) {
                                        onChange(data[index]);
                                    }
                                }}
                                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                            >
                                {data.map((item, index) => (
                                    <View key={index} style={styles.wheelItem}>
                                        <Text style={[
                                            styles.wheelItemText,
                                            item === value && styles.wheelItemTextActive
                                        ]}>
                                            {item}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    );
                };

                const [startH, startM] = pickupStart.split(':');
                const [endH, endM] = pickupEnd.split(':');

                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Créneau de récupération</Text>
                        <Text style={styles.stepSubtitle}>Faites défiler pour choisir l'heure</Text>

                        <Text style={styles.label}>Début du créneau</Text>
                        <View style={styles.timePickerRow}>
                            <WheelPicker
                                data={HOURS}
                                value={startH}
                                onChange={(h) => setPickupStart(`${h}:${startM}`)}
                            />
                            <Text style={styles.timePickerSeparator}>:</Text>
                            <WheelPicker
                                data={MINUTES}
                                value={startM}
                                onChange={(m) => setPickupStart(`${startH}:${m}`)}
                            />
                        </View>

                        <Text style={styles.label}>Fin du créneau</Text>
                        <View style={styles.timePickerRow}>
                            <WheelPicker
                                data={HOURS}
                                value={endH}
                                onChange={(h) => setPickupEnd(`${h}:${endM}`)}
                            />
                            <Text style={styles.timePickerSeparator}>:</Text>
                            <WheelPicker
                                data={MINUTES}
                                value={endM}
                                onChange={(m) => setPickupEnd(`${endH}:${m}`)}
                            />
                        </View>

                        {/* Summary Card */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Récapitulatif</Text>
                            <View style={styles.summaryRow}>
                                <Ionicons name="gift" size={20} color="#4C7B4B" />
                                <Text style={styles.summaryText}>{title}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Ionicons name="pricetag" size={20} color="#4C7B4B" />
                                <Text style={styles.summaryText}>{priceEuros}€ (au lieu de {originalPriceEuros}€)</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Ionicons name="layers" size={20} color="#4C7B4B" />
                                <Text style={styles.summaryText}>{quantity} panier(s) disponible(s)</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Ionicons name="time" size={20} color="#4C7B4B" />
                                <Text style={styles.summaryText}>Retrait: {pickupStart} - {pickupEnd}</Text>
                            </View>
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name={step === 1 ? "close" : "arrow-back"} size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nouveau Panier</Text>
                <Text style={styles.stepIndicator}>{step}/{totalSteps}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {renderStep()}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        loading && styles.nextButtonDisabled,
                    ]}
                    onPress={step < totalSteps ? handleNext : handlePublish}
                    disabled={loading}
                >
                    <Text style={styles.nextButtonText}>
                        {loading ? 'Publication...' : step < totalSteps ? 'Continuer' : 'Publier le panier'}
                    </Text>
                    {!loading && (
                        <Ionicons
                            name={step < totalSteps ? "arrow-forward" : "checkmark"}
                            size={20}
                            color="#fff"
                        />
                    )}
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 60,
        backgroundColor: '#fff',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    stepIndicator: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#e0e0e0',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4C7B4B',
    },
    content: {
        flex: 1,
    },
    stepContent: {
        padding: 20,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
    },
    photoContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
    },
    photo: {
        width: '100%',
        height: 200,
    },
    photoPlaceholder: {
        width: '100%',
        height: 200,
        backgroundColor: '#e8f5e9',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#4C7B4B',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoText: {
        color: '#4C7B4B',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 8,
    },
    photoHint: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    photoChange: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: '#4C7B4B',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    priceSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    priceRow: {
        flexDirection: 'row',
        gap: 16,
    },
    priceColumn: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 2,
        borderColor: '#4C7B4B',
    },
    priceInputSecondary: {
        backgroundColor: '#f5f5f5',
        borderColor: '#ddd',
    },
    priceInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4C7B4B',
        padding: 12,
    },
    priceInputSecondaryText: {
        color: '#666',
    },
    priceSuffix: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    priceSuffixSecondary: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
    },
    discountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ff5722',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 12,
    },
    discountText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 8,
    },
    quantityButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityValue: {
        flex: 1,
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    revenueCard: {
        backgroundColor: '#4C7B4B',
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        alignItems: 'center',
    },
    revenueLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    revenueValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 4,
    },
    timeSlots: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    timeSlot: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    timeSlotActive: {
        backgroundColor: '#4C7B4B',
        borderColor: '#4C7B4B',
    },
    timeSlotText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    timeSlotTextActive: {
        color: '#fff',
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginTop: 24,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 12,
    },
    wheelContainer: {
        height: 120,
        width: 60,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    wheelHighlight: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        height: 40,
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
        zIndex: -1,
    },
    wheelItem: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheelItemText: {
        fontSize: 20,
        color: '#999',
    },
    wheelItemTextActive: {
        color: '#4C7B4B',
        fontWeight: 'bold',
    },
    timePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        gap: 8,
    },
    timePickerColumn: {
        alignItems: 'center',
    },
    timePickerButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timePickerValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4C7B4B',
        marginVertical: 4,
        width: 40,
        textAlign: 'center',
    },
    timePickerLabel: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
    },
    timePickerSeparator: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    nextButton: {
        flexDirection: 'row',
        backgroundColor: '#4C7B4B',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButtonDisabled: {
        opacity: 0.6,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
});
