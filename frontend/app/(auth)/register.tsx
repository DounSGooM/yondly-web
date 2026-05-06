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
import { colors, Typography, Spacing, BorderRadius } from '../../src/theme';

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700;

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

    if (!passwordRules.every(r => r.valid)) {
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
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
            placeholderTextColor={colors.textTertiary}
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="votre@email.fr"
            placeholderTextColor={colors.textTertiary}
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
              placeholderTextColor={colors.textTertiary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>

          <Text style={styles.label}>Votre rue *</Text>
          <Text style={styles.helperText}>Rejoindre votre communauté locale</Text>
          <AddressAutocomplete
            value={address}
            onSelect={setAddress}
            placeholder="Ex: Rue du Commerce, Poitiers"
          />

          {/* ASSOCIATION REGISTRATION - TEMPORARILY DISABLED */}

          <Text style={styles.label}>Mot de passe *</Text>
          <TextInput
            style={styles.input}
            placeholder="Min. 8 caractères, majuscule, chiffre"
            placeholderTextColor={colors.textTertiary}
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
                    color={rule.valid ? colors.primary : colors.border}
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
            placeholderTextColor={colors.textTertiary}
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
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Création...' : "S'inscrire"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.linkButton}>
            <Text style={styles.linkText}>Déjà un compte ? <Text style={styles.linkTextBold}>Se connecter</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? Spacing.lg : Spacing.xl,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: Spacing.xs,
  },
  logo: {
    width: isSmallScreen ? 48 : 60,
    height: isSmallScreen ? 48 : 60,
  },
  appName: {
    fontSize: isSmallScreen ? Typography.xl : Typography.xxl,
    fontWeight: Typography.heavy,
    color: colors.primary,
    marginTop: Spacing.xs,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: isSmallScreen ? Typography.lg : Typography.xl,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
    marginTop: Spacing.xs,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: Typography.base,
    color: colors.textPrimary,
    marginBottom: Spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  linkButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: Typography.sm,
  },
  linkTextBold: {
    color: colors.primary,
    fontWeight: Typography.semibold,
  },
  helperText: {
    fontSize: Typography.xs,
    color: colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },
  passwordRules: {
    marginTop: -4,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  ruleText: {
    fontSize: Typography.xs,
    color: colors.textTertiary,
  },
  ruleTextValid: {
    color: colors.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorHint: {
    color: colors.error,
    fontSize: Typography.xs,
    marginTop: -8,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  phonePrefix: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  phonePrefixText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
});
