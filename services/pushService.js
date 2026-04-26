import { webpush } from '../config/webpush.js';
import { subscriptionStore } from '../storage/subscriptionStore.js';
import { Expo } from 'expo-server-sdk';
import { firestore } from '../config/firebase.js';
import admin from 'firebase-admin';

const expo = new Expo();

const webPayload = (title = 'Giro Rides', message = 'Tienes un mensaje.', url = null) =>
  JSON.stringify({ title, message, url });

const sendExpoToTokens = async (tokens, title, message, url) => {
  const messages = tokens
    .filter(t => Expo.isExpoPushToken(t))
    .map(t => ({
      to: t,
      sound: 'uber.wav', // Llama al sonido personalizado
      title,
      body: message,
      data: url ? { url } : {},
      channelId: 'giro-sound', // Importante para Android
    }));

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  for (const chunk of chunks) {
    const res = await expo.sendPushNotificationsAsync(chunk);
    tickets.push(...res);
  }
  return tickets;
};

export const sendBroadcast = async (title, message) => {
  const subs = await subscriptionStore.getAll();
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(sub, webPayload(title, message, null));
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await subscriptionStore.removeByEndpoint(sub.endpoint);
      }
    }
  }));

  let expoTokens = [];
  if (firestore) {
    try {
      const usersSnap = await firestore.collection('users').get();
      usersSnap.forEach(d => {
        const t = d.data()?.expoPushToken;
        if (t) expoTokens.push(t);
      });
    } catch (e) {
      console.error("Error reading Firestore tokens for Broadcast:", e);
    }
  }

  // Also check Realtime DB subscriptions for expoPushTokens as fallback
  const rtdbSubs = await subscriptionStore.getAll();
  rtdbSubs.forEach(sub => {
    if (sub.expoPushToken && !expoTokens.includes(sub.expoPushToken)) {
      expoTokens.push(sub.expoPushToken);
    }
  });

  const tickets = await sendExpoToTokens(expoTokens, title, message, 'https://girorides.com');

  return { webSentTo: subs.length, mobileSentTo: expoTokens.length, tickets };
};

export const sendBroadcastDrivers = async (title, message, vehicleType, serviceType) => {
  const subs = await subscriptionStore.getDrivers(vehicleType);
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(sub, webPayload(title, message, 'https://girorides.com/drivers'));
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await subscriptionStore.removeByEndpoint(sub.endpoint);
      }
    }
  }));

  let expoTokens = [];
  if (firestore) {
    try {
      // Fetch matching vehicles instead of just users to check permissions
      let vehiclesQuery = firestore.collection('vehicles');
      if (vehicleType) {
        vehiclesQuery = vehiclesQuery.where('type', '==', vehicleType);
      }
      const vehiclesSnap = await vehiclesQuery.get();
      
      const validDriverIds = [];
      vehiclesSnap.forEach(doc => {
        const vehicleData = doc.data();
        if (serviceType === 'delivery') {
          if (vehicleData.acceptsDelivery === true) {
            validDriverIds.push(doc.id);
          }
        } else {
          // Normal taxi trip
          if (vehicleData.acceptsTaxi !== false) {
            validDriverIds.push(doc.id);
          }
        }
      });

      if (validDriverIds.length > 0) {
        // Fetch user documents for these valid drivers to get their push tokens
        // Note: Firestore 'in' query supports up to 10 items. For production with many drivers,
        // you might need to batch these or fetch tokens differently.
        const batchSize = 10;
        for (let i = 0; i < validDriverIds.length; i += batchSize) {
          const batchIds = validDriverIds.slice(i, i + batchSize);
          const usersSnap = await firestore.collection('users')
            .where('hasVehicle', '==', true)
            .where(admin.firestore.FieldPath.documentId(), 'in', batchIds)
            .get();
            
          usersSnap.forEach(d => {
            const t = d.data()?.expoPushToken;
            if (t) expoTokens.push(t);
          });
        }
      }
    } catch (e) {
      console.error("Error reading Firestore drivers for notification:", e);
    }
  }

  // Check RTDB for Expo Tokens of Drivers
  const rtdbDrivers = await subscriptionStore.getDrivers(vehicleType);
  rtdbDrivers.forEach(sub => {
    if (sub.expoPushToken && !expoTokens.includes(sub.expoPushToken)) {
      expoTokens.push(sub.expoPushToken);
    }
  });

  const tickets = await sendExpoToTokens(expoTokens, title, message, 'https://girorides.com/drivers');

  return { webSentTo: subs.length, mobileSentTo: expoTokens.length, tickets };
};

export const sendBroadcastUser = async (title, message, userId) => {
  const subs = await subscriptionStore.getByUserId(userId);
  await Promise.all(subs.map(async (sub) => {
    try {
      if (sub.endpoint && !sub.endpoint.includes('ExponentPushToken')) {
        await webpush.sendNotification(sub, webPayload(title, message, 'https://girorides.com/dashboard'));
      }
    } catch (err) {
      console.error(`[sendBroadcastUser] Web Push error:`, err);
      if (err.statusCode === 410 || err.statusCode === 404) {
        await subscriptionStore.removeByEndpoint(sub.endpoint);
      }
    }
  }));

  let token = null;
  if (firestore) {
    try {
      const userDoc = await firestore.collection('users').doc(userId).get();
      token = userDoc.exists ? (userDoc.data()?.expoPushToken ?? null) : null;
    } catch (e) {
      console.error("[sendBroadcastUser] Error reading Firestore user:", e);
    }
  } else {
    console.log(`[sendBroadcastUser] Firestore not initialized, skipping Firestore lookup.`);
  }

  // Fallback to RTDB
  if (!token) {
    const userSubs = await subscriptionStore.getByUserId(userId);
    const subWithExpo = userSubs.find(s => s.expoPushToken || (s.endpoint && s.endpoint.includes('ExponentPushToken')));
    if (subWithExpo) {
      token = subWithExpo.expoPushToken || subWithExpo.endpoint;
    } else {
      console.log(`[sendBroadcastUser] No Expo token found in RTDB fallback either.`);
    }
  }

  let tickets = [];
  if (token) {
    tickets = await sendExpoToTokens([token], title, message, 'https://girorides.com/dashboard');
  } else {
    console.log(`[sendBroadcastUser] Cannot send Mobile Push: No Expo token found for user ${userId}`);
  }

  return { webSentTo: subs.length, mobileSentTo: token ? 1 : 0, tickets };
};

export const sendBroadcastAdmin = async (title, message) => {
  const subs = await subscriptionStore.getAdmins();
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(sub, webPayload(title, message, 'https://girorides.com/admin'));
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await subscriptionStore.removeByEndpoint(sub.endpoint);
      }
    }
  }));

    let expoTokens = [];
  if (firestore) {
    try {
      const adminsSnap = await firestore.collection('users').where('isAdmin', '==', true).get();
      adminsSnap.forEach(d => {
        const t = d.data()?.expoPushToken;
        if (t) expoTokens.push(t);
      });
    } catch (e) {
      console.error("Error reading Firestore admins:", e);
    }
  }

  // Check RTDB for Expo Tokens of Admins
  const rtdbAdmins = await subscriptionStore.getAdmins();
  rtdbAdmins.forEach(sub => {
    if (sub.expoPushToken && !expoTokens.includes(sub.expoPushToken)) {
      expoTokens.push(sub.expoPushToken);
    }
  });

  const tickets = await sendExpoToTokens(expoTokens, title, message, 'https://girorides.com/admin');

  return { webSentTo: subs.length, mobileSentTo: expoTokens.length, tickets };
};