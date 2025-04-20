export interface Assignment {
  id: string;
  name: string;
  subject: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  text: string;
  answer: string;
  marks?: number;
}

export interface Operator {
  email: string;
  password: string;
}

export interface CreateAssignmentDto {
  name: string;
  subject: string;
  questions: Question[];
}

export interface UpdateAssignmentDto {
  questions?: Question[];
  name?: string;
  subject?: string;
} 