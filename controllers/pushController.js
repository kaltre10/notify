import { subscriptionStore } from '../storage/subscriptionStore.js';
import { sendBroadcast, sendBroadcastDrivers, sendBroadcastUser, sendBroadcastAdmin } from '../services/pushService.js';

export const getPublicKey = (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

export const subscribe = async (req, res) => {
    const { subscription, user } = req.body;
    if (!subscription?.endpoint) return res.status(400).send("Inválido");

    const _subscription = {
        ...subscription,
        user,
    }
    try {
        await subscriptionStore.add(_subscription);
        const count = await subscriptionStore.getCount();
        res.status(201).json({ message: "Guardado en Firebase", total: count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const notifyAll = async (req, res) => {
    try {
        const { title, message } = req.body;
        const sentTo = await sendBroadcast(title, message);
        res.json({ success: true, sentTo });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const notifyDrivers = async (req, res) => {
    try {
        const { title, message, vehicleType, serviceType } = req.body;
        const sentTo = await sendBroadcastDrivers(title, message, vehicleType, serviceType);
        res.json({ success: true, sentTo });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSubscriptions = async (req, res) => {

    const subs = await subscriptionStore.getAll();

    res.json({ total: subs.length, subscriptions: subs });
};

export const notifyUser = async (req, res) => {
    try {
        const { title, message, userId } = req.body;
        const sentTo = await sendBroadcastUser(title, message, userId);
        res.json({ success: true, sentTo });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const notifyAdmin = async (req, res) => {
    try {
        const { title, message } = req.body;
        const sentTo = await sendBroadcastAdmin(title, message);
        res.json({ success: true, sentTo });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};