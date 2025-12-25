import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config/api';

interface RatingModalProps {
    visible: boolean;
    orderId: string;
    sellerName: string;
    token: string;
    onClose: () => void;
    onSuccess: (newAvg: number, count: number) => void;
}

export default function RatingModal({
    visible,
    orderId,
    sellerName,
    token,
    onClose,
    onSuccess,
}: RatingModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Erreur', 'Veuillez sélectionner une note.');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${API_URL}/ratings`,
                {
                    order_id: orderId,
                    rating,
                    comment: comment.trim() || null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert('Merci ! 🌟', 'Votre avis a été enregistré.');
            onSuccess(response.data.new_avg, response.data.count);
            onClose();
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de soumettre l\'avis.');
        } finally {
            setLoading(false);
        }
    };

    const renderStars = () => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        style={styles.starButton}
                    >
                        <Ionicons
                            name={star <= rating ? 'star' : 'star-outline'}
                            size={40}
                            color={star <= rating ? '#FFD700' : '#ccc'}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>

                    <Text style={styles.title}>Noter le vendeur</Text>
                    <Text style={styles.subtitle}>{sellerName}</Text>

                    {renderStars()}

                    <Text style={styles.ratingText}>
                        {rating === 0 ? 'Touchez les étoiles' : `${rating}/5`}
                    </Text>

                    <TextInput
                        style={styles.commentInput}
                        placeholder="Commentaire (optionnel)"
                        placeholderTextColor="#999"
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        maxLength={200}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading || rating === 0}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Envoyer l'avis</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 12,
    },
    starButton: {
        padding: 4,
    },
    ratingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4C7B4B',
        marginBottom: 20,
    },
    commentInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    submitButton: {
        backgroundColor: '#4C7B4B',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
