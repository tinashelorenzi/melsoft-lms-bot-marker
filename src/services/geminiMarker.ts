import { GoogleGenAI } from "@google/genai";
import { Question, MarkingResult } from '../types/marker';

// Initialize Gemini
const genAI = new GoogleGenAI({ 
  apiKey: '[REDACTED]' 
});

if (!process.env.GEMINI_API_KEY) {
  console.error('Warning: GEMINI_API_KEY is not set in environment variables');
}

export class GeminiMarker {
  private static extractJsonFromText(text: string): any {
    // Try to find JSON content between code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // If no code blocks, try parsing the text directly
    try {
      return JSON.parse(text);
    } catch {
      // If that fails, try to find the first { and last }
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return JSON.parse(text.slice(start, end + 1));
      }
      throw new Error('No valid JSON found in response');
    }
  }

  private static async evaluateAnswer(
    question: Question,
    studentAnswer: string
  ): Promise<MarkingResult> {
    try {
      const prompt = `You are an expert marker for academic assignments. Please evaluate the following student answer against the model answer.

Question: ${question.text}
Maximum Marks: ${question.marks}
Model Answer: ${question.answer}
Student Answer: ${studentAnswer}

Please evaluate the answer based on:
1. Correctness of the solution
2. Completeness of the explanation
3. Use of proper terminology and concepts
4. Clarity of reasoning

Return ONLY a JSON object in this format:
{
  "score": <number between 0 and ${question.marks}>,
  "feedback": "<detailed feedback explaining the score and areas for improvement>"
}`;

      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });
      
      const text = response.text || '';
      
      try {
        const evaluation = this.extractJsonFromText(text);
        return {
          questionId: question.id,
          score: Math.min(Math.max(0, evaluation.score), question.marks),
          maxMarks: question.marks,
          feedback: evaluation.feedback || 'No feedback provided',
        };
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        console.error('Raw response:', text);
        throw new Error('Invalid response format from Gemini');
      }
    } catch (error) {
      console.error('Error evaluating with Gemini:', error);
      return {
        questionId: question.id,
        score: 0,
        maxMarks: question.marks,
        feedback: 'Error occurred while evaluating the answer. Please try again.',
      };
    }
  }

  public static async markSubmission(questions: Question[], answers: { questionId: string; answer: string }[]) {
    const results = await Promise.all(
      answers.map(async (answer) => {
        const question = questions.find((q) => q.id === answer.questionId);
        if (!question) {
          return {
            questionId: answer.questionId,
            score: 0,
            maxMarks: 0,
            feedback: 'Question not found',
          };
        }
        return this.evaluateAnswer(question, answer.answer);
      })
    );

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const maxScore = results.reduce((sum, r) => sum + r.maxMarks, 0);
    const overallFeedback = await this.generateOverallFeedback(totalScore, maxScore, results);

    return {
      results,
      totalScore,
      maxScore,
      feedback: overallFeedback || `Overall score: ${totalScore}/${maxScore}`,
    };
  }

  private static async generateOverallFeedback(totalScore: number, maxScore: number, results: MarkingResult[]): Promise<string> {
    try {
      const prompt = `As an academic evaluator, please provide a brief overall feedback for a student who scored ${totalScore} out of ${maxScore}.
      
Individual question performances:
${results.map(r => `- Question ${r.questionId}: ${r.score}/${r.maxMarks}`).join('\n')}

Provide a concise, encouraging summary that highlights strengths and areas for improvement. Response should be 2-3 sentences only.`;

      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });

      return response.text || `Overall score: ${totalScore}/${maxScore}. Keep practicing to improve your understanding.`;
    } catch (error) {
      console.error('Error generating overall feedback:', error);
      return `Overall score: ${totalScore}/${maxScore}. Keep practicing to improve your understanding.`;
    }
  }
} 