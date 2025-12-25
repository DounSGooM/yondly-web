import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

interface MapItem {
  id: string;
  title: string;
  location: {
    lat: number;
    lng: number;
  };
  type: 'donation' | 'sale' | 'store' | 'rent';
  price_cents?: number;
  photos?: string[];
}

interface InteractiveMapProps {
  items: MapItem[];
  onItemPress?: (itemId: string) => void;
  onMarkerPress?: (itemId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export default function InteractiveMap({
  items,
  onItemPress,
  onMarkerPress,
  userLocation,
}: InteractiveMapProps) {
  const mapRef = useRef<MapView>(null);
  const handlePress = onMarkerPress || onItemPress;

  // Initial region centered on user or Paris
  const initialRegion = {
    latitude: userLocation?.lat || 48.8566,
    longitude: userLocation?.lng || 2.3522,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  }, [userLocation]);

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'donation': return '#4caf50';
      case 'sale': return '#4C7B4B';
      case 'rent': return '#f57c00';
      default: return '#4C7B4B';
    }
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'donation': return 'gift';
      case 'sale': return 'pricetag';
      case 'rent': return 'construct';
      default: return 'location'; // store
    }
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        // Use PROVIDER_DEFAULT for iOS (Apple Maps) to avoid API Key crash, 
        // PROVIDER_GOOGLE for Android (Standard).
        // If user wants Google Maps on iOS, they must add API Key and set provider={PROVIDER_GOOGLE}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
      >
        {items.map((item) => (
          <Marker
            key={item.id}
            coordinate={{
              latitude: item.location.lat,
              longitude: item.location.lng,
            }}
            onCalloutPress={() => handlePress && handlePress(item.id)}
          >
            <View style={[styles.markerContainer, { backgroundColor: getMarkerColor(item.type) }]}>
              <Ionicons name={getMarkerIcon(item.type) as any} size={14} color="#fff" />
            </View>

            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{item.title}</Text>
                {item.type === 'donation' ? (
                  <Text style={styles.calloutBadge}>GRATUIT</Text>
                ) : item.type === 'rent' && item.price_cents ? (
                  <Text style={[styles.calloutPrice, { color: '#f57c00' }]}>
                    {(item.price_cents / 100).toFixed(0)}€ /j
                  </Text>
                ) : item.price_cents ? (
                  <Text style={styles.calloutPrice}>
                    {(item.price_cents / 100).toFixed(0)}€
                  </Text>
                ) : null}
                <Text style={styles.calloutSubtext}>Cliquer pour voir</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden', // Fix rounded corners if container has them
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: '#ccc',
    marginBottom: 5,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
    textAlign: 'center',
  },
  calloutBadge: {
    backgroundColor: '#4caf50',
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  calloutPrice: {
    color: '#4C7B4B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  calloutSubtext: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  }
});
