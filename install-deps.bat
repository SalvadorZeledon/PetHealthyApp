echo "Instalando TODAS las dependencias definidas en package.json..."
npm install

echo "Sincronizando dependencias gestionadas por Expo (versiones correctas)..."
npx expo install \
  expo-constants \
  expo-font \
  expo-clipboard \
  expo-haptics \
  expo-image \
  expo-image-picker \
  expo-linking \
  expo-location \
  expo-router \
  expo-splash-screen \
  expo-status-bar \
  expo-symbols \
  expo-system-ui \
  expo-web-browser \
  @expo-google-fonts/poppins \
  @expo/vector-icons \
  @react-native-async-storage/async-storage \
  @react-native-community/datetimepicker \
  react-native-gesture-handler \
  react-native-reanimated \
  react-native-screens \
  react-native-safe-area-context \
  react-native-maps

echo "Instalando librerías adicionales de navegación, backend y utilidades..."
npm install \
  @react-navigation/native \
  @react-navigation/native-stack \
  @react-navigation/bottom-tabs \
  @react-navigation/elements \
  firebase \
  axios \
  cloudinary \
  react-native-alert-notification \
  react-native-keyboard-aware-scroll-view

echo "Instalando EAS CLI de forma global (opcional, solo si vas a usar EAS Build)..."
npm install -g eas-cli

echo "✅ Listo. Todas las dependencias deberían estar instaladas y sincronizadas."

