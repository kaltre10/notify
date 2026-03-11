import { Router } from 'express';
import * as pushController from '../controllers/pushController.js';

const router = Router();

// Definición de endpoints
router.get('/public-key', pushController.getPublicKey);
router.get('/subscriptions', pushController.getSubscriptions);
router.post('/subscribe', pushController.subscribe);
router.post('/send-all', pushController.notifyAll);
router.post('/send-drivers', pushController.notifyDrivers);
router.post('/send-user', pushController.notifyUser);

export default router;