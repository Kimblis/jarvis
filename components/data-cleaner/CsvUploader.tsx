import React, { useState } from "react";
import {
  useCSVReader,
  lightenDarkenColor,
  formatFileSize,
} from "react-papaparse";
import { useDataCleaner } from "@/context/DataCleanerContext";
import * as XLSX from "xlsx";
import { Organizations } from "@/utils/schemas";

const DEFAULT_REMOVE_HOVER_COLOR = "#A01919";
const REMOVE_HOVER_COLOR_LIGHT = lightenDarkenColor(
  DEFAULT_REMOVE_HOVER_COLOR,
  40,
);

export const CsvUploader: React.FC = () => {
  const { CSVReader } = useCSVReader();
  const [zoneHover, setZoneHover] = useState(false);
  const [removeHoverColor, setRemoveHoverColor] = useState(
    DEFAULT_REMOVE_HOVER_COLOR,
  );
  const [error, setError] = useState<string | null>(null);

  const { setRawData, setProcessedData, setColumns, setIsDataLoaded } =
    useDataCleaner();

  // Process CSV data
  const processCsvData = (results: any) => {
    try {
      if (
        !results.data ||
        !Array.isArray(results.data) ||
        results.data.length < 2
      ) {
        setError("Invalid data format or empty file");
        return;
      }

      const data = results.data;
      const formattedData = data.map((row: any, index: number) => ({
        ...row,
        index,
      }));
      // First row is headers in our case
      const headers = Object.keys(data[0]);

      setRawData(formattedData);
      setProcessedData(formattedData as Organizations);
      setColumns(headers);

      setIsDataLoaded(true);
      setError(null);
    } catch (error) {
      console.error("Error processing CSV data:", error);
      setError("Failed to process the file. Please check the format.");
    }
  };

  const transformHeader = (header: string, index: number) => {
    switch (index) {
      case 0:
        return "name";
      case 1:
        return "industry";
      case 2:
        return "regCode";
      case 3:
        return "vatCode";
      case 4:
        return "country";
      case 5:
        return "type";
      case 6:
        return "firstLine";
      case 7:
        return "city";
      case 8:
        return "postalCode";
      default:
        return header;
    }
  };

  const transformValue = (value: string) => {
    return value.trim();
  };

  // Handle Excel files
  const handleExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Process the data
        processCsvData({ data: jsonData });
      } catch (error) {
        console.error("Error processing Excel file:", error);
        setError("Failed to process Excel file. The file might be corrupted.");
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file");
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3">Upload Data</h2>
      <p className="mb-4 text-gray-600">
        Upload a CSV or Excel file to begin cleaning your data. The file should
        have headers in the first row.
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">CSV File</h3>
          <CSVReader
            onUploadAccepted={(results: any) => {
              processCsvData(results);
              setZoneHover(false);
            }}
            onDragOver={(event: DragEvent) => {
              event.preventDefault();
              setZoneHover(true);
            }}
            onDragLeave={(event: DragEvent) => {
              event.preventDefault();
              setZoneHover(false);
            }}
            config={{
              skipEmptyLines: "greedy",
              header: true,
              dynamicTyping: true,
              encoding: "utf-8",
              transformHeader,
              transform: transformValue,
            }}
          >
            {({
              getRootProps,
              acceptedFile,
              ProgressBar,
              getRemoveFileProps,
              Remove,
            }: any) => (
              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center h-[180px] p-5 border-2 border-dashed rounded-lg cursor-pointer ${
                  zoneHover ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
              >
                {acceptedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="text-sm font-medium">
                      {acceptedFile.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatFileSize(acceptedFile.size)}
                    </div>
                    <div className="w-full mt-3">
                      <ProgressBar />
                    </div>
                    <div
                      {...getRemoveFileProps()}
                      className="mt-3 text-red-600 hover:text-red-800 cursor-pointer text-sm"
                      onMouseOver={(event: Event) => {
                        event.preventDefault();
                        setRemoveHoverColor(REMOVE_HOVER_COLOR_LIGHT);
                      }}
                      onMouseOut={(event: Event) => {
                        event.preventDefault();
                        setRemoveHoverColor(DEFAULT_REMOVE_HOVER_COLOR);
                      }}
                    >
                      Remove File
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                    <p className="mt-1 text-sm text-gray-600">
                      Drag & drop a CSV file or click to browse
                    </p>
                  </div>
                )}
              </div>
            )}
          </CSVReader>
        </div>

        <div>
          <h3 className="font-medium mb-2">Excel File</h3>
          <div
            className={`flex flex-col items-center justify-center h-[180px] p-5 border-2 border-dashed rounded-lg cursor-pointer ${
              zoneHover ? "border-green-500 bg-green-50" : "border-gray-300"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setZoneHover(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setZoneHover(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setZoneHover(false);
              const file = e.dataTransfer?.files[0];
              if (
                file &&
                (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))
              ) {
                handleExcelFile(file);
              } else {
                setError("Please upload a valid Excel file (.xlsx or .xls)");
              }
            }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".xlsx,.xls";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  handleExcelFile(file);
                }
              };
              input.click();
            }}
          >
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-1 text-sm text-gray-600">
                Drag & drop an Excel file or click to browse
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
