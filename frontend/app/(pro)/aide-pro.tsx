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

const PRO_FAQ_DATA = [
    {
        category: 'Gestion des paniers',
        items: [
            {
                question: 'Comment créer un panier surprise ?',
                answer: 'Appuyez sur le bouton "+" au centre de la barre de navigation. Ajoutez une photo, définissez le prix et la valeur estimée, puis choisissez le créneau de récupération. Publiez et votre panier sera visible pour les clients.',
            },
            {
                question: 'Puis-je modifier un panier après publication ?',
                answer: 'Les paniers en vente peuvent être supprimés depuis "Mes paniers". Pour modifier le contenu ou le prix, vous devez supprimer le panier et en créer un nouveau.',
            },
            {
                question: 'Comment gérer plusieurs paniers ?',
                answer: 'Depuis le dashboard, cliquez sur "Paniers actifs" pour voir tous vos paniers en vente. Vous pouvez aussi définir une quantité lors de la création pour proposer plusieurs paniers identiques.',
            },
        ],
    },
    {
        category: 'Retraits & Scanner',
        items: [
            {
                question: 'Comment valider un retrait client ?',
                answer: 'Depuis le dashboard ou la page Compte, accédez au "Scanner retrait". Scannez le QR code du client ou entrez son code à 6 caractères manuellement. La commande sera automatiquement validée et le paiement libéré.',
            },
            {
                question: 'Que faire si le client n\'a pas son code ?',
                answer: 'Le client peut retrouver son code dans l\'application via "Mes commandes". Si le problème persiste, demandez-lui de vérifier son email de confirmation ou contactez notre support.',
            },
            {
                question: 'Un client ne vient pas récupérer son panier ?',
                answer: 'Après la fin du créneau de récupération, vous pouvez contacter le client via la messagerie. Si le retrait n\'est pas effectué sous 24h, vous pouvez demander l\'annulation auprès du support.',
            },
        ],
    },
    {
        category: 'Paiements & Revenus',
        items: [
            {
                question: 'Quand suis-je payé ?',
                answer: 'Le paiement est libéré immédiatement après validation du retrait via le scanner. Les fonds sont crédités sur votre portefeuille Yondly et peuvent être transférés sur votre compte bancaire.',
            },
            {
                question: 'Quels sont les frais de la plateforme ?',
                answer: 'Yondly prélève une commission de 15% sur chaque vente. Cette commission couvre les frais de paiement, l\'assurance transaction et l\'accès à la plateforme.',
            },
            {
                question: 'Comment retirer mes gains ?',
                answer: 'Allez dans "Compte" > "Portefeuille & Paiements". Ajoutez vos coordonnées bancaires (IBAN) et demandez un virement. Les virements sont traités sous 2-3 jours ouvrés.',
            },
        ],
    },
    {
        category: 'Statistiques & Performance',
        items: [
            {
                question: 'Comment voir mon chiffre d\'affaires ?',
                answer: 'Depuis le dashboard, cliquez sur la carte "Chiffre d\'affaires" pour voir le détail jour par jour, ainsi que les totaux hebdomadaires et mensuels.',
            },
            {
                question: 'Comment améliorer mes ventes ?',
                answer: 'Publiez vos paniers entre 14h et 16h pour maximiser la visibilité. Ajoutez des photos attractives et variez le contenu de vos paniers. Les paniers avec une réduction de plus de 50% se vendent mieux.',
            },
        ],
    },
];

const QUICK_ACTIONS = [
    {
        icon: 'call',
        title: 'Ligne Pro dédiée',
        subtitle: 'Du lundi au vendredi, 9h-18h',
        action: () => Linking.openURL('tel:+33123456789'),
    },
    {
        icon: 'mail',
        title: 'Email prioritaire',
        subtitle: 'Réponse sous 24h',
        action: () => Linking.openURL('mailto:pro@yondly.com?subject=Support%20Pro%20Yondly'),
    },
    {
        icon: 'chatbubbles',
        title: 'Chat en direct',
        subtitle: 'Disponible 7j/7',
        action: () => Linking.openURL('https://yondly.com/chat'),
    },
];

export default function ProHelpScreen() {
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Aide Pro</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Pro Banner */}
                <View style={styles.banner}>
                    <View style={styles.proBadge}>
                        <Ionicons name="shield-checkmark" size={16} color="#fff" />
                        <Text style={styles.proBadgeText}>SUPPORT PRO</Text>
                    </View>
                    <Text style={styles.bannerTitle}>Assistance prioritaire</Text>
                    <Text style={styles.bannerSubtitle}>
                        En tant que partenaire Pro, vous bénéficiez d'un support dédié.
                    </Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    {QUICK_ACTIONS.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.quickAction}
                            onPress={action.action}
                        >
                            <View style={styles.quickActionIcon}>
                                <Ionicons name={action.icon as any} size={24} color="#4C7B4B" />
                            </View>
                            <Text style={styles.quickActionTitle}>{action.title}</Text>
                            <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* FAQ */}
                <Text style={styles.faqTitle}>Questions fréquentes</Text>

                {PRO_FAQ_DATA.map((section, sectionIndex) => (
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

                {/* Resources */}
                <View style={styles.resourcesSection}>
                    <Text style={styles.resourcesTitle}>Ressources Pro</Text>
                    <TouchableOpacity style={styles.resourceItem}>
                        <Ionicons name="document-text-outline" size={20} color="#4C7B4B" />
                        <Text style={styles.resourceText}>Guide du commerçant</Text>
                        <Ionicons name="download-outline" size={18} color="#999" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.resourceItem}>
                        <Ionicons name="videocam-outline" size={20} color="#4C7B4B" />
                        <Text style={styles.resourceText}>Tutoriels vidéo</Text>
                        <Ionicons name="open-outline" size={18} color="#999" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.resourceItem}>
                        <Ionicons name="bar-chart-outline" size={20} color="#4C7B4B" />
                        <Text style={styles.resourceText}>Bonnes pratiques</Text>
                        <Ionicons name="open-outline" size={18} color="#999" />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
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
        padding: 24,
        backgroundColor: '#4C7B4B',
        marginBottom: 16,
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        marginBottom: 12,
    },
    proBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    bannerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8,
    },
    bannerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 8,
        textAlign: 'center',
    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 24,
    },
    quickAction: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickActionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    quickActionSubtitle: {
        fontSize: 10,
        color: '#999',
        marginTop: 4,
        textAlign: 'center',
    },
    faqTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginHorizontal: 16,
        marginBottom: 16,
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    faqItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
    },
    questionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    questionText: {
        fontSize: 14,
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
        fontSize: 13,
        color: '#555',
        lineHeight: 20,
        marginTop: 12,
    },
    resourcesSection: {
        marginHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
    },
    resourcesTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    resourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        gap: 12,
    },
    resourceText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
});
