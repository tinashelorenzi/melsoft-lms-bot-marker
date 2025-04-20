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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("operatorToken");
        const response = await fetch("/api/operator/assignments", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch assignments");
        }

        const assignments = await response.json();

        // Extract unique subjects from assignments
        const subjects = [
          ...new Set(assignments.map((a: any) => a.subject)),
        ].map((subject) => ({
          id: String(subject).toLowerCase(),
          name: String(subject),
        }));

        // Format assignments for the frontend
        const formattedAssignments = assignments.map((a: any) => ({
          id: a.id,
          name: a.name,
          subject: String(a.subject).toLowerCase(),
        }));

        setCourses(subjects);
        setAssignments(formattedAssignments);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        console.error("Error loading data:", err);
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
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-red-500">{error}</div>
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
