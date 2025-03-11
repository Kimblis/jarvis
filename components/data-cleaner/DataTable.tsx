import React, { useState, useEffect } from "react";
import { useDataCleaner } from "@/context/DataCleanerContext";
import { Organization } from "@/utils/schemas";

interface DataTableProps {
  pageSize?: number;
}

export const DataTable: React.FC<DataTableProps> = ({ pageSize = 10 }) => {
  const { processedData, columns, isDataLoaded, flaggedRows } =
    useDataCleaner();
  const [currentPage, setCurrentPage] = useState(0);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(0);
  }, [processedData]);

  if (!isDataLoaded || !processedData.length) {
    return (
      <div className="text-center p-10 bg-gray-50 rounded-lg">
        <p className="text-gray-500">
          No data has been uploaded yet. Please upload a CSV or Excel file.
        </p>
      </div>
    );
  }

  // Get paginated data
  const pageCount = Math.ceil(processedData.length / pageSize);
  const offset = currentPage * pageSize;

  const paginatedData = processedData.slice(offset, offset + pageSize);

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if already sorting by this column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new sort column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return null;

    return sortDirection === "asc" ? (
      <span className="ml-1">↑</span>
    ) : (
      <span className="ml-1">↓</span>
    );
  };

  // Get cell class based on column metadata and if it's flagged
  const getCellClass = (column: string, value: Organization) => {
    // Check if this cell is in a flagged record
    const isFlagged = flaggedRows?.some(
      (flaggedRow) =>
        flaggedRow.rowIndex === value.index &&
        flaggedRow.columns.some((c) => c.column === column),
    );

    return isFlagged ? "bg-red-100 border border-red-400" : "";
  };

  // Get row class to highlight flagged rows
  const getRowClass = (rowIndex: number) => {
    const isFlagged = flaggedRows?.some(
      (record) => record.rowIndex === rowIndex,
    );

    return isFlagged
      ? "border-l-4 border-red-500 hover:bg-red-50"
      : "hover:bg-gray-50";
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center">
                    <span>{column}</span>
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => {
              const offsetRowIndex = offset + rowIndex;
              return (
                <tr
                  key={`row-${offsetRowIndex}`}
                  className={getRowClass(offsetRowIndex)}
                >
                  {columns.map((column) => (
                    <td
                      key={`${column}-${offsetRowIndex}`}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${getCellClass(
                        column,
                        row,
                      )}`}
                    >
                      <div className="flex items-center">
                        {/* Display warning icon for flagged fields */}
                        {flaggedRows?.some(
                          (record) =>
                            record.rowIndex === offset + rowIndex &&
                            record.columns.some((c) => c.column === column),
                        ) && (
                          <span
                            className="mr-1 text-red-500"
                            title="This field has issues"
                          >
                            ⚠️
                          </span>
                        )}

                        {/* Display the value */}
                        {
                          //@ts-ignore
                          row[column] === null || row[column] === undefined
                            ? "-"
                            : //@ts-ignore
                              String(row[column])
                        }
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add a legend for color coding */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 mr-2"></div>
          <span>Missing value</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-50 border border-orange-200 mr-2"></div>
          <span>Potential outlier</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 border border-red-400 mr-2"></div>
          <span>Invalid field (flagged)</span>
        </div>
      </div>

      {/* Pagination controls */}
      {pageCount > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{offset + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(offset + pageSize, processedData.length)}
              </span>{" "}
              of <span className="font-medium">{processedData.length}</span>{" "}
              results
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className={`px-3 py-1 rounded-md ${
                currentPage === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(pageCount - 1, currentPage + 1))
              }
              disabled={currentPage === pageCount - 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === pageCount - 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
