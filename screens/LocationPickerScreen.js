// screens/LocationPickerScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Dialog, ALERT_TYPE } from 'react-native-alert-notification';

const LocationPickerScreen = ({ navigation, route }) => {
  const onSelectLocation = route.params?.onSelectLocation;

  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState(null);
  const [markerCoord, setMarkerCoord] = useState(null);
  const [address, setAddress] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Sin permiso: centramos en una región por defecto (ej. San Salvador)
          setRegion({
            latitude: 13.69294,
            longitude: -89.21819,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          setLoading(false);
          Dialog.show({
            type: ALERT_TYPE.WARNING,
            title: 'Sin permiso de ubicación',
            textBody:
              'No se pudo acceder a tu ubicación actual, pero puedes elegir un punto en el mapa de forma manual.',
            button: 'Entendido',
          });
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = position.coords;

        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
        setMarkerCoord({ latitude, longitude });
        await fetchAddress({ latitude, longitude });
      } catch (error) {
        console.log('Error al inicializar mapa:', error);
        setRegion({
          latitude: 13.69294,
          longitude: -89.21819,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchAddress = async ({ latitude, longitude }) => {
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (places && places.length > 0) {
          const place = places[0];
          const parts = [
            place.name,
            place.street,
            place.subregion || place.city,
            place.region,
            place.country,
          ].filter(Boolean);
          setAddress(parts.join(', '));
        } else {
          setAddress('');
        }
      } catch (error) {
        console.log('Error al obtener dirección en mapa:', error);
        setAddress('');
      }
    };

    init();

    // guardamos la función en el cierre
    async function fetchAddressWrapper(coords) {
      await fetchAddress(coords);
    }

    // devolvemos función para usar fuera
    LocationPickerScreen.fetchAddress = fetchAddressWrapper;
  }, []);

  const handleMapPress = async (event) => {
    const coords = event.nativeEvent.coordinate;
    setMarkerCoord(coords);

    try {
      const places = await Location.reverseGeocodeAsync(coords);
      if (places && places.length > 0) {
        const place = places[0];
        const parts = [
          place.name,
          place.street,
          place.subregion || place.city,
          place.region,
          place.country,
        ].filter(Boolean);
        setAddress(parts.join(', '));
      } else {
        setAddress('');
      }
    } catch (error) {
      console.log('Error reverse geocode tap:', error);
      setAddress('');
    }
  };

  const handleConfirm = () => {
    if (!markerCoord || !address) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: 'Selecciona una ubicación',
        textBody:
          'Toca en el mapa para elegir un punto y obtener la dirección aproximada.',
        button: 'Entendido',
      });
      return;
    }

    if (typeof onSelectLocation === 'function') {
      onSelectLocation(address);
    }

    navigation.goBack();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading || !region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#365b6d" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.topIconButton}>
          <Ionicons name="arrow-back" size={22} color="#365b6d" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Seleccionar ubicación</Text>

        <View style={styles.topIconButton} />
      </View>

      <MapView
        style={styles.map}
        initialRegion={region}
        onPress={handleMapPress}
      >
        {markerCoord && (
          <Marker
            coordinate={markerCoord}
            draggable
            onDragEnd={handleMapPress}
          />
        )}
      </MapView>

      <View style={styles.bottomCard}>
        <Text style={styles.addressLabel}>Dirección seleccionada</Text>
        <Text style={styles.addressValue}>
          {address || 'Toca en el mapa para elegir una ubicación.'}
        </Text>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Usar esta dirección</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LocationPickerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E3F2FD' },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#365b6d',
    fontSize: 14,
  },
  topBar: {
    paddingTop: 18,
    paddingHorizontal: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topIconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#E0E9F5',
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#365b6d',
  },
  map: { flex: 1 },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 6,
  },
  addressLabel: {
    fontSize: 12,
    color: '#607D8B',
  },
  addressValue: {
    fontSize: 14,
    color: '#263238',
    marginTop: 4,
  },
  confirmButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
