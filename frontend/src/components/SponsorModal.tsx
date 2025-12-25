import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  message: string;
  website?: string;
}

interface SponsorModalProps {
  visible: boolean;
  sponsor: Sponsor | null;
  onClose: () => void;
}

export default function SponsorModal({ visible, sponsor, onClose }: SponsorModalProps) {
  if (!sponsor) return null;

  const handleVisitWebsite = () => {
    if (sponsor.website) {
      Linking.openURL(sponsor.website);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="heart" size={32} color="#4C7B4B" />
            <Text style={styles.headerTitle}>Don sponsorisé</Text>
          </View>

          {/* Sponsor Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>{sponsor.logo_url}</Text>
          </View>

          {/* Sponsor Name */}
          <Text style={styles.sponsorName}>{sponsor.name}</Text>

          {/* Sponsor Message */}
          <Text style={styles.message}>{sponsor.message}</Text>

          {/* Website Button */}
          {sponsor.website && (
            <TouchableOpacity style={styles.websiteButton} onPress={handleVisitWebsite}>
              <Ionicons name="globe-outline" size={20} color="#4C7B4B" />
              <Text style={styles.websiteButtonText}>Visiter le site web</Text>
            </TouchableOpacity>
          )}

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 48,
  },
  sponsorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4C7B4B',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4C7B4B',
    marginBottom: 16,
  },
  websiteButtonText: {
    fontSize: 15,
    color: '#4C7B4B',
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#4C7B4B',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
