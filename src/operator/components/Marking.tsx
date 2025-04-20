import React from "react";

export const Marking: React.FC = () => {
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
            No submissions pending review.
          </div>
        </div>
      </div>
    </div>
  );
};
