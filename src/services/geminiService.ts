import { GoogleGenerativeAI } from "@google/generative-ai";
import { Question } from "../types";
import { MarkingResult } from "../types/marker";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function markAnswer(question: Question, studentAnswer: string): Promise<MarkingResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const markerResponse = JSON.parse(text);

    return {
      questionId: question.id,
      score: markerResponse.score,
      feedback: markerResponse.feedback,
      maxMarks: question.marks
    };
  } catch (error) {
    console.error("Error marking answer with Gemini:", error);
    throw new Error("Failed to mark answer");
  }
} 