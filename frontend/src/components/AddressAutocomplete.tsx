import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import debounce from 'lodash.debounce';

// API BAN (Base Adresse Nationale) - Free French government API
const BAN_API_URL = 'https://api-adresse.data.gouv.fr/search';

export interface AddressResult {
    label: string;           // Full address label
    street: string;          // Street name
    housenumber?: string;    // House number if available
    postcode: string;        // Postal code
    city: string;            // City name
    citycode: string;        // INSEE city code
    context: string;         // Department, region context
    lat: number;             // Latitude
    lng: number;             // Longitude
    type: string;            // Type: 'street', 'housenumber', 'municipality'
}

interface AddressAutocompleteProps {
    value?: AddressResult | null;
    onSelect: (address: AddressResult) => void;
    placeholder?: string;
    style?: any;
}

export default function AddressAutocomplete({
    value,
    onSelect,
    placeholder = "Entrez votre rue...",
    style,
}: AddressAutocompleteProps) {
    const [query, setQuery] = useState(value?.label || '');
    const [results, setResults] = useState<AddressResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selected, setSelected] = useState(!!value);

    // Debounced search function
    const searchAddress = useCallback(
        debounce(async (text: string) => {
            if (text.length < 3) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const response = await axios.get(BAN_API_URL, {
                    params: {
                        q: text,
                        type: 'street', // Focus on streets
                        limit: 8,
                        autocomplete: 1,
                    },
                });

                const features = response.data.features || [];
                const addresses: AddressResult[] = features.map((f: any) => ({
                    label: f.properties.label,
                    street: f.properties.street || f.properties.name,
                    housenumber: f.properties.housenumber,
                    postcode: f.properties.postcode,
                    city: f.properties.city,
                    citycode: f.properties.citycode,
                    context: f.properties.context,
                    lat: f.geometry.coordinates[1],
                    lng: f.geometry.coordinates[0],
                    type: f.properties.type,
                }));

                setResults(addresses);
            } catch (error) {
                console.error('Address search error:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300),
        []
    );

    const handleChangeText = (text: string) => {
        setQuery(text);
        setSelected(false);
        setShowResults(true);
        searchAddress(text);
    };

    const handleSelect = (address: AddressResult) => {
        setQuery(address.label);
        setSelected(true);
        setShowResults(false);
        setResults([]);
        onSelect(address);
    };

    const handleClear = () => {
        setQuery('');
        setSelected(false);
        setResults([]);
        onSelect(null as any);
    };

    const renderItem = ({ item }: { item: AddressResult }) => (
        <TouchableOpacity
            style={styles.resultItem}
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
        >
            <Ionicons name="location" size={20} color="#4C7B4B" style={styles.resultIcon} />
            <View style={styles.resultText}>
                <Text style={styles.resultStreet} numberOfLines={1}>
                    {item.street}
                </Text>
                <Text style={styles.resultCity} numberOfLines={1}>
                    {item.postcode} {item.city}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, style]}>
            <View style={styles.inputContainer}>
                <Ionicons
                    name={selected ? "checkmark-circle" : "search"}
                    size={20}
                    color={selected ? "#4C7B4B" : "#999"}
                    style={styles.searchIcon}
                />
                <TextInput
                    style={[styles.input, selected && styles.inputSelected]}
                    value={query}
                    onChangeText={handleChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    onFocus={() => setShowResults(true)}
                    autoComplete="street-address"
                />
                {loading && (
                    <ActivityIndicator size="small" color="#4C7B4B" style={styles.loader} />
                )}
                {query.length > 0 && !loading && (
                    <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                        <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            {showResults && results.length > 0 && !selected && (
                <View style={styles.resultsContainer}>
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                        style={styles.resultsList}
                    >
                        {results.map((item, index) => (
                            <TouchableOpacity
                                key={`${item.citycode}-${item.street}-${index}`}
                                style={styles.resultItem}
                                onPress={() => handleSelect(item)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="location" size={20} color="#4C7B4B" style={styles.resultIcon} />
                                <View style={styles.resultText}>
                                    <Text style={styles.resultStreet} numberOfLines={1}>
                                        {item.street}
                                    </Text>
                                    <Text style={styles.resultCity} numberOfLines={1}>
                                        {item.postcode} {item.city}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {selected && value && (
                <View style={styles.selectedInfo}>
                    <Text style={styles.selectedContext}>
                        📍 {value.context}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: '#333',
    },
    inputSelected: {
        color: '#4C7B4B',
        fontWeight: '500',
    },
    loader: {
        marginLeft: 8,
    },
    clearButton: {
        padding: 4,
    },
    resultsContainer: {
        position: 'relative',
        zIndex: 1000,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        marginTop: 8,
        maxHeight: 280,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    resultsList: {
        maxHeight: 280,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    resultIcon: {
        marginRight: 12,
    },
    resultText: {
        flex: 1,
    },
    resultStreet: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    resultCity: {
        fontSize: 13,
        color: '#666',
    },
    selectedInfo: {
        marginTop: 8,
        paddingHorizontal: 4,
    },
    selectedContext: {
        fontSize: 13,
        color: '#4C7B4B',
        fontWeight: '500',
    },
});
