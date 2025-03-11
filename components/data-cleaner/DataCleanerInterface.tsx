"use client";

import React from "react";
import { CsvUploader } from "./CsvUploader";
import { DataTable } from "./DataTable";
import { DataExport } from "./DataExport";
import { AiDataCleaning } from "./AiDataCleaning";
import { useDataCleaner } from "@/context/DataCleanerContext";

export const DataCleanerInterface: React.FC = () => {
  const { isDataLoaded } = useDataCleaner();

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-lg shadow-sm p-6">
        <CsvUploader />
      </section>

      {isDataLoaded && (
        <>
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Data Preview</h2>
            <DataTable pageSize={10} />
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6">
            <AiDataCleaning />
          </section>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <DataExport />
          </div>
        </>
      )}
    </div>
  );
};
