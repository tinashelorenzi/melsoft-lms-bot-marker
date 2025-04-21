import React from "react";
import { Assignment } from "../../types";

interface MarkingProps {
  assignments: Assignment[];
}

export const Marking: React.FC<MarkingProps> = ({ assignments }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Assignment Marking</h2>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Pending Submissions
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Review and mark student submissions
          </p>
        </div>

        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:px-6 text-gray-500">
            {assignments.length === 0 ? (
              "No submissions pending review."
            ) : (
              <ul className="space-y-4">
                {assignments.map((assignment) => (
                  <li key={assignment.id} className="border p-4 rounded-lg">
                    <h4 className="font-medium">{assignment.name}</h4>
                    <p className="text-sm text-gray-600">
                      {assignment.subject}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
