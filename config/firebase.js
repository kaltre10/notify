import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Puedes pasar la ruta al archivo JSON o usar variables de entorno
let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    // Vercel a veces escapa los saltos de línea (\n) y los convierte en \\n literales, esto lo corrige:
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } else {
    console.error("Falta la variable de entorno FIREBASE_SERVICE_ACCOUNT en Vercel");
  }
} catch (error) {
  console.error("Error al leer FIREBASE_SERVICE_ACCOUNT. Asegúrate de que sea un JSON válido en una sola línea.", error);
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL // Ej: https://tu-app.firebaseio.com
  });
}

export const db = admin.apps.length ? admin.database() : null;