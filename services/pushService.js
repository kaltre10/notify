import { webpush } from '../config/webpush.js';
import { subscriptionStore } from '../storage/subscriptionStore.js';

const payload = (title, message) => JSON.stringify({
    title: title || "Giro Rides",
    message: message || "Tienes un mensaje."
});

export const sendBroadcast = async (title, message) => {

    const subs = await subscriptionStore.getAll(); // Esperamos a Firebase

    const promises = subs.map(async (sub) => {
        try {
            await webpush.sendNotification(sub, payload(title, message));
        } catch (err) {
            if (err.statusCode === 410 || err.statusCode === 404) {
                console.log("Suscripción expirada, eliminando de Firebase...");
                await subscriptionStore.removeByEndpoint(sub.endpoint);
            }
        }
    });

    await Promise.all(promises);
    return await subscriptionStore.getCount();
};

export const sendBroadcastDrivers = async (title, message, vehicleType) => {
    

    const subs = await subscriptionStore.getDrivers(vehicleType); // Esperamos a Firebase

    const promises = subs.map(async (sub) => {
        try {
            await webpush.sendNotification(sub, payload(title, message));
        } catch (err) {
            if (err.statusCode === 410 || err.statusCode === 404) {
                console.log("Suscripción expirada, eliminando de Firebase...");
                await subscriptionStore.removeByEndpoint(sub.endpoint);
            }
        }
    });

    await Promise.all(promises);
    return await subscriptionStore.getCount();
};

export const sendBroadcastUser = async (title, message, userId) => {
    
    const subs = await subscriptionStore.getByUserId(userId); // Esperamos a Firebase
    const promises = subs.map(async (sub) => {
        try {
            await webpush.sendNotification(sub, payload(title, message));   
        } catch (err) {
            if (err.statusCode === 410 || err.statusCode === 404) {
                console.log("Suscripción expirada, eliminando de Firebase...");
                await subscriptionStore.removeByEndpoint(sub.endpoint);
            }
        }
    });

    await Promise.all(promises);
    return await subscriptionStore.getCount();
}