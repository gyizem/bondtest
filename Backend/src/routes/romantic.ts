import { Router, Request, Response, NextFunction } from 'express';
import { createRoomCode } from '../services/roomCode';
import { createRoom, getRoom, saveAnswers, getAnswers } from '../services/repository';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomCode = await createRoomCode();
    const now = Math.floor(Date.now() / 1000);
    await createRoom({
      roomCode,
      type: 'romantic',
      status: 'waiting',
      questions: [],
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60,
    });
    res.status(201).json({ roomCode });
  } catch (err) {
    next(err);
  }
});

router.get('/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await getRoom(req.params.code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    next(err);
  }
});

router.post('/:code/answers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await getRoom(req.params.code);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const { partner, answers } = req.body;
    await saveAnswers({
      roomCode: req.params.code,
      participantId: partner,
      answers,
      submittedAt: Math.floor(Date.now() / 1000),
    });

    const allAnswers = await getAnswers(req.params.code);
    if (allAnswers.length === 2) {
      res.json({ status: 'complete' });
    } else {
      res.json({ status: 'waiting' });
    }
  } catch (err) {
    next(err);
  }
});

router.get('/:code/result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allAnswers = await getAnswers(req.params.code);
    if (allAnswers.length < 2) return res.json({ status: 'pending' });
    res.json({ status: 'complete', answers: allAnswers });
  } catch (err) {
    next(err);
  }
});

export default router;
