import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    LayoutAnimation,
    Platform,
    UIManager,
    Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
    {
        category: 'Vente & Dons',
        items: [
            {
                question: 'Comment créer une annonce ?',
                answer: 'Allez dans l\'onglet "Vente" ou "Dons" et cliquez sur le bouton "+" en bas à droite. Remplissez ensuite le formulaire avec les détails de votre objet et ajoutez des photos.',
            },
            {
                question: 'Comment fonctionnent les dons ?',
                answer: 'Les dons sont gratuits. Vous proposez un objet, et un utilisateur intéressé vous contacte pour convenir d\'un rendez-vous pour le récupérer.',
            },
            {
                question: 'Puis-je modifier mon annonce ?',
                answer: 'Oui, allez dans "Profil" > "Mes annonces", sélectionnez l\'annonce concernée et cliquez sur "Modifier".',
            },
        ],
    },
    {
        category: 'Achats & Paiements',
        items: [
            {
                question: 'Comment payer un article ?',
                answer: 'Le paiement se fait via l\'application de manière sécurisée. Cliquez sur "Acheter" sur l\'annonce, et suivez les instructions.',
            },
            {
                question: 'Mes informations bancaires sont-elles sécurisées ?',
                answer: 'Oui, nous utilisons un processeur de paiement sécurisé (Stripe) et ne stockons jamais vos informations bancaires complètes.',
            },
        ],
    },
    {
        category: 'Compte & Sécurité',
        items: [
            {
                question: 'Comment changer mon mot de passe ?',
                answer: 'Pour le moment, vous devez vous déconnecter et utiliser la fonction "Mot de passe oublié" sur l\'écran de connexion.',
            },
            {
                question: 'Comment supprimer mon compte ?',
                answer: 'Allez dans "Profil" > "Paramètres" > "Supprimer mon compte". Attention, cette action est irréversible.',
            },
        ],
    },
];

export default function HelpScreen() {
    const router = useRouter();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (expandedItems.includes(id)) {
            setExpandedItems(expandedItems.filter((item) => item !== id));
        } else {
            setExpandedItems([...expandedItems, id]);
        }
    };

    const contactSupport = () => {
        Linking.openURL('mailto:support@yondly.com?subject=Demande%20d%27aide%20Yondly');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Centre d'aide</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.banner}>
                    <Ionicons name="help-buoy" size={48} color="#4C7B4B" />
                    <Text style={styles.bannerTitle}>Comment pouvons-nous vous aider ?</Text>
                    <Text style={styles.bannerSubtitle}>Trouvez des réponses aux questions fréquentes ci-dessous.</Text>
                </View>

                {FAQ_DATA.map((section, sectionIndex) => (
                    <View key={sectionIndex} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.category}</Text>
                        {section.items.map((item, itemIndex) => {
                            const id = `${sectionIndex}-${itemIndex}`;
                            const isExpanded = expandedItems.includes(id);
                            return (
                                <View key={itemIndex} style={styles.faqItem}>
                                    <TouchableOpacity
                                        style={styles.questionRow}
                                        onPress={() => toggleExpand(id)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.questionText, isExpanded && styles.questionTextActive]}>
                                            {item.question}
                                        </Text>
                                        <Ionicons
                                            name={isExpanded ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color={isExpanded ? "#4C7B4B" : "#999"}
                                        />
                                    </TouchableOpacity>
                                    {isExpanded && (
                                        <View style={styles.answerContainer}>
                                            <Text style={styles.answerText}>{item.answer}</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ))}

                <View style={styles.contactSection}>
                    <Text style={styles.contactTitle}>Vous ne trouvez pas votre réponse ?</Text>
                    <TouchableOpacity style={styles.contactButton} onPress={contactSupport}>
                        <Ionicons name="mail" size={20} color="#fff" />
                        <Text style={styles.contactButtonText}>Contacter le support</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    content: {
        flex: 1,
    },
    banner: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#fff',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    bannerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        textAlign: 'center',
    },
    bannerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    faqItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    questionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    questionText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
        flex: 1,
        marginRight: 16,
    },
    questionTextActive: {
        color: '#4C7B4B',
        fontWeight: '600',
    },
    answerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#f9f9f9',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    answerText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 22,
        marginTop: 12,
    },
    contactSection: {
        padding: 24,
        alignItems: 'center',
        marginTop: 8,
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4C7B4B',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
        elevation: 2,
        shadowColor: '#4C7B4B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    contactButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
