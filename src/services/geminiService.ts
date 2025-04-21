import { GoogleGenAI } from "@google/genai";
import { Question } from "../types";
import { MarkingResult } from "../types/marker";

const genAI = new GoogleGenAI({ apiKey: '[REDACTED]' });

export async function markAnswer(question: Question, studentAnswer: string): Promise<MarkingResult> {
  const prompt = `
You are an educational assignment marker. Mark the following student answer based on the question and model answer provided.

Question: ${question.text}
Model Answer: ${question.answer}
Maximum Marks: ${question.marks}
Student Answer: ${studentAnswer}

Provide your response in the following JSON format only:
{
  "score": number (the marks awarded out of maximum marks),
  "feedback": string (constructive feedback explaining the marking)
}
`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });

    const text = response.text || '';
    const markerResponse = JSON.parse(text);

    return {
      questionId: question.id,
      score: Math.min(Math.max(0, markerResponse.score), question.marks), // Ensure score is within bounds
      feedback: markerResponse.feedback || 'No feedback provided',
      maxMarks: question.marks
    };
  } catch (error) {
    console.error("Error marking answer with Gemini:", error);
    return {
      questionId: question.id,
      score: 0,
      feedback: "Failed to mark answer. Please try again.",
      maxMarks: question.marks
    };
  }
} 