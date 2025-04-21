import { Question as BaseQuestion } from ".";

export interface Question {
  id: string;
  text: string;
  answer: string;
  marks: number;
}

export interface Answer {
  questionId: string;
  answer: string;
}

export interface Submission {
  id: string;
  assignmentName: string;
  subject: string;
  studentId: string;
  answers: Answer[];
  submittedAt: string;
}

export interface MarkingResult {
  questionId: string;
  score: number;
  maxMarks: number;
  feedback: string;
}

export interface MarkedSubmission {
  submissionId: string;
  results: MarkingResult[];
  totalScore: number;
  maxScore: number;
  feedback: string;
  markedAt: string;
}

export interface MarkSubmissionRequest {
  submission: Submission;
  questions: Question[];
} 