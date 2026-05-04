import type { Request, Response, NextFunction } from 'express';
import * as cardService from '../services/cardService';
import { startJob, stopJob, fetchCardNow } from '../services/schedulerService';
import { validateCreateCard, validateUpdateCard } from '../utils/validation';
import { getPriceHistory } from '../services/priceHistoryService';

export function getCards(_req: Request, res: Response, next: NextFunction): void {
  try {
    res.json(cardService.getAllCards());
  } catch (err) {
    next(err);
  }
}

export function getCard(req: Request, res: Response, next: NextFunction): void {
  try {
    res.json(cardService.getCardById(req.params['id']!));
  } catch (err) {
    next(err);
  }
}

export function createCard(req: Request, res: Response, next: NextFunction): void {
  try {
    const dto = validateCreateCard(req.body);
    const card = cardService.createCard(dto);
    res.status(201).json(card);
  } catch (err) {
    next(err);
  }
}

export function updateCard(req: Request, res: Response, next: NextFunction): void {
  try {
    const dto = validateUpdateCard(req.body);
    const card = cardService.updateCard(req.params['id']!, dto);
    // Restart the job so the new interval/config takes effect immediately
    if (card.enabled) {
      stopJob(card.id);
      startJob(card.id);
    }
    res.json(card);
  } catch (err) {
    next(err);
  }
}

export function deleteCard(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = req.params['id']!;
    stopJob(id);
    cardService.deleteCard(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export function toggleCard(req: Request, res: Response, next: NextFunction): void {
  try {
    const card = cardService.toggleCard(req.params['id']!);
    if (card.enabled) {
      startJob(card.id);
    } else {
      stopJob(card.id);
    }
    res.json(card);
  } catch (err) {
    next(err);
  }
}

export async function fetchCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await fetchCardNow(req.params['id']!);
    const card = cardService.getCardById(req.params['id']!);
    res.json(card);
  } catch (err) {
    next(err);
  }
}

export function getCardHistory(req: Request, res: Response, next: NextFunction): void {
  try {
    const limit = Math.min(Number(req.query['limit'] ?? 100), 500);
    const rows = getPriceHistory(req.params['id']!, limit);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}
