import React, { useState, useEffect } from "react";
import { useDataCleaner } from "@/context/DataCleanerContext";
import { Action, Analysis } from "@/utils/schemas";

// Add new component for animated loading text
const AnimatedLoadingText: React.FC<{
  texts: string[];
  isActive: boolean;
  currentIndex?: number;
}> = ({ texts, isActive, currentIndex = 0 }) => {
  const [index, setIndex] = useState(currentIndex);
  const ellipsis = ["", ".", "..", "..."];
  const [ellipsisCount, setEllipsisCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    // Change text every 4 seconds
    const textInterval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, 4000);

    // Animate ellipsis every 500ms
    const ellipsisInterval = setInterval(() => {
      setEllipsisCount((prev) => (prev + 1) % ellipsis.length);
    }, 500);

    return () => {
      clearInterval(textInterval);
      clearInterval(ellipsisInterval);
    };
  }, [ellipsis.length, isActive, texts.length]);

  if (!isActive) return null;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="animate-pulse mb-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
      <p className="text-xl font-medium text-blue-600">
        {texts[index]}
        {ellipsis[ellipsisCount]}
      </p>
      <p className="text-sm text-gray-500 mt-2">
        Please wait while we process your data
      </p>
    </div>
  );
};

// Add error message component
const ErrorMessage: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 text-red-500 mx-auto mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h3 className="text-lg font-medium text-red-800 mb-2">
        Processing Error
      </h3>
      <p className="text-red-700 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
};

export const AiDataCleaning: React.FC = () => {
  const {
    rawData,
    processedData,
    setProcessedData,
    columns,
    isDataLoaded,
    flaggedRows,
    setFlaggedRows,
  } = useDataCleaner();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<Analysis | null>(null);
  const [actionsPerformed, setActionsPerformed] = useState<Action[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // Add new state for animation texts
  const [analysisPhase, setAnalysisPhase] = useState<string>("idle");

  // Add error message state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const analysisTexts = [
    "Analyzing your data structure...",
    "Identifying data quality issues...",
    "Detecting duplicate records...",
    "Examining missing values...",
    "Finding outliers in numeric data...",
    "Validating data against schema...",
    "Creating a data cleaning plan...",
    "Prioritizing data quality issues...",
    "Designing optimal cleaning sequence...",
    "Evaluating automated vs manual fixes...",
    "Suggesting cleaning actions...",
    "Evaluating best approach for your data...",
    "Analyzing potential data transformations...",
    "Computing optimal cleaning parameters...",
    "Executing cleaning actions...",
    "Normalizing data values...",
    "Standardizing formats...",
    "Removing duplicate entries...",
    "Handling missing values intelligently...",
    "Validating results against schema...",
  ];

  // Start AI analysis with animation updates
  const startAnalysis = async () => {
    console.log("calling startAnalysis");
    // Prevent multiple submissions

    if (!isDataLoaded || !rawData.length) return;

    setIsAnalyzing(true);
    setAnalysisPhase("analyzing");
    setAnalysisResult(null);
    setActionsPerformed([]);
    setMessages([]);
    setErrorMessage(null); // Clear any previous errors

    try {
      const response = await fetch("/api/chat/parser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: rawData,
          columns,
        }),
      });

      if (!response.ok) {
        setAnalysisPhase("error");
        return;
      }

      // Parse the response
      const result = await response.json();

      // Check if we have data
      if (!result || !result.actionsPerformed) {
        setAnalysisPhase("error");
        return;
      }

      // Update processed data with organizations
      if (result.processedOrganizations) {
        setProcessedData(result.processedOrganizations);
      }

      // Update analysis result
      if (result.analysis) {
        setAnalysisResult(result.analysis);
      }

      if (result.flaggedRows) {
        setFlaggedRows(result.flaggedRows);
      }

      if (result.actionsPerformed) {
        setActionsPerformed(result.actionsPerformed);
      }

      setAnalysisPhase("completed");
      setIsAnalyzing(false);
    } catch (error) {
      // Only set error if request wasn't aborted
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add export functions for CSV
  const exportAsCSV = (type: "valid" | "flagged") => {
    // Choose which data to export
    const dataToExport =
      type === "valid"
        ? processedData
        : processedData.filter((row) =>
            flaggedRows.some((r) => r.rowIndex === row.index),
          );

    if (dataToExport.length === 0) {
      alert("No data to export!");
      return;
    }

    // Prepare headers
    let exportColumns = [...columns];
    // Add notes column for flagged records
    if (type === "flagged") {
      exportColumns = [...columns, "notes"];
    }

    const headers = exportColumns.join(",");

    // Convert data to CSV
    const rows = dataToExport
      .map((row) => {
        const rowValues = columns.map((col) => {
          // Handle commas and quotes in the data
          const value =
            row[col as keyof typeof row] !== undefined &&
            row[col as keyof typeof row] !== null
              ? String(row[col as keyof typeof row])
              : "";
          if (value.includes(",") || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });

        // Add notes column for flagged records
        if (type === "flagged") {
          const flaggedRow = flaggedRows.find((r) => r.rowIndex === row.index);
          if (flaggedRow) {
            const notes = flaggedRow.columns
              .map((col) => `${col.column} - ${col.reason}`)
              .join("; ");
            rowValues.push(`"${notes.replace(/"/g, '""')}"`);
          } else {
            rowValues.push("");
          }
        }

        return rowValues.join(",");
      })
      .join("\n");

    const csv = `${headers}\n${rows}`;

    // Create download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${type}_records.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isDataLoaded) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI-Powered Data Cleaning</h3>
        <button
          onClick={startAnalysis}
          disabled={isAnalyzing || !isDataLoaded}
          className={`px-4 py-2 rounded-md ${
            isAnalyzing || !isDataLoaded
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isAnalyzing ? "Analyzing..." : "Start AI Analysis"}
        </button>
      </div>

      {/* Show error message if there's an error */}
      {analysisPhase === "error" && errorMessage && (
        <ErrorMessage message={errorMessage} onRetry={startAnalysis} />
      )}

      {/* Show animated loading states during different phases */}
      {analysisPhase === "analyzing" && (
        <AnimatedLoadingText
          texts={analysisTexts}
          isActive={analysisPhase === "analyzing"}
        />
      )}

      {/* Show analysis results */}
      {analysisResult && analysisPhase === "completed" && (
        <div className="flex flex-col gap-4">
          <div className="mt-6 p-4 border rounded-lg bg-white">
            <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>
            {typeof analysisResult === "object" &&
              "issues" in analysisResult && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">
                    Issues Found ({analysisResult.issues.length})
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {analysisResult.issues.map((issue, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            issue.severity === "high"
                              ? "bg-red-500"
                              : issue.severity === "medium"
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                          }`}
                        ></span>
                        {issue.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            {typeof analysisResult === "string" && (
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {analysisResult}
              </div>
            )}
          </div>
          {!!actionsPerformed.length && (
            <div className="mt-6 p-4 border rounded-lg bg-white">
              <h3 className="text-lg font-semibold mb-2">Cleaning Plan</h3>
              <div className="space-y-2">
                {actionsPerformed.map(
                  ({ type, description, column }, index) => (
                    <div
                      key={index}
                      className={`flex items-center p-2 rounded bg-green-500 text-white`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className={`font-medium text-green-700`}>
                        {`${type} action on column "${column}" - ${description}`}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
          <CleaningStatistics />
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-8 flex justify-between items-center">
        {/* Add export options */}
        {!isAnalyzing && analysisPhase === "completed" && (
          <div className="flex space-x-4">
            <button
              onClick={() => exportAsCSV("valid")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors focus:outline-none"
            >
              Export Valid Records
            </button>
            {flaggedRows.length > 0 && (
              <button
                onClick={() => exportAsCSV("flagged")}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors focus:outline-none"
              >
                Export Flagged Records
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Add CleaningStatistics component
const CleaningStatistics = () => {
  const { flaggedRows, rawData, processedData } = useDataCleaner();
  const unflaggedRows = processedData.filter(
    (row) => !flaggedRows.some((fr) => fr.rowIndex === row.index),
  );

  if (!processedData.length) return null;

  return (
    <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
      <h3 className="text-xl font-semibold mb-4 text-blue-800">
        Cleaning Results
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
          <p className="text-sm text-gray-500">Original Records</p>
          <p className="text-2xl font-bold">{rawData.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
          <p className="text-sm text-gray-500">Valid Records</p>
          <p className="text-2xl font-bold text-green-600">
            {unflaggedRows.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
          <p className="text-sm text-gray-500">Records Requiring Review</p>
          <p className="text-2xl font-bold text-red-600">
            {flaggedRows.length}
          </p>
        </div>
      </div>
    </div>
  );
};
