// screens/ProfilePhotoScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COL_USUARIOS } from '../src/utils/collections';
import { Dialog, ALERT_TYPE } from 'react-native-alert-notification';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadImageToCloudinary } from '../src/services/cloudinary';



const logo = require('../assets/logologin.png');

const ProfilePhotoScreen = ({ route, navigation }) => {
  const { userId } = route.params;

  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  const [imageUri, setImageUri] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: 'Permiso requerido',
          textBody:
            'Necesitamos acceso a tu galería para elegir una foto de perfil.',
          button: 'Entendido',
        });
      }
    })();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.fontLoadingContainer}>
        <ActivityIndicator size="large" color="#365b6d" />
      </View>
    );
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.IMAGE],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
      }
    } catch (error) {
      console.log('Error al seleccionar imagen:', error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'No se pudo abrir la galería. Intenta nuevamente.',
        button: 'Cerrar',
      });
    }
  };

  const handleSave = async () => {
    if (!imageUri) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: 'Sin imagen',
        textBody: 'Selecciona una foto antes de continuar.',
        button: 'Entendido',
      });
      return;
    }

    try {
      setSaving(true);

      // 1) Subir la imagen a Cloudinary
      const imageUrl = await uploadImageToCloudinary(imageUri);

      // 2) Actualizar al usuario en Firestore con la URL de Cloudinary
      const userRef = doc(db, COL_USUARIOS, userId);
      await updateDoc(userRef, {
        tieneFotoLocal: true,        // sigue indicando que ya configuró foto
        fotoPerfilUrl: imageUrl,     // ahora sí, URL en la nube
      });

      // 3) Guardar también la foto local en AsyncStorage (para uso offline/rápido)
      await AsyncStorage.setItem(`@userPhoto_${userId}`, imageUri);

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Foto configurada',
        textBody:
          'Tu foto se guardó correctamente. Podrás verla en tu perfil y cambiarla cuando quieras.',
        button: 'Continuar',
        onHide: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        },
      });
    } catch (error) {
      console.log('Error al guardar estado de foto:', error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody:
          'No se pudo guardar la configuración. Intenta nuevamente más tarde.',
        button: 'Cerrar',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* header con logo */}
      <View style={styles.logoContainer}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>PetHealthyApp</Text>
        <Text style={styles.appSubtitle}>
          Una última cosa: elige una foto para reconocerte mejor 🐾
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Foto de perfil</Text>
        <Text style={styles.subtitle}>
          Esta foto solo se usará en esta app para identificarte junto a tus
          mascotas.
        </Text>

        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <Text style={styles.imagePlaceholderText}>
              Toca para elegir una foto
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Guardar y continuar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fontLoadingContainer: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    marginTop: Platform.OS === 'ios' ? 25 : 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 1,
  },
  appName: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#365b6d',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#558B2F',
    marginTop: 2,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263238',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#607D8B',
    marginBottom: 20,
  },
  imageContainer: {
    alignSelf: 'center',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#CFD8DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholderText: {
    color: '#90A4AE',
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ProfilePhotoScreen;
