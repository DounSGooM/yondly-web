import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    initialFilters: FilterState;
}

export interface FilterState {
    minPrice: string;
    maxPrice: string;
    conditions: string[];
    sortBy: string;
    radiusKm: number | null;
}

const CONDITIONS = [
    { id: 'new', label: 'Neuf' },
    { id: 'good', label: 'Bon état' },
    { id: 'repair', label: 'À réparer' },
];

const SORT_OPTIONS = [
    { id: 'date_desc', label: 'Plus récent' },
    { id: 'price_asc', label: 'Prix croissant' },
    { id: 'price_desc', label: 'Prix décroissant' },
    { id: 'distance', label: 'Plus proche' },
];

const DISTANCE_OPTIONS = [1, 5, 10, 20, 50, 100];

export default function FilterModal({ visible, onClose, onApply, initialFilters }: FilterModalProps) {
    const [filters, setFilters] = useState<FilterState>(initialFilters);

    useEffect(() => {
        if (visible) {
            setFilters(initialFilters);
        }
    }, [visible, initialFilters]);

    const toggleCondition = (id: string) => {
        setFilters(prev => {
            const exists = prev.conditions.includes(id);
            if (exists) {
                return { ...prev, conditions: prev.conditions.filter(c => c !== id) };
            } else {
                return { ...prev, conditions: [...prev.conditions, id] };
            }
        });
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        setFilters({
            minPrice: '',
            maxPrice: '',
            conditions: [],
            sortBy: 'date_desc',
            radiusKm: null,
        });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Filtres</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Prix */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Prix (€)</Text>
                            <View style={styles.priceRow}>
                                <View style={styles.priceInputContainer}>
                                    <Text style={styles.currencyPrefix}>min</Text>
                                    <TextInput
                                        style={styles.priceInput}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={filters.minPrice}
                                        onChangeText={t => setFilters({ ...filters, minPrice: t })}
                                    />
                                </View>
                                <Text style={styles.priceSeparator}>-</Text>
                                <View style={styles.priceInputContainer}>
                                    <Text style={styles.currencyPrefix}>max</Text>
                                    <TextInput
                                        style={styles.priceInput}
                                        placeholder="Illimité"
                                        keyboardType="numeric"
                                        value={filters.maxPrice}
                                        onChangeText={t => setFilters({ ...filters, maxPrice: t })}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* État */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>État</Text>
                            <View style={styles.chipsContainer}>
                                {CONDITIONS.map(c => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[
                                            styles.chip,
                                            filters.conditions.includes(c.id) && styles.chipActive
                                        ]}
                                        onPress={() => toggleCondition(c.id)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            filters.conditions.includes(c.id) && styles.chipTextActive
                                        ]}>{c.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Distance */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Rayon (km)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.chipsContainer}>
                                    {DISTANCE_OPTIONS.map(d => (
                                        <TouchableOpacity
                                            key={d}
                                            style={[
                                                styles.chip,
                                                filters.radiusKm === d && styles.chipActive
                                            ]}
                                            onPress={() => setFilters({ ...filters, radiusKm: filters.radiusKm === d ? null : d })}
                                        >
                                            <Text style={[
                                                styles.chipText,
                                                filters.radiusKm === d && styles.chipTextActive
                                            ]}>{d} km</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        {/* Tri */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Trier par</Text>
                            {SORT_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={styles.radioOption}
                                    onPress={() => setFilters({ ...filters, sortBy: opt.id })}
                                >
                                    <Text style={[
                                        styles.radioText,
                                        filters.sortBy === opt.id && styles.radioTextActive
                                    ]}>{opt.label}</Text>
                                    <View style={[
                                        styles.radioCircle,
                                        filters.sortBy === opt.id && styles.radioCircleActive
                                    ]}>
                                        {filters.sortBy === opt.id && <View style={styles.radioDot} />}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                            <Text style={styles.resetText}>Réinitialiser</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
                            <Text style={styles.applyText}>Voir les résultats</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        backgroundColor: '#f9f9f9',
    },
    priceInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginLeft: 8,
    },
    currencyPrefix: {
        fontSize: 14,
        color: '#999',
    },
    priceSeparator: {
        marginHorizontal: 12,
        color: '#999',
        fontSize: 20,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipActive: {
        backgroundColor: '#e8f5e9',
        borderColor: '#4C7B4B',
    },
    chipText: {
        fontSize: 14,
        color: '#666',
    },
    chipTextActive: {
        color: '#4C7B4B',
        fontWeight: '600',
    },
    radioOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    radioText: {
        fontSize: 16,
        color: '#333',
    },
    radioTextActive: {
        color: '#4C7B4B',
        fontWeight: '600',
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleActive: {
        borderColor: '#4C7B4B',
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4C7B4B',
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 12,
    },
    resetButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    resetText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    applyButton: {
        flex: 2,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#4C7B4B',
    },
    applyText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
