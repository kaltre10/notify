import { webpush } from '../config/webpush.js';
import { subscriptionStore } from '../storage/subscriptionStore.js';

const payload = (
    title = "Giro Rides",
    message = "Tienes un mensaje.",
    url = "https://girorides.com") =>
    JSON.stringify({ title, message, url });

export const sendBroadcast = async (title, message) => {

    const subs = await subscriptionStore.getAll(); // Esperamos a Firebase

    const promises = subs.map(async (sub) => {
        try {
            const url = null
            await webpush.sendNotification(sub, payload(title, message, url));
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
            const url = "https://girorides.com/drivers"
            await webpush.sendNotification(sub, payload(title, message, url));
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
            const url = "https://girorides.com/dashboard"
            await webpush.sendNotification(sub, payload(title, message, url));
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