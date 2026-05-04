import { Router } from 'express';
import { testNotification } from '../controllers/notificationController';

const router = Router();

router.post('/test', testNotification);

export default router;
