import React, { useState } from "react";
import { useDataCleaner } from "@/context/DataCleanerContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type ExportFormat = "csv" | "excel";

export const DataExport: React.FC = () => {
  const { processedData, columns, isDataLoaded } = useDataCleaner();
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [fileName, setFileName] = useState<string>("cleaned_data");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isDataLoaded || !processedData.length) return null;

  // Export CSV function
  const exportCSV = () => {
    // Convert data to CSV format
    const csvHeader = columns.join(",");
    const csvRows = processedData.map((row) => {
      return columns
        .map((col) => {
          // Handle values with commas by quoting them
          //@ts-ignore
          const value = row[col];
          if (value === null || value === undefined) return "";
          const stringValue = String(value);
          return stringValue.includes(",") ? `"${stringValue}"` : stringValue;
        })
        .join(",");
    });

    const csvString = [csvHeader, ...csvRows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${fileName}.csv`);
  };

  // Export Excel function
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CleanedData");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${fileName}.xlsx`);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      if (exportFormat === "csv") {
        exportCSV();
      } else {
        exportExcel();
      }
      setIsExporting(false);
    } catch (error) {
      console.error("Error exporting data:", error);
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white p-4 border rounded-lg space-y-4">
      <h2 className="text-xl font-semibold">Export Cleaned Data</h2>

      <p className="text-sm text-gray-600">
        Download your cleaned dataset in CSV or Excel format.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="fileName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            File Name
          </label>
          <input
            type="text"
            id="fileName"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 block w-full"
          />
        </div>

        <div>
          <label
            htmlFor="exportFormat"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Format
          </label>
          <select
            id="exportFormat"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 block w-full"
          >
            <option value="csv">CSV (.csv)</option>
            <option value="excel">Excel (.xlsx)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`px-4 py-2 rounded text-white ${
            isExporting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {isExporting ? "Exporting..." : "Export Data"}
        </button>
      </div>
    </div>
  );
};
