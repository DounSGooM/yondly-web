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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import AddressAutocomplete, { AddressResult } from '../../src/components/AddressAutocomplete';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<AddressResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAssociation, setIsAssociation] = useState(false);
  const [associationName, setAssociationName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !displayName || !phone) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // French phone validation: +33 format or 0X format
    const cleanPhone = phone.replace(/[\s.-]/g, '');
    if (!/^(\+33[1-9]\d{8}|0[1-9]\d{8})$/.test(cleanPhone)) {
      Alert.alert('Erreur', 'Numéro de téléphone invalide. Format attendu : +33 6 12 34 56 78');
      return;
    }

    if (!address) {
      Alert.alert('Erreur', 'Veuillez sélectionner votre rue pour rejoindre votre communauté locale');
      return;
    }

    const passwordRules = [
      { label: '8 caractères minimum', valid: password.length >= 8 },
      { label: 'Une majuscule', valid: /[A-Z]/.test(password) },
      { label: 'Une minuscule', valid: /[a-z]/.test(password) },
      { label: 'Un chiffre', valid: /[0-9]/.test(password) },
      { label: 'Un caractère spécial (!@#$...)', valid: /[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?`~]/.test(password) },
    ];
    const passwordValid = passwordRules.every(r => r.valid);

    if (!passwordValid) {
      Alert.alert('Erreur', 'Le mot de passe ne respecte pas les critères de sécurité');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (isAssociation && !associationName.trim()) {
      Alert.alert('Erreur', "Veuillez saisir le nom de votre association");
      return;
    }

    setLoading(true);
    try {
      const result = await register(email, password, displayName, phone || undefined, address, isAssociation, associationName || undefined);
      if (result?.requires_verification) {
        router.replace({ pathname: '/(auth)/verify-email', params: { email } });
      } else {
        router.replace('/(tabs)/food');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color="#4C7B4B" />
          </TouchableOpacity>
          <Image
            source={require('../../assets/images/loop-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Yondly</Text>
          <Text style={styles.title}>Créer un compte</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nom d'affichage *</Text>
          <TextInput
            style={styles.input}
            placeholder="Votre nom"
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="votre@email.fr"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={styles.label}>Téléphone *</Text>
          <View style={styles.phoneRow}>
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>🇫🇷 +33</Text>
            </View>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder="6 12 34 56 78"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>

          <Text style={styles.label}>Votre rue *</Text>
          <Text style={styles.helperText}>
            Rejoindre votre communauté locale
          </Text>
          <AddressAutocomplete
            value={address}
            onSelect={setAddress}
            placeholder="Ex: Rue du Commerce, Poitiers"
          />

          {/* ASSOCIATION REGISTRATION - TEMPORARILY DISABLED
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsAssociation(!isAssociation)}
          >
            <View style={[styles.checkbox, isAssociation && styles.checkboxChecked]}>
              {isAssociation && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Je suis une association / CCAS</Text>
          </TouchableOpacity>

          {isAssociation && (
            <>
              <Text style={styles.label}>Nom de l'association *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Restos du Cœur, CCAS de Poitiers..."
                value={associationName}
                onChangeText={setAssociationName}
              />
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#4FC3F7" />
                <Text style={styles.infoText}>
                  Votre compte devra être vérifié par un administrateur avant de pouvoir récupérer des paniers suspendus.
                </Text>
              </View>
            </>
          )}
          */}

          <Text style={styles.label}>Mot de passe *</Text>
          <TextInput
            style={styles.input}
            placeholder="Min. 8 caractères, majuscule, chiffre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
          />

          {password.length > 0 && (
            <View style={styles.passwordRules}>
              {[
                { label: '8 caractères minimum', valid: password.length >= 8 },
                { label: 'Une majuscule (A-Z)', valid: /[A-Z]/.test(password) },
                { label: 'Une minuscule (a-z)', valid: /[a-z]/.test(password) },
                { label: 'Un chiffre (0-9)', valid: /[0-9]/.test(password) },
                { label: 'Un caractère spécial (!@#$...)', valid: /[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?`~]/.test(password) },
              ].map((rule, i) => (
                <View key={i} style={styles.ruleRow}>
                  <Ionicons
                    name={rule.valid ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={rule.valid ? '#4C7B4B' : '#bbb'}
                  />
                  <Text style={[styles.ruleText, rule.valid && styles.ruleTextValid]}>
                    {rule.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.label}>Confirmer le mot de passe *</Text>
          <TextInput
            style={[
              styles.input,
              confirmPassword.length > 0 && confirmPassword !== password && styles.inputError,
            ]}
            placeholder="Retapez votre mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="password-new"
          />
          {confirmPassword.length > 0 && confirmPassword !== password && (
            <Text style={styles.errorHint}>Les mots de passe ne correspondent pas</Text>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Création..." : "S'inscrire"}
            </Text>
          </TouchableOpacity>



          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Déjà un compte ? Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f0',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 16 : 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  logo: {
    width: isSmallScreen ? 48 : 60,
    height: isSmallScreen ? 48 : 60,
  },
  title: {
    fontSize: isSmallScreen ? 22 : 26,
    fontWeight: 'bold',
    color: '#4C7B4B',
    marginTop: 6,
  },
  appName: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '800',
    color: '#4C7B4B',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4C7B4B',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 14,
    alignItems: 'center',
  },
  linkText: {
    color: '#4C7B4B',
    fontSize: 14,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    lineHeight: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4C7B4B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#4C7B4B',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E1F5FE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0277BD',
    lineHeight: 18,
  },
  passwordRules: {
    marginTop: -4,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  ruleText: {
    fontSize: 12,
    color: '#999',
  },
  ruleTextValid: {
    color: '#4C7B4B',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  errorHint: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  phonePrefix: {
    backgroundColor: '#f0f7f0',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  phonePrefixText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
});

