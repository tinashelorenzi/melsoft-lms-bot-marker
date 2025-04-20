import { Question as BaseQuestion } from ".";

export interface Question extends BaseQuestion {
  marks: number;  // Make marks required for marking
}

export interface SubmissionAnswer {
  questionId: string;
  answer: string;
}

export interface Submission {
  id: string;
  assignmentName: string;
  subject: string;
  studentId: string;
  answers: SubmissionAnswer[];
  submittedAt: string;
}

export interface MarkingResult {
  questionId: string;
  score: number;
  feedback: string;
  maxMarks: number;
}

export interface MarkedSubmission {
  submissionId: string;
  studentId: string;
  assignmentName: string;
  subject: string;
  results: MarkingResult[];
  totalScore: number;
  maxScore: number;
  markedAt: string;
}

export interface MarkSubmissionRequest {
  submission: Submission;
  questions: Question[];
} 