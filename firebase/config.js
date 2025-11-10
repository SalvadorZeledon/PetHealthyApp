import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyARaITftNBjJpbjPNU_erDOHbHWoB44_Eg',
  authDomain: 'pethealtyapp.firebaseapp.com',
  projectId: 'pethealtyapp',
  storageBucket: 'pethealtyapp.firebasestorage.app',
  messagingSenderId: '293213559813',
  appId: '1:293213559813:web:c9709a168cd350a87ed06c',
};

export const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
