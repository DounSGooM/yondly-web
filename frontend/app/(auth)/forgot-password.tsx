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
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../src/config/api';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [step, setStep] = useState<'email' | 'code' | 'newPassword'>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?`~]/.test(newPassword);
    const hasLength = newPassword.length >= 8;
    const passwordValid = hasUpper && hasLower && hasDigit && hasSpecial && hasLength;

    const handleSendCode = async () => {
        if (!email.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer votre adresse email');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/forgot-password`, { email: email.trim().toLowerCase() });
            setStep('code');
            Alert.alert('Email envoyé', 'Si ce compte existe, un code de réinitialisation a été envoyé à votre adresse email.');
        } catch (error: any) {
            Alert.alert('Erreur', error?.response?.data?.detail || 'Erreur lors de l\'envoi');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = () => {
        if (code.length !== 6) {
            Alert.alert('Erreur', 'Veuillez entrer le code à 6 chiffres');
            return;
        }
        setStep('newPassword');
    };

    const handleResetPassword = async () => {
        if (!passwordValid) {
            Alert.alert('Erreur', 'Le mot de passe ne remplit pas tous les critères');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/reset-password`, {
                email: email.trim().toLowerCase(),
                code,
                new_password: newPassword,
            });
            Alert.alert(
                'Succès !',
                'Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.',
                [{ text: 'Se connecter', onPress: () => router.replace('/(auth)/login') }]
            );
        } catch (error: any) {
            Alert.alert('Erreur', error?.response?.data?.detail || 'Erreur lors de la réinitialisation');
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
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="lock-closed" size={32} color="#4C7B4B" />
                    </View>
                    <Text style={styles.title}>
                        {step === 'email' ? 'Mot de passe oublié' : step === 'code' ? 'Vérification' : 'Nouveau mot de passe'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 'email'
                            ? 'Entrez votre adresse email pour recevoir un code de réinitialisation.'
                            : step === 'code'
                                ? `Un code à 6 chiffres a été envoyé à ${email}`
                                : 'Choisissez un nouveau mot de passe sécurisé.'}
                    </Text>
                </View>

                {step === 'email' && (
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
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSendCode}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Envoi...' : 'Envoyer le code'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {step === 'code' && (
                    <View style={styles.form}>
                        <Text style={styles.label}>Code de vérification</Text>
                        <TextInput
                            style={[styles.input, styles.codeInput]}
                            placeholder="000000"
                            value={code}
                            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                            keyboardType="number-pad"
                            maxLength={6}
                        />

                        <TouchableOpacity
                            style={[styles.button, code.length !== 6 && styles.buttonDisabled]}
                            onPress={handleVerifyCode}
                            disabled={code.length !== 6}
                        >
                            <Text style={styles.buttonText}>Vérifier</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.resendButton} onPress={handleSendCode}>
                            <Text style={styles.resendText}>Renvoyer le code</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {step === 'newPassword' && (
                    <View style={styles.form}>
                        <Text style={styles.label}>Nouveau mot de passe</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Min. 8 caractères"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                        />

                        {/* Password strength indicators */}
                        <View style={styles.rulesContainer}>
                            {[
                                { label: '8 caractères minimum', valid: hasLength },
                                { label: 'Une majuscule', valid: hasUpper },
                                { label: 'Une minuscule', valid: hasLower },
                                { label: 'Un chiffre', valid: hasDigit },
                                { label: 'Un caractère spécial (!@#$...)', valid: hasSpecial },
                            ].map((rule) => (
                                <View key={rule.label} style={styles.ruleRow}>
                                    <Ionicons
                                        name={rule.valid ? 'checkmark-circle' : 'ellipse-outline'}
                                        size={16}
                                        color={rule.valid ? '#4C7B4B' : '#ccc'}
                                    />
                                    <Text style={[styles.ruleText, rule.valid && styles.ruleTextValid]}>
                                        {rule.label}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <Text style={[styles.label, { marginTop: 16 }]}>Confirmer le mot de passe</Text>
                        <TextInput
                            style={[
                                styles.input,
                                confirmPassword && newPassword !== confirmPassword && styles.inputError,
                            ]}
                            placeholder="Confirmez votre mot de passe"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                            <Text style={styles.errorHint}>Les mots de passe ne correspondent pas</Text>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.button,
                                (!passwordValid || newPassword !== confirmPassword || loading) && styles.buttonDisabled,
                            ]}
                            onPress={handleResetPassword}
                            disabled={!passwordValid || newPassword !== confirmPassword || loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
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
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 16,
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
    inputError: {
        borderColor: '#e53935',
    },
    codeInput: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 8,
        color: '#4C7B4B',
    },
    button: {
        backgroundColor: '#4C7B4B',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resendButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    resendText: {
        color: '#4C7B4B',
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    rulesContainer: {
        marginBottom: 8,
        gap: 6,
    },
    ruleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ruleText: {
        fontSize: 13,
        color: '#999',
    },
    ruleTextValid: {
        color: '#4C7B4B',
    },
    errorHint: {
        fontSize: 12,
        color: '#e53935',
        marginTop: -12,
        marginBottom: 8,
    },
});
