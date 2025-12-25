import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../../src/config/api';
import { useAuthStore } from '../../src/store/authStore';
import { LegalForm, SirenValidationResult } from '../../src/types';

const LEGAL_FORMS: { value: LegalForm; label: string; description: string }[] = [
    { value: 'auto_entrepreneur', label: 'Auto-entrepreneur', description: 'Régime simplifié' },
    { value: 'ei', label: 'Entreprise Individuelle', description: 'EI' },
    { value: 'eurl', label: 'EURL', description: 'Unipersonnelle à resp. limitée' },
    { value: 'sarl', label: 'SARL', description: 'Société à resp. limitée' },
    { value: 'sas', label: 'SAS', description: 'Société par actions simplifiée' },
    { value: 'sasu', label: 'SASU', description: 'SAS unipersonnelle' },
    { value: 'association', label: 'Association', description: 'Loi 1901' },
    { value: 'other', label: 'Autre', description: 'Autre forme juridique' },
];

const STEPS = [
    { id: 1, title: 'Entreprise', icon: 'business' },
    { id: 2, title: 'Adresse', icon: 'location' },
    { id: 3, title: 'Contact', icon: 'person' },
    { id: 4, title: 'Documents', icon: 'document' },
    { id: 5, title: 'Services', icon: 'apps' },
];

type StepId = 1 | 2 | 3 | 4 | 5;

export default function ProRegistrationDSAScreen() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const register = useAuthStore((state) => state.register);

    const [currentStep, setCurrentStep] = useState<StepId>(1);
    const [loading, setLoading] = useState(false);
    const [validatingSiren, setValidatingSiren] = useState(false);
    const [sirenValidation, setSirenValidation] = useState<SirenValidationResult | null>(null);

    // Account credentials (new)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Step 1: Business identity
    const [businessName, setBusinessName] = useState('');
    const [tradeName, setTradeName] = useState('');
    const [legalForm, setLegalForm] = useState<LegalForm>('auto_entrepreneur');
    const [siren, setSiren] = useState('');
    const [siret, setSiret] = useState('');
    const [tvaNumber, setTvaNumber] = useState('');

    // Step 2: Address
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [city, setCity] = useState('');
    const [postcode, setPostcode] = useState('');

    // Step 3: Contact
    const [contactFirstName, setContactFirstName] = useState('');
    const [contactLastName, setContactLastName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    // Step 4: Documents (required for verification)
    const [kbisDocument, setKbisDocument] = useState('');
    const [identityDocument, setIdentityDocument] = useState('');

    // Step 5: Services
    const [services, setServices] = useState<string[]>([]);

    const formatSiren = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 9);
        return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
    };

    const validateSiren = async () => {
        const cleanSiren = siren.replace(/\s/g, '');
        if (cleanSiren.length !== 9) {
            Alert.alert('Erreur', 'Le SIREN doit contenir 9 chiffres');
            return;
        }

        setValidatingSiren(true);
        try {
            const response = await fetch(`${API_URL}/pro/verify-siren?siren=${cleanSiren}`);
            const result: SirenValidationResult = await response.json();
            setSirenValidation(result);

            if (result.is_valid && result.business_name) {
                // Auto-fill ALL available data from API
                setBusinessName(result.business_name);

                // Address fields
                if (result.address) {
                    // Parse address - format is often "NUM RUE CODE VILLE"
                    const addressParts = result.address.split(' ');
                    const postcodeIndex = addressParts.findIndex(p => /^\d{5}$/.test(p));
                    if (postcodeIndex > 0) {
                        setAddressLine1(addressParts.slice(0, postcodeIndex).join(' '));
                    } else {
                        setAddressLine1(result.address);
                    }
                }
                if (result.city) setCity(result.city);
                if (result.postcode) setPostcode(result.postcode);

                // Generate SIRET (SIREN + 00001 for siege)
                setSiret(cleanSiren + '00001');

                // Generate TVA number (FR + key + SIREN)
                const tvaKey = (12 + 3 * (parseInt(cleanSiren) % 97)) % 97;
                setTvaNumber(`FR${tvaKey.toString().padStart(2, '0')}${cleanSiren}`);

                Alert.alert(
                    '✅ Entreprise trouvée !',
                    `${result.business_name}\n${result.city || ''}\nStatut: ${result.status || 'actif'}`,
                    [{ text: 'OK' }]
                );
            } else if (!result.is_valid) {
                Alert.alert('⚠️ SIREN invalide', result.error_message || 'SIREN non trouvé');
            }
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de valider le SIREN');
        } finally {
            setValidatingSiren(false);
        }
    };

    const toggleService = (service: string) => {
        if (services.includes(service)) {
            setServices(services.filter(s => s !== service));
        } else {
            setServices([...services, service]);
        }
    };

    const validateStep = (): boolean => {
        switch (currentStep) {
            case 1:
                // Account credentials validation
                if (!email || !email.includes('@')) {
                    Alert.alert('Erreur', 'Veuillez entrer un email valide');
                    return false;
                }
                if (!password || password.length < 6) {
                    Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
                    return false;
                }
                if (password !== confirmPassword) {
                    Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
                    return false;
                }
                // Business validation
                if (!siren || siren.replace(/\s/g, '').length !== 9) {
                    Alert.alert('Erreur', 'Veuillez entrer un SIREN valide (9 chiffres)');
                    return false;
                }
                if (!businessName) {
                    Alert.alert('Erreur', 'Veuillez entrer la raison sociale');
                    return false;
                }
                return true;

            case 2:
                if (!addressLine1 || !city || !postcode) {
                    Alert.alert('Erreur', 'Veuillez remplir l\'adresse complète');
                    return false;
                }
                return true;

            case 3:
                if (!contactFirstName || !contactLastName || !contactPhone) {
                    Alert.alert('Erreur', 'Veuillez remplir tous les champs du contact');
                    return false;
                }
                return true;

            case 4:
                if (!kbisDocument) {
                    Alert.alert('Erreur', 'Veuillez fournir un extrait Kbis ou équivalent');
                    return false;
                }
                if (!identityDocument) {
                    Alert.alert('Erreur', 'Veuillez fournir une pièce d\'identité');
                    return false;
                }
                return true;

            case 5:
                if (services.length === 0) {
                    Alert.alert('Erreur', 'Veuillez sélectionner au moins un service');
                    return false;
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

    const uploadFile = async (uri: string): Promise<string> => {
        if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
            return uri; // Already a remote URL
        }

        const formData = new FormData();
        const filename = uri.split('/').pop() || 'upload.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('file', {
            uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
            name: filename,
            type,
        } as any);

        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
                // Content-Type must strictly be omitted for multipart/form-data so boundary is set automatically
            },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Erreur upload ${response.status}: ${text}`);
        }
        const data = await response.json();

        // Return full URL. API_URL is .../api, we need .../uploads/...
        // The backend returns /uploads/uuid.ext
        const baseUrl = API_URL.replace('/api', '');
        return `${baseUrl}${data.url}`;
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setLoading(true);
        try {
            // Upload documents first if needed
            let finalKbisUrl = kbisDocument;
            let finalIdentityUrl = identityDocument;

            if (kbisDocument && (kbisDocument.startsWith('file://') || kbisDocument.startsWith('content://'))) {
                try {
                    finalKbisUrl = await uploadFile(kbisDocument);
                } catch (e: any) {
                    throw new Error(`Erreur Kbis: ${e.message}`);
                }
            }

            if (identityDocument && (identityDocument.startsWith('file://') || identityDocument.startsWith('content://'))) {
                try {
                    finalIdentityUrl = await uploadFile(identityDocument);
                } catch (e: any) {
                    throw new Error(`Erreur Identité: ${e.message}`);
                }
            }

            // Step 1: Create user account & login via store action
            // register(email, password, displayName, phone, address, isPartner, services)
            await register(
                email,
                password,
                businessName, // display_name
                contactPhone, // phone
                null, // address data
                true, // is_partner
                services // services
            );

            // Step 2: Get token from store (now updated)
            const token = useAuthStore.getState().token;
            if (!token) throw new Error("Erreur d'authentification après inscription");

            // Step 3: Create Pro seller profile
            const proResponse = await fetch(`${API_URL}/pro/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    business_name: businessName,
                    trade_name: tradeName || null,
                    legal_form: legalForm,
                    siren: siren.replace(/\s/g, ''),
                    siret: siret ? siret.replace(/\s/g, '') : null,
                    tva_number: tvaNumber || null,
                    address_line1: addressLine1,
                    address_line2: addressLine2 || null,
                    city,
                    postcode,
                    country: 'FR',
                    contact_first_name: contactFirstName,
                    contact_last_name: contactLastName,
                    contact_email: contactEmail || email,
                    contact_phone: contactPhone,
                    kbis_document_url: finalKbisUrl,
                    identity_document_url: finalIdentityUrl,
                    services,
                }),
            });

            if (!proResponse.ok) {
                const error = await proResponse.json();
                throw new Error(error.detail || 'Erreur lors de l\'inscription Pro');
            }

            Alert.alert(
                '✅ Inscription réussie !',
                'Votre compte professionnel a été créé. Il sera vérifié sous 24-48h avant que vous puissiez publier des annonces.',
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
            <Text style={styles.stepTitle}>Création de compte Pro</Text>
            <Text style={styles.stepSubtitle}>Compte + informations entreprise</Text>

            {/* Account section */}
            <View style={styles.sectionHeader}>
                <Ionicons name="person-circle" size={20} color="#4C7B4B" />
                <Text style={styles.sectionTitle}>Identifiants de connexion</Text>
            </View>

            <Text style={styles.label}>Email professionnel *</Text>
            <TextInput
                style={styles.input}
                placeholder="contact@entreprise.fr"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
            />

            <Text style={styles.label}>Mot de passe *</Text>
            <TextInput
                style={styles.input}
                placeholder="Minimum 6 caractères"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Text style={styles.label}>Confirmer le mot de passe *</Text>
            <TextInput
                style={styles.input}
                placeholder="Répétez le mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            {/* Business section */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Ionicons name="business" size={20} color="#4C7B4B" />
                <Text style={styles.sectionTitle}>Entreprise</Text>
            </View>

            <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                <Text style={styles.infoText}>
                    Le SIREN permet de vérifier automatiquement votre entreprise et de pré-remplir les informations.
                </Text>
            </View>

            <Text style={styles.label}>SIREN *</Text>
            <View style={styles.sirenRow}>
                <TextInput
                    style={[styles.input, styles.sirenInput]}
                    placeholder="123 456 789"
                    value={siren}
                    onChangeText={(text) => setSiren(formatSiren(text))}
                    keyboardType="numeric"
                    maxLength={11}
                />
                <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={validateSiren}
                    disabled={validatingSiren}
                >
                    {validatingSiren ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.verifyButtonText}>Vérifier</Text>
                    )}
                </TouchableOpacity>
            </View>

            {sirenValidation && (
                <View style={[styles.validationBox, sirenValidation.is_valid ? styles.validationSuccess : styles.validationError]}>
                    <Ionicons
                        name={sirenValidation.is_valid ? "checkmark-circle" : "close-circle"}
                        size={20}
                        color={sirenValidation.is_valid ? "#10b981" : "#ef4444"}
                    />
                    <Text style={styles.validationText}>
                        {sirenValidation.is_valid
                            ? `✓ ${sirenValidation.business_name || 'Format valide'}`
                            : sirenValidation.error_message}
                    </Text>
                </View>
            )}

            <Text style={styles.label}>Raison sociale *</Text>
            <TextInput
                style={styles.input}
                placeholder="Nom légal de l'entreprise"
                value={businessName}
                onChangeText={setBusinessName}
            />

            <Text style={styles.label}>Nom commercial (si différent)</Text>
            <TextInput
                style={styles.input}
                placeholder="Enseigne / Marque"
                value={tradeName}
                onChangeText={setTradeName}
            />

            <Text style={styles.label}>Forme juridique *</Text>
            <View style={styles.legalFormGrid}>
                {LEGAL_FORMS.map((form) => (
                    <TouchableOpacity
                        key={form.value}
                        style={[styles.legalFormOption, legalForm === form.value && styles.legalFormOptionActive]}
                        onPress={() => setLegalForm(form.value)}
                    >
                        <Text style={[styles.legalFormLabel, legalForm === form.value && styles.legalFormLabelActive]}>
                            {form.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>SIRET (optionnel)</Text>
            <TextInput
                style={styles.input}
                placeholder="14 chiffres"
                value={siret}
                onChangeText={setSiret}
                keyboardType="numeric"
                maxLength={17}
            />

            <Text style={styles.label}>N° TVA intracommunautaire (optionnel)</Text>
            <TextInput
                style={styles.input}
                placeholder="FR12345678901"
                value={tvaNumber}
                onChangeText={setTvaNumber}
                autoCapitalize="characters"
            />
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Adresse du siège social</Text>
            <Text style={styles.stepSubtitle}>Adresse légale de l'entreprise</Text>

            <Text style={styles.label}>Adresse *</Text>
            <TextInput
                style={styles.input}
                placeholder="Numéro et nom de rue"
                value={addressLine1}
                onChangeText={setAddressLine1}
            />

            <Text style={styles.label}>Complément d'adresse</Text>
            <TextInput
                style={styles.input}
                placeholder="Bâtiment, étage, etc."
                value={addressLine2}
                onChangeText={setAddressLine2}
            />

            <View style={styles.row}>
                <View style={styles.col}>
                    <Text style={styles.label}>Code postal *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="75001"
                        value={postcode}
                        onChangeText={setPostcode}
                        keyboardType="numeric"
                        maxLength={5}
                    />
                </View>
                <View style={[styles.col, { flex: 2 }]}>
                    <Text style={styles.label}>Ville *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Paris"
                        value={city}
                        onChangeText={setCity}
                    />
                </View>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Représentant légal</Text>
            <Text style={styles.stepSubtitle}>Contact principal pour la plateforme</Text>

            <View style={styles.row}>
                <View style={styles.col}>
                    <Text style={styles.label}>Prénom *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Jean"
                        value={contactFirstName}
                        onChangeText={setContactFirstName}
                    />
                </View>
                <View style={styles.col}>
                    <Text style={styles.label}>Nom *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Dupont"
                        value={contactLastName}
                        onChangeText={setContactLastName}
                    />
                </View>
            </View>

            <Text style={styles.label}>Téléphone du contact *</Text>
            <TextInput
                style={styles.input}
                placeholder="06 12 34 56 78"
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
            />
        </View>
    );


    const pickDocument = async (type: 'kbis' | 'identity') => {
        Alert.alert(
            'Ajouter un document',
            'Comment souhaitez-vous ajouter le document ?',
            [
                {
                    text: 'Prendre une photo',
                    onPress: async () => {
                        const { status } = await ImagePicker.requestCameraPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert('Permission refusée', 'L\'accès à la caméra est nécessaire');
                            return;
                        }
                        const result = await ImagePicker.launchCameraAsync({
                            mediaTypes: ['images'],
                            allowsEditing: true,
                            quality: 0.8,
                            base64: true,
                        });
                        if (!result.canceled && result.assets[0]) {
                            const imageUri = result.assets[0].uri;
                            if (type === 'kbis') {
                                setKbisDocument(imageUri);
                            } else {
                                setIdentityDocument(imageUri);
                            }
                        }
                    },
                },
                {
                    text: 'Choisir depuis la galerie',
                    onPress: async () => {
                        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert('Permission refusée', 'L\'accès à la galerie est nécessaire');
                            return;
                        }
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            allowsEditing: true,
                            quality: 0.8,
                            base64: true,
                        });
                        if (!result.canceled && result.assets[0]) {
                            const imageUri = result.assets[0].uri;
                            if (type === 'kbis') {
                                setKbisDocument(imageUri);
                            } else {
                                setIdentityDocument(imageUri);
                            }
                        }
                    },
                },
                { text: 'Annuler', style: 'cancel' },
            ]
        );
    };

    const renderStep4Documents = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Documents de vérification</Text>
            <Text style={styles.stepSubtitle}>Obligatoires pour vérifier votre identité</Text>

            <View style={styles.warningBox}>
                <Ionicons name="lock-closed" size={20} color="#f59e0b" />
                <Text style={styles.warningText}>
                    Ces documents sont obligatoires et seront examinés par notre équipe. Ils ne seront pas partagés publiquement.
                </Text>
            </View>

            <Text style={styles.label}>Extrait Kbis ou équivalent *</Text>
            <Text style={styles.helpText}>Pour les auto-entrepreneurs: avis de situation INSEE</Text>

            {kbisDocument ? (
                <View style={styles.documentPreview}>
                    <Image source={{ uri: kbisDocument }} style={styles.documentImage} />
                    <TouchableOpacity
                        style={styles.removeDocButton}
                        onPress={() => setKbisDocument('')}
                    >
                        <Ionicons name="close-circle" size={28} color="#ef4444" />
                    </TouchableOpacity>
                    <View style={styles.documentSuccess}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={styles.documentSuccessText}>Document ajouté</Text>
                    </View>
                </View>
            ) : (
                <TouchableOpacity style={styles.uploadButton} onPress={() => pickDocument('kbis')}>
                    <Ionicons name="cloud-upload" size={32} color="#4C7B4B" />
                    <Text style={styles.uploadButtonText}>Ajouter le Kbis</Text>
                    <Text style={styles.uploadButtonHint}>Photo ou fichier</Text>
                </TouchableOpacity>
            )}

            <Text style={styles.label}>Pièce d'identité du représentant légal *</Text>
            <Text style={styles.helpText}>Carte d'identité ou passeport en cours de validité</Text>

            {identityDocument ? (
                <View style={styles.documentPreview}>
                    <Image source={{ uri: identityDocument }} style={styles.documentImage} />
                    <TouchableOpacity
                        style={styles.removeDocButton}
                        onPress={() => setIdentityDocument('')}
                    >
                        <Ionicons name="close-circle" size={28} color="#ef4444" />
                    </TouchableOpacity>
                    <View style={styles.documentSuccess}>
                        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        <Text style={styles.documentSuccessText}>Document ajouté</Text>
                    </View>
                </View>
            ) : (
                <TouchableOpacity style={styles.uploadButton} onPress={() => pickDocument('identity')}>
                    <Ionicons name="cloud-upload" size={32} color="#4C7B4B" />
                    <Text style={styles.uploadButtonText}>Ajouter la pièce d'identité</Text>
                    <Text style={styles.uploadButtonHint}>Photo ou fichier</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderStep5 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Services proposés</Text>
            <Text style={styles.stepSubtitle}>Sélectionnez au moins un service</Text>

            <View style={styles.servicesContainer}>
                <TouchableOpacity
                    style={[styles.serviceOption, services.includes('sale') && styles.serviceOptionActive]}
                    onPress={() => toggleService('sale')}
                >
                    <View style={styles.serviceIcon}>
                        <Ionicons name="pricetag" size={28} color={services.includes('sale') ? '#4C7B4B' : '#666'} />
                    </View>
                    <View style={styles.serviceInfo}>
                        <Text style={[styles.serviceTitle, services.includes('sale') && styles.serviceTitleActive]}>
                            Vente
                        </Text>
                        <Text style={styles.serviceDesc}>Vendre des articles neufs ou d'occasion</Text>
                    </View>
                    {services.includes('sale') && (
                        <Ionicons name="checkmark-circle" size={24} color="#4C7B4B" />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.serviceOption, services.includes('rent') && styles.serviceOptionActive]}
                    onPress={() => toggleService('rent')}
                >
                    <View style={styles.serviceIcon}>
                        <Ionicons name="key" size={28} color={services.includes('rent') ? '#4C7B4B' : '#666'} />
                    </View>
                    <View style={styles.serviceInfo}>
                        <Text style={[styles.serviceTitle, services.includes('rent') && styles.serviceTitleActive]}>
                            Location
                        </Text>
                        <Text style={styles.serviceDesc}>Louer du matériel ou des équipements</Text>
                    </View>
                    {services.includes('rent') && (
                        <Ionicons name="checkmark-circle" size={24} color="#4C7B4B" />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.serviceOption, services.includes('anti_waste') && styles.serviceOptionActive]}
                    onPress={() => toggleService('anti_waste')}
                >
                    <View style={styles.serviceIcon}>
                        <Ionicons name="leaf" size={28} color={services.includes('anti_waste') ? '#4C7B4B' : '#666'} />
                    </View>
                    <View style={styles.serviceInfo}>
                        <Text style={[styles.serviceTitle, services.includes('anti_waste') && styles.serviceTitleActive]}>
                            Anti-gaspi
                        </Text>
                        <Text style={styles.serviceDesc}>Paniers alimentaires à prix réduit</Text>
                    </View>
                    {services.includes('anti_waste') && (
                        <Ionicons name="checkmark-circle" size={24} color="#4C7B4B" />
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.warningBox}>
                <Ionicons name="warning" size={20} color="#f59e0b" />
                <Text style={styles.warningText}>
                    Vous ne pourrez pas publier d'annonces tant que votre compte n'aura pas été vérifié par notre équipe (24-48h).
                </Text>
            </View>

            <View style={styles.dsaNote}>
                <Ionicons name="shield-checkmark" size={20} color="#10b981" />
                <Text style={styles.dsaNoteText}>
                    Vos informations légales seront affichées sur vos annonces conformément au Digital Services Act (DSA).
                </Text>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Inscription Pro (DSA)</Text>
                <View style={{ width: 40 }} />
            </View>

            {renderStepIndicator()}

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4Documents()}
                {currentStep === 5 && renderStep5()}
            </ScrollView>

            <View style={styles.footer}>
                {currentStep < 5 ? (
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextButtonText}>Continuer</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>Finaliser l'inscription</Text>
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
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
        backgroundColor: '#f9fafb',
    },
    stepItem: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircleActive: {
        backgroundColor: '#4C7B4B',
    },
    stepCircleCompleted: {
        backgroundColor: '#10b981',
    },
    stepLabel: {
        marginTop: 4,
        fontSize: 11,
        color: '#9ca3af',
        fontWeight: '500',
    },
    stepLabelActive: {
        color: '#4C7B4B',
    },
    stepLine: {
        width: 40,
        height: 2,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 4,
        marginBottom: 20,
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
        marginBottom: 4,
    },
    stepSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 24,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 12,
        gap: 10,
        marginBottom: 20,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#1e40af',
        lineHeight: 18,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1f2937',
    },
    sirenRow: {
        flexDirection: 'row',
        gap: 12,
    },
    sirenInput: {
        flex: 1,
    },
    verifyButton: {
        backgroundColor: '#4C7B4B',
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifyButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    validationBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    validationSuccess: {
        backgroundColor: '#ecfdf5',
    },
    validationError: {
        backgroundColor: '#fef2f2',
    },
    validationText: {
        flex: 1,
        fontSize: 13,
    },
    legalFormGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    legalFormOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    legalFormOptionActive: {
        backgroundColor: '#ecfdf5',
        borderColor: '#4C7B4B',
    },
    legalFormLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },
    legalFormLabelActive: {
        color: '#4C7B4B',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    col: {
        flex: 1,
    },
    servicesContainer: {
        gap: 12,
    },
    serviceOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 16,
        padding: 16,
        gap: 16,
    },
    serviceOptionActive: {
        backgroundColor: '#ecfdf5',
        borderColor: '#4C7B4B',
    },
    serviceIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    serviceInfo: {
        flex: 1,
    },
    serviceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    serviceTitleActive: {
        color: '#4C7B4B',
    },
    serviceDesc: {
        fontSize: 13,
        color: '#6b7280',
    },
    dsaNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginTop: 24,
        padding: 16,
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
    },
    dsaNoteText: {
        flex: 1,
        fontSize: 13,
        color: '#166534',
        lineHeight: 18,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 32,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
    },
    nextButton: {
        backgroundColor: '#4C7B4B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#10b981',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#fffbeb',
        borderRadius: 12,
        padding: 12,
        gap: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#fcd34d',
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: '#92400e',
        lineHeight: 18,
    },
    helpText: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 8,
        marginTop: -4,
    },
    documentInput: {
        minHeight: 50,
    },
    uploadButton: {
        backgroundColor: '#f9fafb',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4C7B4B',
        marginTop: 8,
    },
    uploadButtonHint: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
    documentPreview: {
        position: 'relative',
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    documentImage: {
        width: '100%',
        height: 160,
        resizeMode: 'cover',
    },
    removeDocButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#fff',
        borderRadius: 14,
    },
    documentSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: 12,
        backgroundColor: '#ecfdf5',
    },
    documentSuccessText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10b981',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
});
