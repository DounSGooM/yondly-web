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

      // Enforce Personal Space Only
      if (user?.is_partner) {
        Alert.alert(
          "Compte Professionnel",
          "Ce compte est un compte partenaire. Veuillez utiliser l'Accès Pro."
        );
        // Optionally logout immediately since they shouldn't be here
        // useAuthStore.getState().logout(); 
        return;
      }

      router.replace('/(tabs)/food');
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
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Text>
          </TouchableOpacity>

          <SocialAuth />

          <TouchableOpacity
            onPress={() => {
              console.log('🔘 Navigating to register...');
              router.push('/register');
            }}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Pas encore de compte ? S'inscrire</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              console.log('🔘 Navigating to login-pro...');
              router.push('/login-pro');
            }}
            style={styles.proLinkButton}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.proLinkText}>Vous êtes commerçant ?</Text>
              <Text style={[styles.proLinkText, { fontWeight: 'bold' }]}>Accès Pro</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 280,
    height: 120,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#4C7B4B',
    marginTop: 16,
  },
  appName: {
    fontSize: 42,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#4C7B4B',
    marginTop: -10, // Pull it closer to logo if needed
    marginBottom: 8,
    letterSpacing: 0.5, // Tighter letter spacing for logo look
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4C7B4B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
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
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#4C7B4B',
    fontSize: 14,
    fontWeight: '500',
  },
  proLinkButton: {
    marginTop: 32,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    alignSelf: 'center',
  },
  proLinkText: {
    color: '#333',
    fontSize: 12,
  },
});
