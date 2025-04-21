# Melsoft LMS Bot Marker API

A powerful API service for automated assignment marking and evaluation using Google's Gemini AI. This service provides endpoints for managing assignments, questions, and automated marking of student submissions.

## Table of Contents
- [Features](#features)
- [Setup](#setup)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Assignments](#assignments)
  - [Questions](#questions)
  - [Marking](#marking)
  - [Operator Management](#operator-management)
- [Response Formats](#response-formats)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Features

- Automated assignment marking using Gemini AI
- Support for multiple question types (multiple choice, short answer, long answer)
- Detailed feedback generation for each answer
- Operator interface for managing assignments and questions
- API token-based authentication
- Whitelist-based access control

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   # Create a .env file with the following variables
   GEMINI_API_KEY=your_gemini_api_key
   JWT_SECRET=your_jwt_secret
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Authentication

All API endpoints require authentication using an API token. Tokens are managed through the operator interface and must be whitelisted for access.

### Getting an API Token

1. Log in to the operator interface
2. Navigate to the API Tokens section
3. Generate a new token
4. Add the token to the whitelist

### Using the API Token

Include the token in the `Authorization` header of your requests:
```
Authorization: Bearer your_api_token
```

## API Endpoints

### Assignments

#### Create Assignment
```
POST /api/assignments

Request Body:
{
  "title": "string",
  "description": "string",
  "subject": "string",
  "totalMarks": number,
  "questions": [
    {
      "text": "string",
      "marks": number,
      "answer": "string",
      "type": "multiple_choice" | "short_answer" | "long_answer"
    }
  ]
}

Response:
{
  "id": "string",
  "title": "string",
  "description": "string",
  "subject": "string",
  "totalMarks": number,
  "questions": Question[]
}
```

#### Get Assignment
```
GET /api/assignments/:id

Response:
{
  "id": "string",
  "title": "string",
  "description": "string",
  "subject": "string",
  "totalMarks": number,
  "questions": Question[]
}
```

#### List Assignments
```
GET /api/assignments

Query Parameters:
- subject: string (optional)
- page: number (default: 1)
- limit: number (default: 10)

Response:
{
  "assignments": Assignment[],
  "total": number,
  "page": number,
  "totalPages": number
}
```

### Questions

#### Add Question to Assignment
```
POST /api/assignments/:assignmentId/questions

Request Body:
{
  "text": "string",
  "marks": number,
  "answer": "string",
  "type": "multiple_choice" | "short_answer" | "long_answer"
}

Response:
{
  "id": "string",
  "text": "string",
  "marks": number,
  "answer": "string",
  "type": string
}
```

#### Update Question
```
PUT /api/assignments/:assignmentId/questions/:questionId

Request Body:
{
  "text": "string",
  "marks": number,
  "answer": "string",
  "type": "multiple_choice" | "short_answer" | "long_answer"
}

Response:
{
  "id": "string",
  "text": "string",
  "marks": number,
  "answer": "string",
  "type": string
}
```

#### Delete Question
```
DELETE /api/assignments/:assignmentId/questions/:questionId

Response:
{
  "success": true
}
```

### Marking

#### Mark Submission
```
POST /api/marker/mark

Request Body:
{
  "assignmentId": "string",
  "answers": [
    {
      "questionId": "string",
      "answer": "string"
    }
  ]
}

Response:
{
  "results": [
    {
      "questionId": "string",
      "score": number,
      "maxMarks": number,
      "feedback": "string"
    }
  ],
  "totalScore": number,
  "maxScore": number,
  "feedback": "string"
}
```

### Operator Management

#### Generate API Token
```
POST /api/operator/tokens

Request Body:
{
  "name": "string",
  "role": "string"
}

Response:
{
  "token": "string",
  "name": "string",
  "role": "string",
  "createdAt": "string"
}
```

#### Whitelist Token
```
POST /api/operator/whitelist

Request Body:
{
  "token": "string"
}

Response:
{
  "success": true
}
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

## Error Handling

The API uses standard HTTP status codes:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

Common error codes:
- `INVALID_TOKEN`: The provided API token is invalid
- `TOKEN_NOT_WHITELISTED`: The token is not in the whitelist
- `INVALID_REQUEST`: The request body is invalid
- `NOT_FOUND`: The requested resource was not found

## Rate Limiting

API requests are limited to:
- 100 requests per minute per API token
- 1000 requests per hour per API token

## Examples

### Marking a Submission

```javascript
// Example using fetch
const markSubmission = async (assignmentId, answers) => {
  const response = await fetch('https://your-api-url/api/marker/mark', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your_api_token'
    },
    body: JSON.stringify({
      assignmentId,
      answers
    })
  });
  
  return await response.json();
};

// Example usage
const result = await markSubmission('assignment-123', [
  {
    questionId: 'question-1',
    answer: 'The answer is 42'
  }
]);
```

### Creating an Assignment

```javascript
// Example using axios
const createAssignment = async (assignment) => {
  const response = await axios.post('https://your-api-url/api/assignments', assignment, {
    headers: {
      'Authorization': 'Bearer your_api_token'
    }
  });
  
  return response.data;
};

// Example usage
const assignment = {
  title: 'Math Test',
  description: 'Basic mathematics test',
  subject: 'Mathematics',
  totalMarks: 100,
  questions: [
    {
      text: 'What is 2 + 2?',
      marks: 10,
      answer: '4',
      type: 'short_answer'
    }
  ]
};

const result = await createAssignment(assignment);
```

## Support

For support, please contact the development team or raise an issue in the repository.