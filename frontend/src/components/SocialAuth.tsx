import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'expo-router';

// Conditionally import Apple auth (not available in Expo Go)
let AppleAuthentication: any = null;
try {
    AppleAuthentication = require('expo-apple-authentication');
} catch (e) {
    // Not available (Expo Go or Android)
}

export default function SocialAuth() {
    const socialLogin = useAuthStore((state) => state.socialLogin);
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const handleSocialAuth = async (provider: string, idToken: string, displayName?: string) => {
        setLoading(provider);
        try {
            await socialLogin(provider, idToken, displayName);
            const user = useAuthStore.getState().user;
            if (user?.is_partner) {
                Alert.alert(
                    "Compte Professionnel",
                    "Ce compte est un compte partenaire. Veuillez utiliser l'Accès Pro."
                );
                return;
            }
            router.replace('/(tabs)/food');
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Connexion échouée');
        } finally {
            setLoading(null);
        }
    };

    const handleGoogleLogin = async () => {
        const clientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
            || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
        if (!clientId) {
            Alert.alert(
                'Configuration requise',
                'Ajoutez EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID dans votre .env'
            );
            return;
        }

        try {
            const AuthSession = require('expo-auth-session');
            const Crypto = require('expo-crypto');
            const nonce = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                Math.random().toString(36)
            );
            const redirectUri = AuthSession.makeRedirectUri({ scheme: 'yondly' });
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${clientId}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&response_type=id_token` +
                `&scope=openid%20email%20profile` +
                `&nonce=${nonce}`;

            const result = await AuthSession.startAsync({ authUrl });
            if (result?.type === 'success' && result.params?.id_token) {
                await handleSocialAuth('google', result.params.id_token);
            }
        } catch (error: any) {
            Alert.alert('Erreur', 'Google Sign-In a échoué');
            console.error('Google Sign-In error:', error);
        }
    };

    const handleFacebookLogin = async () => {
        const appId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
        if (!appId) {
            Alert.alert(
                'Configuration requise',
                'Ajoutez EXPO_PUBLIC_FACEBOOK_APP_ID dans votre .env'
            );
            return;
        }

        try {
            const AuthSession = require('expo-auth-session');
            const redirectUri = AuthSession.makeRedirectUri({ scheme: 'yondly' });
            const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
                `client_id=${appId}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&response_type=token` +
                `&scope=email,public_profile`;

            const result = await AuthSession.startAsync({ authUrl });
            if (result?.type === 'success' && result.params?.access_token) {
                await handleSocialAuth('facebook', result.params.access_token);
            }
        } catch (error: any) {
            Alert.alert('Erreur', 'Facebook Sign-In a échoué');
            console.error('Facebook Sign-In error:', error);
        }
    };

    const handleAppleLogin = async () => {
        if (!AppleAuthentication) {
            Alert.alert('Info', 'Apple Sign-In nécessite un build de développement (pas disponible dans Expo Go).');
            return;
        }
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (credential.identityToken) {
                const displayName = credential.fullName
                    ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
                    : undefined;
                await handleSocialAuth('apple', credential.identityToken, displayName || undefined);
            }
        } catch (error: any) {
            if (error.code !== 'ERR_REQUEST_CANCELED') {
                Alert.alert('Erreur', 'Apple Sign-In a échoué');
            }
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>ou continuer avec</Text>
                <View style={styles.line} />
            </View>

            <View style={styles.buttonsContainer}>
                {/* Google */}
                <TouchableOpacity
                    style={[styles.socialButton, loading === 'google' && styles.buttonLoading]}
                    onPress={handleGoogleLogin}
                    disabled={loading !== null}
                >
                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                </TouchableOpacity>

                {/* Apple - iOS only */}
                {Platform.OS === 'ios' && (
                    <TouchableOpacity
                        style={[styles.socialButton, loading === 'apple' && styles.buttonLoading]}
                        onPress={handleAppleLogin}
                        disabled={loading !== null}
                    >
                        <Ionicons name="logo-apple" size={24} color="#000" />
                    </TouchableOpacity>
                )}

                {/* Facebook */}
                <TouchableOpacity
                    style={[styles.socialButton, loading === 'facebook' && styles.buttonLoading]}
                    onPress={handleFacebookLogin}
                    disabled={loading !== null}
                >
                    <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 24,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#666',
        fontSize: 14,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    socialButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonLoading: {
        opacity: 0.5,
    },
});
