import { webpush } from '../config/webpush.js';
import { subscriptionStore } from '../storage/subscriptionStore.js';
import { Expo } from 'expo-server-sdk';
import admin from 'firebase-admin';

const expo = new Expo();

const webPayload = (title = 'Giro Rides', message = 'Tienes un mensaje.', url = null) =>
  JSON.stringify({ title, message, url });

const sendExpoToTokens = async (tokens, title, message, url) => {
  const messages = tokens
    .filter(t => Expo.isExpoPushToken(t))
    .map(t => ({
      to: t,
      sound: 'default',
      title,
      body: message,
      data: url ? { url } : {},
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

  const usersSnap = await admin.firestore().collection('users').get();
  const tokens = [];
  usersSnap.forEach(d => {
    const t = d.data()?.expoPushToken;
    if (t) tokens.push(t);
  });
  const tickets = await sendExpoToTokens(tokens, title, message, 'https://girorides.com');

  return { webSentTo: subs.length, mobileSentTo: tokens.length, tickets };
};

export const sendBroadcastDrivers = async (title, message, vehicleType) => {
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

  let q = admin.firestore().collection('users').where('hasVehicle', '==', true);
  if (vehicleType) q = q.where('vehicleType', '==', vehicleType);
  const snap = await q.get();

  const tokens = [];
  snap.forEach(d => {
    const t = d.data()?.expoPushToken;
    if (t) tokens.push(t);
  });
  const tickets = await sendExpoToTokens(tokens, title, message, 'https://girorides.com/drivers');

  return { webSentTo: subs.length, mobileSentTo: tokens.length, tickets };
};

export const sendBroadcastUser = async (title, message, userId) => {
  const subs = await subscriptionStore.getByUserId(userId);
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(sub, webPayload(title, message, 'https://girorides.com/dashboard'));
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await subscriptionStore.removeByEndpoint(sub.endpoint);
      }
    }
  }));

  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const token = userDoc.exists ? (userDoc.data()?.expoPushToken ?? null) : null;
  const tickets = token ? await sendExpoToTokens([token], title, message, 'https://girorides.com/dashboard') : [];

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

    const adminsSnap = await admin.firestore().collection('users').where('isAdmin', '==', true).get();
  const tokens = [];
  adminsSnap.forEach(d => {
    const t = d.data()?.expoPushToken;
    if (t) tokens.push(t);
  });
  const tickets = await sendExpoToTokens(tokens, title, message, 'https://girorides.com/admin');

  return { webSentTo: subs.length, mobileSentTo: tokens.length, tickets };
};