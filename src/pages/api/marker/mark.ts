import { NextApiRequest, NextApiResponse } from 'next';
import { Question } from '../../../types';
import { MarkSubmissionRequest, MarkedSubmission } from '../../../types/marker';
import { markAnswer } from '../../../services/geminiService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MarkedSubmission | { error: string }>
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { submission, questions } = req.body as MarkSubmissionRequest;

    // Mark each answer and collect results
    const markingResults = await Promise.all(
      submission.answers.map(async (answer) => {
        const question = questions.find(q => q.id === answer.questionId);
        if (!question) {
          throw new Error(`Question not found for ID: ${answer.questionId}`);
        }

        return await markAnswer(question, answer.answer);
      })
    );

    // Calculate total and max scores
    const totalScore = markingResults.reduce((sum, result) => sum + result.score, 0);
    const maxScore = markingResults.reduce((sum, result) => sum + result.maxMarks, 0);

    const markedSubmission: MarkedSubmission = {
      submissionId: submission.id,
      studentId: submission.studentId,
      assignmentName: submission.assignmentName,
      subject: submission.subject,
      results: markingResults,
      totalScore,
      maxScore,
      markedAt: new Date().toISOString()
    };

    return res.status(200).json(markedSubmission);
  } catch (error) {
    console.error('Error marking submission:', error);
    return res.status(500).json({ error: 'Failed to mark submission' });
  }
}