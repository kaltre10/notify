import { db } from '../config/firebase.js';

// Usamos una función para obtener la referencia a la base de datos de manera dinámica
// Esto evita que crashee si db es null (por ejemplo si las credenciales fallan)
const getSubsRef = () => {
    if (!db) throw new Error("Firebase DB no está inicializada. Revisa tus credenciales.");
    return db.ref('push_subscriptions');
};

export const subscriptionStore = {
    // Obtener todas las suscripciones de Firebase
    getAll: async () => {
        const snapshot = await getSubsRef().once('value');
        const data = snapshot.val();
        return data ? Object.values(data) : [];
    },

    // Obtener todas las suscripciones de conductores de Firebase
    getDrivers: async (vehicleType) => {
        // Consultamos filtrando por la propiedad anidada user/isDriver
        const snapshot = await getSubsRef()
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
        await getSubsRef().child(safeId).set(sub);
        return true;
    },

    // Eliminar suscripción (cuando el token expira)
    removeByEndpoint: async (endpoint) => {
        const safeId = Buffer.from(endpoint).toString('base64').replace(/[/+=]/g, '');
        await getSubsRef().child(safeId).remove();
    },

    getCount: async () => {
        const snapshot = await getSubsRef().once('value');
        return snapshot.numChildren();
    },

    // Obtener suscripciones por userId
    getByUserId: async (userId) => {
        const snapshot = await getSubsRef()
            .orderByChild('user/id')
            .equalTo(userId)
            .once('value');
        const data = snapshot.val();

        return data ? Object.values(data) : [];
    },
    getAdmins: async () => {
        const snapshot = await getSubsRef()
            .orderByChild('users/role')
            .equalTo("admin")
            .once('value');
        const data = snapshot.val();
        return data ? Object.values(data) : [];
    }
};