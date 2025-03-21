interface ProgressBarProps {
  current: number;
  total: number;
  completed: number;
}

const ProgressBar = ({ current, total, completed }: ProgressBarProps) => {
  // Calculate the width for completed exercises
  const completedPercent = (completed / total) * 100;

  // For current exercise progress, only show blue for the current non-completed exercise
  const currentExercisePercent = ((current - completed) / total) * 100;

  return (
    <div className="w-full mb-4">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>
          Exercise {current} of {total}
        </span>
        <span>{completed} completed</span>
      </div>
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden relative">
        {completed > 0 && (
          <div
            className="absolute h-full bg-green-500 transition-all duration-300"
            style={{ width: `${completedPercent}%` }}
          />
        )}
        {current > completed && (
          <div
            className="absolute h-full bg-blue-500 transition-all duration-300"
            style={{
              width: `${(1 / total) * 100}%`,
              left: `${completedPercent}%`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
