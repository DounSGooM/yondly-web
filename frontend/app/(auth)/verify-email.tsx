import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';

export default function VerifyEmailScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const verifyEmail = useAuthStore((state) => state.verifyEmail);
    const resendCode = useAuthStore((state) => state.resendCode);

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Cooldown timer for resend button
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleCodeChange = (text: string, index: number) => {
        // Allow only digits
        const digit = text.replace(/[^0-9]/g, '');

        if (digit.length > 1) {
            // Handle paste: distribute digits across inputs
            const digits = digit.split('').slice(0, 6);
            const newCode = [...code];
            digits.forEach((d, i) => {
                if (index + i < 6) newCode[index + i] = d;
            });
            setCode(newCode);
            const nextIndex = Math.min(index + digits.length, 5);
            inputRefs.current[nextIndex]?.focus();

            // Auto-submit if all filled
            if (newCode.every((c) => c !== '')) {
                handleVerify(newCode.join(''));
            }
            return;
        }

        const newCode = [...code];
        newCode[index] = digit;
        setCode(newCode);

        // Move to next input
        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits entered
        if (digit && index === 5 && newCode.every((c) => c !== '')) {
            handleVerify(newCode.join(''));
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !code[index] && index > 0) {
            const newCode = [...code];
            newCode[index - 1] = '';
            setCode(newCode);
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (fullCode?: string) => {
        const verificationCode = fullCode || code.join('');
        if (verificationCode.length !== 6) {
            Alert.alert('Erreur', 'Veuillez entrer le code à 6 chiffres');
            return;
        }

        setLoading(true);
        try {
            await verifyEmail(email || '', verificationCode);
            router.replace('/(tabs)/accueil');
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Code invalide');
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        try {
            await resendCode(email || '');
            setResendCooldown(60);
            Alert.alert('✅', 'Un nouveau code a été envoyé à votre adresse email.');
        } catch (error: any) {
            Alert.alert('Erreur', error.message || "Impossible d'envoyer le code");
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#4C7B4B" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Image
                        source={require('../../assets/images/loop-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName}>Yondly</Text>

                    <View style={styles.iconContainer}>
                        <Ionicons name="mail-outline" size={48} color="#4C7B4B" />
                    </View>

                    <Text style={styles.title}>Vérifiez votre email</Text>
                    <Text style={styles.subtitle}>
                        Un code à 6 chiffres a été envoyé à
                    </Text>
                    <Text style={styles.emailText}>{email}</Text>
                </View>

                <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => {
                                inputRefs.current[index] = ref;
                            }}
                            style={[
                                styles.codeInput,
                                digit ? styles.codeInputFilled : {},
                            ]}
                            value={digit}
                            onChangeText={(text) => handleCodeChange(text, index)}
                            onKeyPress={({ nativeEvent }) =>
                                handleKeyPress(nativeEvent.key, index)
                            }
                            keyboardType="number-pad"
                            maxLength={6}
                            textContentType="oneTimeCode"
                            autoFocus={index === 0}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.verifyButton, loading && styles.buttonDisabled]}
                    onPress={() => handleVerify()}
                    disabled={loading || code.some((c) => c === '')}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.verifyButtonText}>Vérifier</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleResend}
                    disabled={resendCooldown > 0}
                    style={styles.resendButton}
                >
                    <Text
                        style={[
                            styles.resendText,
                            resendCooldown > 0 && styles.resendTextDisabled,
                        ]}
                    >
                        {resendCooldown > 0
                            ? `Renvoyer le code dans ${resendCooldown}s`
                            : 'Renvoyer le code'}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.expiryText}>
                    Le code expire dans 10 minutes
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        padding: 24,
        paddingTop: 60,
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        left: 24,
        top: 60,
        zIndex: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    logo: {
        width: 60,
        height: 60,
    },
    appName: {
        fontSize: 28,
        fontFamily: 'Nunito_800ExtraBold',
        color: '#4C7B4B',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f7f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
    },
    emailText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4C7B4B',
        marginTop: 4,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 32,
    },
    codeInput: {
        width: 48,
        height: 56,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#fff',
        color: '#333',
    },
    codeInputFilled: {
        borderColor: '#4C7B4B',
        backgroundColor: '#f0f7f0',
    },
    verifyButton: {
        backgroundColor: '#4C7B4B',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    verifyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resendButton: {
        padding: 12,
    },
    resendText: {
        color: '#4C7B4B',
        fontSize: 14,
        fontWeight: '500',
    },
    resendTextDisabled: {
        color: '#999',
    },
    expiryText: {
        color: '#999',
        fontSize: 12,
        marginTop: 8,
    },
});
