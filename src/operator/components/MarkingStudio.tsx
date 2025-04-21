// src/operator/components/MarkingStudio.tsx
import React, { useState, useEffect } from "react";
import { Question, Submission, MarkedSubmission } from "../../types/marker";

const API_URL = "http://localhost:3000"; // Add API URL constant

interface MarkingStudioProps {
  courses: { id: string; name: string }[];
  assignments: { id: string; name: string; subject: string }[];
}

export const MarkingStudio: React.FC<MarkingStudioProps> = ({
  courses,
  assignments,
}) => {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [markingResult, setMarkingResult] = useState<MarkedSubmission | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showStudio, setShowStudio] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, any> | null>(null);

  const filteredAssignments = assignments.filter(
    (assignment) => assignment.subject === selectedCourse
  );

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      const submission: Submission = {
        id: Date.now().toString(),
        assignmentName:
          assignments.find((a) => a.id === selectedAssignment)?.name || "",
        subject: selectedCourse,
        studentId: "test-student",
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
        submittedAt: new Date().toISOString(),
      };

      const token = localStorage.getItem("operatorToken");
      const response = await fetch(`${API_URL}/api/marker/mark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          submission,
          questions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Marking error response:", errorText);
        throw new Error("Failed to mark submission");
      }

      const result = await response.json();
      setMarkingResult(result);
    } catch (err) {
      console.error("Error during marking:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError("");
      setDebugInfo(null);

      const token = localStorage.getItem("operatorToken");
      const assignment = assignments.find((a) => a.id === selectedAssignment);
      if (!assignment) {
        throw new Error("Assignment not found");
      }

      // Get the selected course name from the courses array
      const selectedCourseObj = courses.find(
        (course) => course.id === selectedCourse
      );
      if (!selectedCourseObj) {
        throw new Error("Course not found");
      }

      console.log(
        `Loading assignment: Subject=${selectedCourseObj.name}, Name=${assignment.name}`
      );

      const response = await fetch(
        `/api/operator/assignments/${encodeURIComponent(
          selectedCourseObj.name
        )}/${encodeURIComponent(assignment.name)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `Failed to load questions: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid assignment data format");
      }

      setQuestions(
        data.questions.map((q: any) => ({
          ...q,
          marks: q.marks || 0,
        }))
      );
      setAnswers({});
      setShowStudio(true);
    } catch (err) {
      console.error("Error loading questions:", err);
      setError(err instanceof Error ? err.message : "Failed to load questions");
      setShowStudio(false);
    } finally {
      setLoading(false);
    }
  };

  const resetStudio = () => {
    setShowStudio(false);
    setQuestions([]);
    setAnswers({});
    setMarkingResult(null);
    setError("");
    setDebugInfo(null);
  };

  // Helper to rebuild the index
  const handleRebuildIndex = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("operatorToken");
      const response = await fetch("/api/operator/debug/rebuild-index", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setDebugInfo((prevInfo) => ({
          ...prevInfo,
          indexRebuildResult: result,
        }));
        alert("Index rebuilt successfully. Try loading the assignment again.");
      } else {
        throw new Error("Failed to rebuild index");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rebuild index");
    } finally {
      setLoading(false);
    }
  };

  if (!showStudio) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Assignment Selection</h2>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Course/Subject
            </label>
            <select
              className="w-full p-2 border rounded"
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedAssignment("");
              }}
            >
              <option key="default" value="">
                Select a course
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Assignment</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              disabled={!selectedCourse}
            >
              <option key="default" value="">
                Select an assignment
              </option>
              {filteredAssignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mt-4"
            onClick={loadQuestions}
            disabled={!selectedAssignment || loading}
          >
            {loading ? "Loading..." : "Proceed to Studio"}
          </button>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={handleRebuildIndex}
                    className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
                    disabled={loading}
                  >
                    Rebuild Assignment Index
                  </button>
                </div>
              </div>
            </div>
          )}

          {debugInfo && (
            <div className="mt-6 bg-gray-50 border border-gray-300 p-4 rounded">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Debug Information:
              </h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Marking Studio</h2>
        <button
          onClick={resetStudio}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          ← Back to Selection
        </button>
      </div>

      {questions.length > 0 ? (
        <div className="space-y-6">
          {questions.map((question) => (
            <div
              key={question.id}
              className="border p-4 rounded bg-white shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <p className="font-medium text-lg">{question.text}</p>
                <span className="text-sm text-gray-500">
                  Worth {question.marks} marks
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer:
                  </label>
                  <textarea
                    className="w-full p-3 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    placeholder="Type your answer here..."
                  />
                </div>
                {markingResult &&
                  markingResult.results.find(
                    (r) => r.questionId === question.id
                  ) && (
                    <div className="mt-4">
                      <div className="bg-gray-50 p-4 rounded-md border">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-lg">Feedback</h4>
                          <span className="font-medium">
                            Score:{" "}
                            {
                              markingResult.results.find(
                                (r) => r.questionId === question.id
                              )?.score
                            }{" "}
                            /{" "}
                            {
                              markingResult.results.find(
                                (r) => r.questionId === question.id
                              )?.maxMarks
                            }
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {
                            markingResult.results.find(
                              (r) => r.questionId === question.id
                            )?.feedback
                          }
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          ))}

          <div className="sticky bottom-4 bg-white p-4 rounded-lg shadow-md border">
            <button
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              onClick={handleSubmit}
              disabled={loading || Object.keys(answers).length === 0}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Marking in progress...
                </span>
              ) : (
                "Submit for Marking"
              )}
            </button>

            {error && (
              <div className="text-red-500 mt-4 text-center">{error}</div>
            )}

            {markingResult && (
              <div className="mt-6 bg-green-50 p-4 rounded-md border border-green-200">
                <h4 className="font-semibold text-lg mb-2">Final Results</h4>
                <div className="flex justify-between items-center">
                  <span>Total Score:</span>
                  <span className="font-medium">
                    {markingResult.totalScore} / {markingResult.maxScore}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading questions...</p>
        </div>
      )}
    </div>
  );
};
