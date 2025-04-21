import React, { useState } from "react";
import {
  FaBook,
  FaChalkboardTeacher,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaFlask,
  FaKey,
} from "react-icons/fa";

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  onLogout,
  currentPage,
  onNavigate,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navigationItems = [
    { id: "tokens", label: "API Tokens", icon: FaKey },
    { id: "assignments", label: "Assignments", icon: FaBook },
    { id: "marking", label: "Marking", icon: FaChalkboardTeacher },
    { id: "studio", label: "Marking Studio", icon: FaFlask },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 bg-indigo-700 transform transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-indigo-800">
          <h1
            className={`text-xl font-bold text-white transition-opacity duration-300 ${
              isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
            }`}
          >
            LMS Bot Marker
          </h1>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 text-indigo-200 hover:text-white focus:outline-none"
          >
            {isSidebarOpen ? (
              <FaChevronLeft size={20} />
            ) : (
              <FaChevronRight size={20} />
            )}
          </button>
        </div>

        <nav className="mt-8">
          <div className="px-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center w-full px-4 py-2 text-sm rounded-lg ${
                    currentPage === item.id
                      ? "bg-indigo-800 text-white"
                      : "text-indigo-100 hover:bg-indigo-600"
                  }`}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  <Icon
                    className={`${isSidebarOpen ? "mr-3" : "mx-auto"} h-5 w-5`}
                  />
                  <span
                    className={`transition-opacity duration-300 ${
                      isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4">
          <button
            onClick={onLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-indigo-100 hover:bg-indigo-600 rounded-lg"
            title={!isSidebarOpen ? "Sign Out" : undefined}
          >
            <FaSignOutAlt
              className={`${isSidebarOpen ? "mr-3" : "mx-auto"} h-5 w-5`}
            />
            <span
              className={`transition-opacity duration-300 ${
                isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              Sign Out
            </span>
          </button>
        </div>
      </div>

      {/* Mobile sidebar toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed z-20 top-4 left-4 p-2 rounded-md bg-indigo-600 text-white ${
            isSidebarOpen ? "hidden" : "block"
          }`}
        >
          <FaBars size={24} />
        </button>
      </div>

      {/* Sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-16"
        }`}
      >
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
};
