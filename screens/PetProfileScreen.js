// screens/PetProfileScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { ALERT_TYPE, Dialog } from 'react-native-alert-notification';

import { db } from '../firebase/config';
import { COL_MASCOTAS } from '../src/utils/collections';

const contextoLabels = {
  adentro: 'Dentro de casa',
  afuera: 'Fuera de casa',
  mixto: 'Mixto',
};

const frecuenciaLabels = {
  nulo: 'Casi nunca',
  regular: 'A veces',
  diario: 'Diario',
};

const relacionLabels = {
  juegan: 'Juegan mucho',
  se_pelean: 'A veces se pelean',
  no_unidos: 'No son muy unidos',
  conviven_bien: 'Conviven sin problema',
};

const PetProfileScreen = ({ navigation, route }) => {
  const { petId } = route.params || {};

  const [pet, setPet] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!petId) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'No se pudo identificar la mascota.',
        button: 'Volver',
        onPressButton: () => {
          Dialog.hide();
          navigation.goBack();
        },
      });
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Perfil de la mascota
        const petRef = doc(db, COL_MASCOTAS, petId);
        const petSnap = await getDoc(petRef);

        if (!petSnap.exists()) {
          throw new Error('La mascota no existe o fue eliminada.');
        }

        const petData = { id: petSnap.id, ...petSnap.data() };
        setPet(petData);

        // Historial inicial
        const historyRef = doc(db, COL_MASCOTAS, petId, 'historial', 'inicial');
        const historySnap = await getDoc(historyRef);

        if (historySnap.exists()) {
          setHistory({ id: historySnap.id, ...historySnap.data() });
        } else {
          setHistory(null);
        }
      } catch (error) {
        console.error('Error cargando perfil de mascota:', error);
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody:
            error.message ||
            'Ocurrió un problema al cargar la información de la mascota.',
          button: 'Volver',
          onPressButton: () => {
            Dialog.hide();
            navigation.goBack();
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [petId, navigation]);

  const formatAge = () => {
    if (!pet) return '';
    if (!pet.edadValor || !pet.edadTipo) return 'Edad no especificada';
    const unidad =
      pet.edadTipo === 'años'
        ? pet.edadValor === 1
          ? 'año'
          : 'años'
        : pet.edadValor === 1
        ? 'mes'
        : 'meses';
    return `${pet.edadValor} ${unidad}`;
  };

  const formatBool = (value) => (value ? 'Sí' : 'No');

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading || !pet) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#365b6d" />
        <Text style={styles.loadingText}>Cargando información de la mascota...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color="#365b6d" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {pet.nombre || 'Mascota'}
        </Text>

        <View style={styles.headerRight}>
          {/* Aquí más adelante podemos poner botón de editar */}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* SECCIÓN PERFIL */}
        <View style={styles.card}>
          <View style={styles.photoWrapper}>
            {pet.fotoUrl ? (
              <Image
                source={{ uri: pet.fotoUrl }}
                style={styles.petImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.petImagePlaceholder}>
                <Ionicons name="paw-outline" size={40} color="#4B5563" />
              </View>
            )}
          </View>

          <Text style={styles.petName}>{pet.nombre}</Text>
          <Text style={styles.petSubInfo}>
            {pet.especie ? pet.especie.toUpperCase() : 'ESPECIE'} · {formatAge()}
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Sexo</Text>
              <Text style={styles.infoValue}>
                {pet.sexo === 'macho'
                  ? 'Macho'
                  : pet.sexo === 'hembra'
                  ? 'Hembra'
                  : 'No especificado'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Microchip</Text>
              <Text style={styles.infoValue}>{formatBool(pet.tieneMicrochip)}</Text>
              {pet.tieneMicrochip && pet.identificadorMicrochip ? (
                <Text style={styles.infoExtra}>{pet.identificadorMicrochip}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tatuaje</Text>
              <Text style={styles.infoValue}>{formatBool(pet.poseeTatuaje)}</Text>
            </View>
          </View>
        </View>

        {/* SECCIÓN HISTORIAL MÉDICO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Historial médico</Text>

          {!history ? (
            <Text style={styles.emptyText}>
              Aún no hay historial médico inicial registrado para esta mascota.
            </Text>
          ) : (
            <>
              {/* Vacunas */}
              <Text style={styles.sectionSubtitle}>Vacunas aplicadas</Text>
              {history.vacunas && history.vacunas.length > 0 ? (
                history.vacunas.map((v, index) => (
                  <View key={`${v.nombre}-${index}`} style={styles.lineRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.lineText}>
                      {v.nombre} {v.fecha && `· ${formatDate(v.fecha)}`}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptySubText}>
                  No se registraron vacunas en el historial inicial.
                </Text>
              )}

              {/* Desparasitación */}
              <Text style={styles.sectionSubtitle}>Desparasitación</Text>
              {history.desparacitaciones &&
              history.desparacitaciones.length > 0 ? (
                history.desparacitaciones.map((d, index) => (
                  <View key={`${d.tipo}-${index}`} style={styles.lineRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.lineText}>
                      {d.tipo} {d.fecha && `· ${formatDate(d.fecha)}`}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptySubText}>
                  No se registraron desparasitaciones en el historial inicial.
                </Text>
              )}

              {/* Condiciones / contexto */}
              <Text style={styles.sectionSubtitle}>Condiciones y contexto</Text>
              <View style={styles.tagRow}>
                {history.contextoVivienda ? (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {contextoLabels[history.contextoVivienda] ||
                        history.contextoVivienda}
                    </Text>
                  </View>
                ) : null}
                {history.frecuenciaPaseo ? (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      Paseo: {frecuenciaLabels[history.frecuenciaPaseo] ||
                        history.frecuenciaPaseo}
                    </Text>
                  </View>
                ) : null}
              </View>
              {history.condicionesMedicas ? (
                <Text style={styles.paragraph}>
                  {history.condicionesMedicas}
                </Text>
              ) : (
                <Text style={styles.emptySubText}>
                  No se registraron condiciones médicas o alergias específicas.
                </Text>
              )}

              {/* Convivencia */}
              <Text style={styles.sectionSubtitle}>Convivencia</Text>
              <Text style={styles.paragraph}>
                Vive con otros animales: {formatBool(history.viveConOtrosAnimales)}
              </Text>
              {history.viveConOtrosAnimales && (
                <>
                  {history.relacionConOtrosAnimales ? (
                    <Text style={styles.paragraph}>
                      Relación:{' '}
                      {relacionLabels[history.relacionConOtrosAnimales] ||
                        history.relacionConOtrosAnimales}
                    </Text>
                  ) : null}
                  {history.descripcionConvivencia ? (
                    <Text style={styles.paragraph}>
                      {history.descripcionConvivencia}
                    </Text>
                  ) : null}
                </>
              )}

              {/* Agresividad */}
              <Text style={styles.sectionSubtitle}>Agresividad</Text>
              <Text style={styles.paragraph}>
                Es agresiva: {formatBool(history.esAgresivo)}
              </Text>
              {history.esAgresivo && history.descripcionAgresividad ? (
                <Text style={styles.paragraph}>
                  {history.descripcionAgresividad}
                </Text>
              ) : null}

              {/* Viajes */}
              <Text style={styles.sectionSubtitle}>Viajes</Text>
              <Text style={styles.paragraph}>
                Viaja regularmente: {formatBool(history.viajaRegularmente)}
              </Text>
              {history.viajaRegularmente && history.descripcionViajes ? (
                <Text style={styles.paragraph}>
                  {history.descripcionViajes}
                </Text>
              ) : null}

              {/* Compromiso */}
              <Text style={styles.sectionSubtitle}>Compromiso de veracidad</Text>
              <Text style={styles.paragraph}>
                El propietario confirmó que la información proporcionada es
                verdadera y completa:{' '}
                {formatBool(history.compromisoVeracidad)}
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default PetProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#607D8B',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 24,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#263238',
  },
  headerRight: {
    width: 36,
    height: 36,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  photoWrapper: {
    width: '100%',
    aspectRatio: 2,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  petImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  petSubInfo: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  infoExtra: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  emptyText: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  emptySubText: {
    marginTop: 2,
    fontSize: 12,
    color: '#9CA3AF',
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginRight: 6,
  },
  lineText: {
    fontSize: 13,
    color: '#374151',
    flexShrink: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    marginBottom: 4,
  },
  tag: {
    backgroundColor: '#E0F2FE',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '500',
  },
  paragraph: {
    marginTop: 4,
    fontSize: 13,
    color: '#374151',
  },
});
