import { Router } from 'express';
import { getCards, getCard, createCard, updateCard, deleteCard, toggleCard, fetchCard, getCardHistory } from '../controllers/cardController';
import { testCardNotification } from '../controllers/notificationController';

const router = Router();

router.get('/', getCards);
router.get('/:id', getCard);
router.post('/', createCard);
router.put('/:id', updateCard);
router.delete('/:id', deleteCard);
router.patch('/:id/toggle', toggleCard);
router.post('/:id/fetch', fetchCard);
router.get('/:id/history', getCardHistory);
router.post('/:id/test-notification', testCardNotification);

export default router;
