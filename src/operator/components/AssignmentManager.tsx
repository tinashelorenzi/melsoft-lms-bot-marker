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

  const renderAssignmentList = () => {
    return (
      <ul className="space-y-4">
        {assignments.map((assignment) => (
          <li
            key={`${assignment.subject}-${assignment.name}`}
            className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{assignment.name}</h3>
                <p className="text-gray-600">{assignment.subject}</p>
                <p className="text-sm text-gray-500">
                  Questions: {assignment.questions?.length || 0}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setSelectedAssignment(assignment)}
                  className="px-3 py-1 text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAssignment(assignment)}
                  className="px-3 py-1 text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Assignment Manager</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
          <button
            className="text-blue-600 hover:text-blue-800 ml-4"
            onClick={handleRetry}
          >
            Retry
          </button>
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
        <div className="space-y-6">
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={newAssignment.name}
                onChange={(e) =>
                  setNewAssignment({ ...newAssignment, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <input
                type="text"
                value={newAssignment.subject}
                onChange={(e) =>
                  setNewAssignment({
                    ...newAssignment,
                    subject: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {isLoading ? "Creating..." : "Create Assignment"}
            </button>
          </form>

          <div>
            <h3 className="text-lg font-medium mb-4">Existing Assignments</h3>
            {isLoading ? (
              <p>Loading assignments...</p>
            ) : assignments.length > 0 ? (
              renderAssignmentList()
            ) : (
              <p>No assignments found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
