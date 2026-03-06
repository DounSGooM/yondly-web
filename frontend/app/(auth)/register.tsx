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

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!address) {
      Alert.alert('Erreur', 'Veuillez sélectionner votre rue pour rejoindre votre communauté locale');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, displayName, phone || undefined, address);
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#4C7B4B" />
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

          <Text style={styles.label}>Téléphone (optionnel)</Text>
          <TextInput
            style={styles.input}
            placeholder="06 12 34 56 78"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <Text style={styles.label}>Votre rue *</Text>
          <Text style={styles.helperText}>
            Pour rejoindre votre communauté locale et découvrir vos voisins
          </Text>
          <AddressAutocomplete
            value={address}
            onSelect={setAddress}
            placeholder="Ex: Rue du Commerce, Poitiers"
          />

          <Text style={styles.label}>Mot de passe *</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimum 6 caractères"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
          />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  logo: {
    width: 80,
    height: 80,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4C7B4B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  proBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 6,
  },
  appName: {
    fontSize: 32,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#4C7B4B',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4C7B4B',
    marginTop: 16,
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
  helperText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
});
