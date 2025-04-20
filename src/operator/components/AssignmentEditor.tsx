import React, { useState, useEffect } from "react";
import { Assignment, Question } from "../../types";

// API token for authentication
const API_TOKEN = "melsoft-lms-operator-token-2023";

interface AssignmentEditorProps {
  assignment: Assignment;
  onSave: (updatedAssignment: Assignment) => void;
  onCancel: () => void;
}

export const AssignmentEditor: React.FC<AssignmentEditorProps> = ({
  assignment,
  onSave,
  onCancel,
}) => {
  const [editedAssignment, setEditedAssignment] = useState<Assignment>({
    ...assignment,
  });
  const [newQuestion, setNewQuestion] = useState<Question>({
    id: "",
    text: "",
    answer: "",
    marks: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddQuestion = () => {
    if (!newQuestion.text || !newQuestion.answer) {
      setError("Question text and answer are required");
      return;
    }

    // Generate a unique ID if not provided
    const questionId = newQuestion.id || `q${Date.now()}`;

    const questionToAdd: Question = {
      ...newQuestion,
      id: questionId,
    };

    setEditedAssignment({
      ...editedAssignment,
      questions: [...editedAssignment.questions, questionToAdd],
    });

    // Reset the new question form
    setNewQuestion({
      id: "",
      text: "",
      answer: "",
      marks: 1,
    });
    setError("");
  };

  const handleUpdateQuestion = (index: number, updatedQuestion: Question) => {
    const updatedQuestions = [...editedAssignment.questions];
    updatedQuestions[index] = updatedQuestion;

    setEditedAssignment({
      ...editedAssignment,
      questions: updatedQuestions,
    });
  };

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = [...editedAssignment.questions];
    updatedQuestions.splice(index, 1);

    setEditedAssignment({
      ...editedAssignment,
      questions: updatedQuestions,
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError("");

    try {
      onSave(editedAssignment);
    } catch (error) {
      console.error("Error saving assignment:", error);
      setError("Failed to save assignment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Edit Assignment: {editedAssignment.name}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Subject: {editedAssignment.subject}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Add New Question
        </h4>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label
              htmlFor="questionText"
              className="block text-sm font-medium text-gray-700"
            >
              Question Text
            </label>
            <textarea
              id="questionText"
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={newQuestion.text}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, text: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="questionAnswer"
              className="block text-sm font-medium text-gray-700"
            >
              Answer
            </label>
            <textarea
              id="questionAnswer"
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={newQuestion.answer}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, answer: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="questionMarks"
              className="block text-sm font-medium text-gray-700"
            >
              Marks
            </label>
            <input
              type="number"
              id="questionMarks"
              min="1"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={newQuestion.marks}
              onChange={(e) =>
                setNewQuestion({
                  ...newQuestion,
                  marks: parseInt(e.target.value) || 1,
                })
              }
              disabled={isLoading}
            />
          </div>

          <div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={isLoading}
            >
              Add Question
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Questions ({editedAssignment.questions.length})
        </h4>

        {editedAssignment.questions.length === 0 ? (
          <p className="text-gray-500">No questions added yet.</p>
        ) : (
          <div className="space-y-4">
            {editedAssignment.questions.map((question, index) => (
              <div key={question.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <h5 className="text-sm font-medium text-gray-900">
                    Question {index + 1}
                  </h5>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(index)}
                    className="text-red-600 hover:text-red-900"
                    disabled={isLoading}
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Question Text
                  </label>
                  <textarea
                    rows={2}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={question.text}
                    onChange={(e) =>
                      handleUpdateQuestion(index, {
                        ...question,
                        text: e.target.value,
                      })
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Answer
                  </label>
                  <textarea
                    rows={2}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={question.answer}
                    onChange={(e) =>
                      handleUpdateQuestion(index, {
                        ...question,
                        answer: e.target.value,
                      })
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={question.marks}
                    onChange={(e) =>
                      handleUpdateQuestion(index, {
                        ...question,
                        marks: parseInt(e.target.value) || 1,
                      })
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <button
          type="button"
          onClick={onCancel}
          className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};
