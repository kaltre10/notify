import { db } from '../config/firebase.js';

const subsRef = db.ref('push_subscriptions');

export const subscriptionStore = {
    // Obtener todas las suscripciones de Firebase
    getAll: async () => {
        const snapshot = await subsRef.once('value');
        const data = snapshot.val();
        return data ? Object.values(data) : [];
    },

     // Obtener todas las suscripciones de conductores de Firebase
    getDrivers: async (vehicleType) => {
        // Consultamos filtrando por la propiedad anidada user/isDriver
        const snapshot = await subsRef
            .orderByChild('user/isDriver')
            .equalTo(true)
            .once('value');
            
        // Filtramos por vehicleType si se proporciona
        if (vehicleType) {
            const data = snapshot.val();
            // Convertimos el objeto de Firebase en un Array
            const drivers = data ? Object.values(data) : [];
            // Filtramos por vehicleType
            return drivers.filter(driver => driver.user.vehicleType === vehicleType);
        }
            
        const data = snapshot.val();
        // Convertimos el objeto de Firebase en un Array
        return data ? Object.values(data) : [];
    },

    // Guardar una nueva (usamos el endpoint como ID único para evitar duplicados)
    add: async (sub) => {
        // Limpiamos el endpoint de caracteres no permitidos por Firebase como "." o "$"
        const safeId = Buffer.from(sub.endpoint).toString('base64').replace(/[/+=]/g, '');
        await subsRef.child(safeId).set(sub);
        return true;
    },

    // Eliminar suscripción (cuando el token expira)
    removeByEndpoint: async (endpoint) => {
        const safeId = Buffer.from(endpoint).toString('base64').replace(/[/+=]/g, '');
        await subsRef.child(safeId).remove();
    },

    getCount: async () => {
        const snapshot = await subsRef.once('value');
        return snapshot.numChildren();
    },
    
    // Obtener suscripciones por userId
    getByUserId: async (userId) => {
        const snapshot = await subsRef
            .orderByChild('user/id')
            .equalTo(userId)
            .once('value');
        const data = snapshot.val();
        return data ? Object.values(data) : [];
    }
};