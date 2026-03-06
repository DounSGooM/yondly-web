import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface ProductData {
  name: string;
  category?: string;
  imageUrl?: string;
  allergens?: string[];
  ddmInfo?: string; // Info sur durabilité après DDM
  brands?: string;
  barcode: string;
}

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onProductScanned: (product: ProductData) => void;
}

export default function BarcodeScanner({ visible, onClose, onProductScanned }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset states when modal closes
  useEffect(() => {
    if (!visible) {
      setScanned(false);
      setLoading(false);
    }
  }, [visible]);

  const fetchProductData = async (barcode: string) => {
    try {
      setLoading(true);
      console.log('Fetching product data for barcode:', barcode);
      const response = await axios.get(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
        timeout: 10000, // 10 seconds timeout
      });
      console.log('OpenFoodFacts response status:', response.data.status);

      if (response.data.status === 1) {
        const product = response.data.product;

        // Extraire les allergènes
        const allergens: string[] = [];
        if (product.allergens_tags) {
          allergens.push(...product.allergens_tags.map((tag: string) =>
            tag.replace('en:', '').replace(/-/g, ' ')
          ));
        }

        // Info DDM (Date de Durabilité Minimale)
        let ddmInfo = "Consommable plusieurs jours/semaines après la DDM selon le produit";
        if (product.categories_tags?.includes('en:dairy')) {
          ddmInfo = "Produit laitier : généralement consommable 1-2 semaines après DDM si bien conservé";
        } else if (product.categories_tags?.includes('en:beverages')) {
          ddmInfo = "Boisson : souvent consommable plusieurs mois après DDM";
        } else if (product.categories_tags?.includes('en:dry-products')) {
          ddmInfo = "Produit sec : consommable plusieurs mois après DDM";
        }

        const productData: ProductData = {
          name: product.product_name || product.product_name_fr || 'Produit sans nom',
          category: product.categories_tags?.[0]?.replace('en:', '').replace(/-/g, ' ') || undefined,
          imageUrl: product.image_url || product.image_front_url || undefined,
          allergens: allergens.length > 0 ? allergens : undefined,
          ddmInfo,
          brands: product.brands || undefined,
          barcode,
        };

        console.log('Calling onProductScanned with:', productData);
        onProductScanned(productData);
        console.log('Calling onClose');
        onClose();
        console.log('Scanner should close now');
      } else {
        // Produit non trouvé
        Alert.alert(
          'Produit non trouvé',
          'Ce code-barres n\'est pas dans la base OpenFoodFacts. Voulez-vous saisir manuellement ?',
          [
            {
              text: 'Contribuer à OpenFoodFacts',
              onPress: () => {
                // Ouvrir le lien pour ajouter le produit
                Alert.alert('Info', `Vous pouvez ajouter ce produit sur openfoodfacts.org\nCode-barres: ${barcode}`);
                onClose();
              }
            },
            {
              text: 'Saisie manuelle',
              onPress: () => {
                onProductScanned({
                  name: '',
                  barcode,
                });
                onClose();
              }
            },
            {
              text: 'Rescanner',
              onPress: () => setScanned(false),
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
      Alert.alert('Erreur', 'Impossible de récupérer les données du produit. Continuer en mode manuel ?', [
        {
          text: 'Oui',
          onPress: () => {
            onProductScanned({
              name: '',
              barcode,
            });
            onClose();
          }
        },
        {
          text: 'Rescanner',
          onPress: () => setScanned(false)
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);

    // Vérifier que c'est un code EAN-13
    if (data.length === 13 && /^\d+$/.test(data)) {
      fetchProductData(data);
    } else {
      Alert.alert(
        'Code non supporté',
        'Seuls les codes-barres EAN-13 sont supportés pour l\'instant.',
        [
          { text: 'Rescanner', onPress: () => setScanned(false) },
          { text: 'Annuler', onPress: onClose }
        ]
      );
    }
  };

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <Text style={styles.noPermissionText}>Demande de permission caméra...</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <Ionicons name="videocam-off-outline" size={64} color="#999" />
          <Text style={styles.noPermissionText}>Accès à la caméra requis</Text>
          <Text style={styles.noPermissionSubtext}>
            Nous avons besoin de la caméra pour scanner les codes-barres
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={requestPermission}>
            <Text style={styles.closeButtonText}>Autoriser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: '#999', marginTop: 12 }]} onPress={onClose}>
            <Text style={styles.closeButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scanner le code-barres</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          // Show loading state instead of camera
          <View style={styles.loadingFullScreen}>
            <ActivityIndicator size="large" color="#4C7B4B" />
            <Text style={styles.loadingText}>Recherche du produit...</Text>
          </View>
        ) : (
          <View style={styles.scannerContainer}>
            <CameraView
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{
                barcodeTypes: ['ean13'],
              }}
            />

            <View style={styles.overlay}>
              <View style={styles.scanArea} />
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.instructionText}>
            {loading ? 'Veuillez patienter...' : scanned ? 'Code scanné !' : 'Positionnez le code-barres EAN-13 dans le cadre'}
          </Text>
          {scanned && !loading && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.rescanButtonText}>Rescanner</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeIcon: {
    padding: 8,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 280,
    height: 180,
    borderWidth: 3,
    borderColor: '#4C7B4B',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFullScreen: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  footer: {
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4C7B4B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noPermissionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  noPermissionSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  closeButton: {
    backgroundColor: '#4C7B4B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
