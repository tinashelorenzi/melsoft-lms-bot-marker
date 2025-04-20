import React, { useState, useEffect } from "react";
import { Assignment } from "../../types";
import { AssignmentEditor } from "./AssignmentEditor";

export const AssignmentManager: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [newAssignment, setNewAssignment] = useState<Partial<Assignment>>({
    name: "",
    subject: "",
    questions: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rawResponse, setRawResponse] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError("");
    setRawResponse(null);

    try {
      const token = localStorage.getItem("operatorToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Fetching assignments...");
      const response = await fetch("/api/operator/assignments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Response status:", response.status);

      // Store the raw response for debugging
      const responseText = await response.text();
      setRawResponse(responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 100)}...`
        );
      }

      console.log("Fetched assignments:", data);

      if (!Array.isArray(data)) {
        throw new Error(
          "Invalid response format: expected an array of assignments"
        );
      }

      setAssignments(data);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load assignments"
      );
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("operatorToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      if (!newAssignment.name || !newAssignment.subject) {
        throw new Error("Name and subject are required");
      }

      console.log("Creating assignment:", newAssignment);
      const response = await fetch("/api/operator/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAssignment),
      });
      console.log("Create response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", errorData);
        throw new Error(
          `Failed to create assignment: ${response.status} ${response.statusText}`
        );
      }

      const createdAssignment = await response.json();
      console.log("Created assignment:", createdAssignment);
      setAssignments([...assignments, createdAssignment]);
      setNewAssignment({
        name: "",
        subject: "",
        questions: [],
      });
    } catch (err) {
      console.error("Error creating assignment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create assignment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAssignment = async (updatedAssignment: Assignment) => {
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("operatorToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Updating assignment:", updatedAssignment);
      const response = await fetch(
        `/api/operator/assignments/${updatedAssignment.subject}/${updatedAssignment.name}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedAssignment),
        }
      );
      console.log("Update response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", errorData);
        throw new Error(
          `Failed to update assignment: ${response.status} ${response.statusText}`
        );
      }

      const updated = await response.json();
      console.log("Updated assignment:", updated);
      setAssignments(
        assignments.map((a) => (a.id === updated.id ? updated : a))
      );
      setSelectedAssignment(null);
    } catch (err) {
      console.error("Error updating assignment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update assignment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignment: Assignment) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("operatorToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Deleting assignment:", assignment);
      const response = await fetch(
        `/api/operator/assignments/${assignment.subject}/${assignment.name}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Delete response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", errorData);
        throw new Error(
          `Failed to delete assignment: ${response.status} ${response.statusText}`
        );
      }

      setAssignments(assignments.filter((a) => a.id !== assignment.id));
      if (selectedAssignment?.id === assignment.id) {
        setSelectedAssignment(null);
      }
    } catch (err) {
      console.error("Error deleting assignment:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete assignment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to retry fetching assignments
  const handleRetry = () => {
    fetchAssignments();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Assignments</h2>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {rawResponse && error && (
        <div className="bg-gray-50 border border-gray-300 p-4 mb-4 rounded">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Raw server response (for debugging):
          </h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {rawResponse}
          </pre>
        </div>
      )}

      {selectedAssignment ? (
        <AssignmentEditor
          assignment={selectedAssignment}
          onSave={handleUpdateAssignment}
          onCancel={() => setSelectedAssignment(null)}
        />
      ) : (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Create New Assignment
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <form onSubmit={handleCreateAssignment}>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Assignment Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newAssignment.name}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          name: e.target.value,
                        })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={newAssignment.subject}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          subject: e.target.value,
                        })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating..." : "Create Assignment"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Existing Assignments
              </h3>
            </div>
            <div className="border-t border-gray-200">
              {isLoading ? (
                <div className="px-4 py-5 sm:px-6 flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500"
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
                  Loading assignments...
                </div>
              ) : assignments.length === 0 ? (
                <div className="px-4 py-5 sm:px-6 text-gray-500">
                  No assignments found. Create one above.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <li key={assignment.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {assignment.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Subject: {assignment.subject}
                          </p>
                          <p className="text-sm text-gray-500">
                            Questions: {assignment.questions.length}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedAssignment(assignment)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(assignment)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
