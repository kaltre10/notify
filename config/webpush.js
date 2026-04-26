import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

export const configureWebPush = () => {
    const email = process.env.EMAIL || 'mailto:admin@girorides.com';
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (publicKey && privateKey) {
        try {
            webpush.setVapidDetails(
                email,
                publicKey,
                privateKey
            );
            console.log("✅ Web Push configurado correctamente.");
        } catch (error) {
            console.error("❌ Error configurando Web Push (revisa tus claves VAPID):", error.message);
        }
    } else {
        console.warn("⚠️ Advertencia: VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY no están definidos. Las notificaciones Web Push están deshabilitadas. Agrega las claves en tu archivo .env para habilitarlas.");
    }
};

export { webpush };