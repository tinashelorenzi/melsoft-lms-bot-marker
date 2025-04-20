import React, { useState } from "react";
import { Login } from "./components/Login";
import { AssignmentManager } from "./components/AssignmentManager";

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (success: boolean) => {
    setIsAuthenticated(success);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">
                LMS Bot Marker
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {!isAuthenticated ? (
          <Login onLogin={handleLogin} />
        ) : (
          <AssignmentManager />
        )}
      </main>
    </div>
  );
};
