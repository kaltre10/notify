import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Vamos a construir las credenciales usando variables individuales para evitar problemas de JSON
let serviceAccount;

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    // Vercel y dotenv a veces escapan los saltos de línea (\n) convirtiéndolos en literales "\\n".
    // Esto asegura que la clave privada tenga saltos de línea reales requeridos por OpenSSL.
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    };
    
    if (!serviceAccount.privateKey.includes('BEGIN PRIVATE KEY')) {
        console.error("El formato de FIREBASE_PRIVATE_KEY parece estar corrupto. Faltan los marcadores BEGIN PRIVATE KEY.");
    }
  } else {
    console.error("Faltan variables de entorno de Firebase. Asegúrate de configurar FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.");
  }
} catch (error) {
  console.error("Error al configurar las credenciales de Firebase:", error);
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL // Ej: https://tu-app.firebaseio.com
  });
}

export const db = admin.apps.length ? admin.database() : null;