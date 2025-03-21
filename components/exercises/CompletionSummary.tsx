import { Exercise } from "./types";

interface CompletionSummaryProps {
  exercises: Exercise[];
  completedExercises: string[];
  onRestart: () => void;
}

const CompletionSummary = ({
  exercises,
  completedExercises,
  onRestart,
}: CompletionSummaryProps) => {
  const completionPercentage =
    (completedExercises.length / exercises.length) * 100;

  return (
    <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4">
          <span className="inline-block p-3 rounded-full bg-green-100 text-green-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </span>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Exercises Completed!
        </h2>

        <p className="text-gray-600 mb-4">
          You&apos;ve completed {completedExercises.length} out of{" "}
          {exercises.length} exercises.
        </p>

        <div className="w-full max-w-md mb-6">
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {completionPercentage.toFixed(0)}% Complete
          </p>
        </div>

        <button
          onClick={onRestart}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-200 shadow-sm"
          aria-label="Start again"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onRestart()}
        >
          Start Again
        </button>
      </div>
    </div>
  );
};

export default CompletionSummary;
