import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';

interface MapItem {
  id: string;
  title: string;
  location: {
    lat?: number;
    lng?: number;
    type?: string;
    coordinates?: number[];
  };
  type: 'donation' | 'sale' | 'store' | 'rent';
  price_cents?: number;
  photos?: string[];
}

// Helper to extract lat/lng from either format
const getCoords = (location: MapItem['location']): { lat: number; lng: number } | null => {
  if (location.lat !== undefined && location.lng !== undefined) {
    return { lat: location.lat, lng: location.lng };
  }
  if (location.coordinates && location.coordinates.length >= 2) {
    // GeoJSON: [longitude, latitude]
    return { lat: location.coordinates[1], lng: location.coordinates[0] };
  }
  return null;
};

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
  const mapRef = useRef<any>(null);
  const handlePress = onMarkerPress || onItemPress;

  // Initial region centered on user or Paris
  const initialRegion = {
    latitude: userLocation?.lat || 48.8566,
    longitude: userLocation?.lng || 2.3522,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  useEffect(() => {
    if (userLocation && mapRef.current && Platform.OS !== 'web') {
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

  const [currentRegion, setCurrentRegion] = useState(initialRegion);

  const handleZoom = (zoomIn: boolean) => {
    if (!mapRef.current) return;
    const newDelta = zoomIn ? currentRegion.latitudeDelta / 2 : currentRegion.latitudeDelta * 2;
    const clampedDelta = Math.max(0.002, Math.min(newDelta, 5));
    const newRegion = {
      latitude: currentRegion.latitude,
      longitude: currentRegion.longitude,
      latitudeDelta: clampedDelta,
      longitudeDelta: clampedDelta,
    };
    setCurrentRegion(newRegion);
    mapRef.current.animateToRegion(newRegion, 300);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        onRegionChangeComplete={(region) => {
          setCurrentRegion(region);
        }}
      >
        {items.map((item) => {
          const coords = getCoords(item.location);
          if (!coords) return null;
          return (
            <Marker
              key={item.id}
              coordinate={{
                latitude: coords.lat,
                longitude: coords.lng,
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
          );
        })}
      </MapView>

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={() => handleZoom(true)} activeOpacity={0.7}>
          <Ionicons name="add" size={22} color="#333" />
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity style={styles.zoomButton} onPress={() => handleZoom(false)} activeOpacity={0.7}>
          <Ionicons name="remove" size={22} color="#333" />
        </TouchableOpacity>
      </View>
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
  },
  webFallback: {
    flex: 1,
    backgroundColor: '#f8faf8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  webFallbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  webFallbackText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  webFallbackCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4C7B4B',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  zoomControls: {
    position: 'absolute',
    right: 12,
    bottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  zoomButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
});
