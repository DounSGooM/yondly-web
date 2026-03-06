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
import { Ionicons } from '@expo/vector-icons';

export default function LoginProScreen() {
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

            // Enforce Pro Space Only
            if (!user?.is_partner) {
                Alert.alert(
                    "Accès Refusé",
                    "Ce compte n'est pas un compte partenaire. Veuillez utiliser l'application standard."
                );
                return;
            }

            console.log('Login success, redirecting to Pro dashboard...');

            // Force a small delay to ensure state update propagates
            setTimeout(() => {
                router.replace('/(pro)/dashboard');
            }, 100);
        } catch (error: any) {
            console.error('Login error:', error);
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
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(auth)/login')}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>

                <View style={styles.header}>
                    {/* Pro Badge */}
                    <View style={styles.proBadge}>
                        <Ionicons name="briefcase" size={20} color="#fff" />
                        <Text style={styles.proBadgeText}>ESPACE PRO</Text>
                    </View>

                    <Image
                        source={require('../../assets/images/loop-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName}>Yondly</Text>
                    <Text style={styles.subtitle}>Gérez votre commerce et vos stocks</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Email Pro</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="contact@boutique.fr"
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
                            {loading ? 'Connexion...' : 'Accéder à mon espace'}
                        </Text>
                    </TouchableOpacity>


                    <TouchableOpacity
                        onPress={() => router.push('/pro/registration-dsa')}
                        style={styles.linkButton}
                    >
                        <Text style={styles.linkText}>Devenir partenaire Yondly</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 24,
        zIndex: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4C7B4B',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
        gap: 8,
    },
    proBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    logo: {
        width: 200,
        height: 80,
        backgroundColor: 'transparent',
    },
    appName: {
        fontSize: 42,
        fontFamily: 'Nunito_800ExtraBold',
        color: '#4C7B4B',
        marginTop: -10,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#4C7B4B',
        marginTop: 16,
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
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#4C7B4B', // Dark for Pro
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
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
});
