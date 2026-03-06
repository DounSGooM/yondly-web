import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SocialAuth() {
    const handleSocialLogin = (provider: string) => {
        Alert.alert(
            'Coming Soon',
            `${provider} login is not configured yet. This requires developer keys setup.`
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.line} />
            </View>

            <View style={styles.buttonsContainer}>
                {/* Google */}
                <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => handleSocialLogin('Google')}
                >
                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                </TouchableOpacity>

                {/* Apple */}
                <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => handleSocialLogin('Apple')}
                >
                    <Ionicons name="logo-apple" size={24} color="#000" />
                </TouchableOpacity>

                {/* Facebook */}
                <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => handleSocialLogin('Facebook')}
                >
                    <Ionicons name="logo-facebook" size={24} color="#4267B2" />
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
});
