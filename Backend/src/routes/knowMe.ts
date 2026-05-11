import { Router, Request, Response, NextFunction } from 'express';
import { createRoomCode } from '../services/roomCode';
import { createRoom, getRoom, saveAnswers, getAnswers } from '../services/repository';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomCode = await createRoomCode();
    const now = Math.floor(Date.now() / 1000);
    const { questions, answers } = req.body;
    await createRoom({
      roomCode,
      type: 'know-me',
      status: 'waiting',
      questions,
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60,
    });
    await saveAnswers({
      roomCode,
      participantId: 'owner',
      answers,
      submittedAt: now,
    });
    res.status(201).json({ roomCode });
  } catch (err) {
    next(err);
  }
});

router.post('/:code/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await getRoom(req.params.code);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const allAnswers = await getAnswers(req.params.code);
    if (allAnswers.length >= 11) {
      return res.status(400).json({ error: 'Room is full' });
    }

    const participantId = `participant_${Date.now()}`;
    res.json({ participantId });
  } catch (err) {
    next(err);
  }
});

router.post('/:code/answers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await getRoom(req.params.code);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const ownerAnswers = await getAnswers(req.params.code);
    const owner = ownerAnswers.find((a: any) => a.participantId === 'owner');
    if (!owner) return res.status(400).json({ error: 'Owner answers not found' });

    const { participantId, name, answers } = req.body;
    const ownerAns = owner.answers as Record<string, string>;
    const participantAns = answers as Record<string, string>;

    let correct = 0;
    const total = Object.keys(ownerAns).length;
    for (const key of Object.keys(ownerAns)) {
      if (ownerAns[key] === participantAns[key]) correct++;
    }
    const score = Math.round((correct / total) * 100);

    await saveAnswers({
      roomCode: req.params.code,
      participantId,
      name,
      answers,
      score,
      submittedAt: Math.floor(Date.now() / 1000),
    });

    res.json({ score });
  } catch (err) {
    next(err);
  }
});

router.get('/:code/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allAnswers = await getAnswers(req.params.code);
    const leaderboard = allAnswers
      .filter((a: any) => a.participantId !== 'owner')
      .sort((a: any, b: any) => b.score - a.score)
      .map((a: any) => ({ name: a.name, score: a.score }));
    res.json(leaderboard);
  } catch (err) {
    next(err);
  }
});

export default router;
