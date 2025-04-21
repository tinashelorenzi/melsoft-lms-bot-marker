import React, { useState, useEffect } from "react";
import { Login } from "./components/Login";
import { AssignmentManager } from "./components/AssignmentManager";
import { Marking } from "./components/Marking";
import { Layout } from "./components/Layout";
import { MarkingStudio } from "./components/MarkingStudio";

interface Course {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  name: string;
  subject: string;
}

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState("assignments");
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("operatorToken");
        console.log("Fetching assignments data...");

        const response = await fetch("/api/operator/assignments", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch assignments: ${response.status} ${response.statusText}`
          );
        }

        const responseText = await response.text();
        let data;

        try {
          data = JSON.parse(responseText);
          console.log("Assignments data:", data);
        } catch (parseError) {
          console.error("Failed to parse response as JSON:", parseError);
          console.log("Raw response:", responseText.substring(0, 500) + "...");
          throw new Error("Invalid JSON response from server");
        }

        if (!Array.isArray(data)) {
          throw new Error("Invalid assignment data format");
        }

        // Extract unique subjects from assignments and normalize
        const subjects = Array.from(
          new Set(data.map((a: any) => a.subject))
        ).map((subject) => {
          const subjectStr = String(subject);
          return {
            id: subjectStr.toLowerCase().replace(/\s+/g, "-"),
            name: subjectStr,
          };
        });

        console.log("Extracted subjects:", subjects);

        // Format assignments for the frontend with consistent subject references
        const formattedAssignments = data.map((a: any) => {
          const subjectStr = String(a.subject);
          return {
            id: a.id,
            name: a.name,
            subject: subjectStr.toLowerCase().replace(/\s+/g, "-"),
            originalSubject: subjectStr,
          };
        });

        console.log("Formatted assignments:", formattedAssignments);

        setCourses(subjects);
        setAssignments(formattedAssignments);
        setError("");
        setDebugInfo({
          normalizedSubjects: subjects.map((s) => ({ id: s.id, name: s.name })),
          normalizedAssignments: formattedAssignments.map((a) => ({
            id: a.id,
            name: a.name,
            subject: a.subject,
            originalSubject: a.originalSubject,
          })),
        });
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
        setAssignments([]);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = (success: boolean) => {
    setIsAuthenticated(success);
  };

  const handleLogout = () => {
    localStorage.removeItem("operatorToken");
    setIsAuthenticated(false);
    setCourses([]);
    setAssignments([]);
    setDebugInfo(null);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <Layout
        onLogout={handleLogout}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      >
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout
        onLogout={handleLogout}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      >
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-lg text-red-500 mb-4">{error}</div>

          {debugInfo && (
            <div className="w-full max-w-2xl mt-6 bg-gray-50 border border-gray-300 p-4 rounded">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Debug Information:
              </h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      onLogout={handleLogout}
      currentPage={currentPage}
      onNavigate={handleNavigate}
    >
      {currentPage === "assignments" && <AssignmentManager />}
      {currentPage === "marking" && <Marking />}
      {currentPage === "studio" && (
        <MarkingStudio courses={courses} assignments={assignments} />
      )}
    </Layout>
  );
};
