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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Image } from 'react-native';
import SocialAuth from '../../src/components/SocialAuth';
import { colors, Typography, Spacing, BorderRadius } from '../../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);

      const user = useAuthStore.getState().user;

      if (user?.is_partner) {
        Alert.alert(
          'Compte Professionnel',
          "Ce compte est un compte partenaire. Veuillez utiliser l'Accès Pro."
        );
        return;
      }

      router.replace('/(tabs)/food');
    } catch (error: any) {
      if ((error as any).requiresVerification) {
        router.replace({ pathname: '/(auth)/verify-email', params: { email: (error as any).email || email } });
      } else {
        Alert.alert('Erreur', error.message);
      }
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
          <Image
            source={require('../../assets/images/loop-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Yondly</Text>
          <Text style={styles.subtitle}>Marketplace communautaire</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
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

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/forgot-password')}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <SocialAuth />

          <TouchableOpacity
            onPress={() => router.push('/register')}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Pas encore de compte ? <Text style={styles.linkTextBold}>S'inscrire</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/login-pro')}
            style={styles.proLinkButton}
          >
            <Text style={styles.proLinkText}>Vous êtes commerçant ? </Text>
            <Text style={[styles.proLinkText, styles.proLinkBold]}>Accès Pro</Text>
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
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logo: {
    width: 280,
    height: 120,
    backgroundColor: 'transparent',
  },
  appName: {
    fontSize: Typography.display,
    fontFamily: 'Nunito_800ExtraBold',
    color: colors.primary,
    marginTop: -10,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Typography.base,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 15,
    fontSize: Typography.base,
    color: colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
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
  forgotLink: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  forgotText: {
    color: colors.textTertiary,
    fontSize: Typography.sm,
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
  proLinkButton: {
    marginTop: Spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
  },
  proLinkText: {
    color: colors.textSecondary,
    fontSize: Typography.xs,
  },
  proLinkBold: {
    fontWeight: Typography.bold,
    color: colors.textPrimary,
  },
});
