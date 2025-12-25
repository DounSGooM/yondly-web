import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    SafeAreaView,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Category {
    id: string;
    label: string;
    icon: string;
}

interface CategoryDropdownProps {
    categories: Category[];
    selectedCategory: string;
    onSelectCategory: (id: string) => void;
}

export default function CategoryDropdown({
    categories,
    selectedCategory,
    onSelectCategory,
}: CategoryDropdownProps) {
    const [visible, setVisible] = useState(false);

    const selectedItem = categories.find((c) => c.id === selectedCategory) || categories[0];

    const handleSelect = (id: string) => {
        onSelectCategory(id);
        setVisible(false);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.button}
                onPress={() => setVisible(true)}
                activeOpacity={0.7}
            >
                <View style={styles.buttonContent}>
                    <Text style={styles.icon}>{selectedItem.icon}</Text>
                    <Text style={styles.label}>{selectedItem.label}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.dropdownContainer}>
                            <View style={styles.dropdownHeader}>
                                <Text style={styles.dropdownTitle}>Choisir une catégorie</Text>
                                <TouchableOpacity onPress={() => setVisible(false)}>
                                    <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={categories}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.item,
                                            selectedCategory === item.id && styles.selectedItem,
                                        ]}
                                        onPress={() => handleSelect(item.id)}
                                    >
                                        <Text style={styles.itemIcon}>{item.icon}</Text>
                                        <Text
                                            style={[
                                                styles.itemLabel,
                                                selectedCategory === item.id && styles.selectedItemLabel,
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                        {selectedCategory === item.id && (
                                            <Ionicons name="checkmark" size={20} color="#4C7B4B" />
                                        )}
                                    </TouchableOpacity>
                                )}
                                style={styles.list}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        fontSize: 18,
        marginRight: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    dropdownContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        paddingBottom: 30, // For safe area
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    list: {
        padding: 8,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    selectedItem: {
        backgroundColor: '#e8f5e9',
    },
    itemIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    itemLabel: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    selectedItemLabel: {
        fontWeight: '600',
        color: '#4C7B4B',
    },
});
