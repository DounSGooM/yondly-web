import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLevelBadge, LEVEL_THRESHOLDS } from '../utils/levelBadges';

interface LevelRestrictionModalProps {
    visible: boolean;
    onClose: () => void;
    requiredLevel: string;
    currentCO2: number;
}

export default function LevelRestrictionModal({
    visible,
    onClose,
    requiredLevel,
    currentCO2,
}: LevelRestrictionModalProps) {
    const targetBadge = getLevelBadge(requiredLevel);
    const remainingCO2 = Math.max(0, targetBadge.minCO2 - currentCO2);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed" size={48} color={targetBadge.color} />
                    </View>

                    <Text style={styles.title}>Fonctionnalité bloquée</Text>

                    <Text style={styles.message}>
                        Cette action est réservée aux utilisateurs ayant atteint le niveau{' '}
                        <Text style={{ fontWeight: 'bold', color: targetBadge.color }}>
                            {targetBadge.emoji} {targetBadge.level}
                        </Text>
                        .
                    </Text>

                    <View style={styles.progressBox}>
                        <Text style={styles.progressText}>
                            Il vous manque encore{' '}
                            <Text style={{ fontWeight: 'bold' }}>{remainingCO2.toFixed(1)} kg</Text>{' '}
                            de CO2 économisés pour débloquer ce niveau.
                        </Text>
                    </View>

                    <Text style={styles.hint}>
                        Astuce : Donnez ou achetez des objets anti-gaspi pour augmenter votre score !
                    </Text>

                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: targetBadge.color }]}
                        onPress={onClose}
                    >
                        <Text style={styles.primaryButtonText}>J'ai compris</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    progressBox: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 12,
        width: '100%',
        marginBottom: 20,
    },
    progressText: {
        fontSize: 15,
        color: '#333',
        textAlign: 'center',
        lineHeight: 22,
    },
    hint: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 24,
    },
    primaryButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
