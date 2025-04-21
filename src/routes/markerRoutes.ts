import express from 'express';
import { validateApiToken } from '../middleware/authMiddleware';
import { Submission, Question, MarkedSubmission } from '../types/marker';
import { GeminiMarker } from '../services/geminiMarker';

const router = express.Router();

// Mark submission endpoint
router.post('/mark', validateApiToken(), async (req, res) => {
  try {
    const { submission, questions }: { submission: Submission; questions: Question[] } = req.body;

    if (!submission || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'Invalid request format' });
    }

    // Use GeminiMarker to evaluate the submission
    const markingResult = await GeminiMarker.markSubmission(questions, submission.answers);

    const markedSubmission: MarkedSubmission = {
      submissionId: submission.id,
      results: markingResult.results,
      totalScore: markingResult.totalScore,
      maxScore: markingResult.maxScore,
      feedback: markingResult.feedback,
      markedAt: new Date().toISOString(),
    };

    res.json(markedSubmission);
  } catch (error) {
    console.error('Error marking submission:', error);
    res.status(500).json({ message: 'Error marking submission' });
  }
});

export default router; 