"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { Action, FlaggedRow, Organizations } from "@/utils/schemas";

interface DataCleanerContextType {
  rawData: any[];
  setRawData: Dispatch<SetStateAction<any[]>>;
  processedData: Organizations;
  setProcessedData: Dispatch<SetStateAction<Organizations>>;
  columns: string[];
  setColumns: Dispatch<SetStateAction<string[]>>;
  isDataLoaded: boolean;
  setIsDataLoaded: Dispatch<SetStateAction<boolean>>;
  flaggedRows: FlaggedRow[];
  setFlaggedRows: Dispatch<SetStateAction<FlaggedRow[]>>;
  actionsPerformed: Action[];
  setActionsPerformed: Dispatch<SetStateAction<Action[]>>;
  validationInProgress: boolean;
  setValidationInProgress: Dispatch<SetStateAction<boolean>>;
}

// Create context with default undefined value
const DataCleanerContext = createContext<DataCleanerContextType | undefined>(
  undefined,
);

// Provider component
export const DataCleanerProvider = ({ children }: { children: ReactNode }) => {
  const [rawData, setRawData] = useState<any[]>([]);
  const [processedData, setProcessedData] = useState<Organizations>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const [validationInProgress, setValidationInProgress] =
    useState<boolean>(false);
  const [actionsPerformed, setActionsPerformed] = useState<Action[]>([]);
  const [flaggedRows, setFlaggedRows] = useState<FlaggedRow[]>([]);

  return (
    <DataCleanerContext.Provider
      value={{
        rawData,
        setRawData,
        processedData,
        setProcessedData,
        columns,
        setColumns,
        isDataLoaded,
        setIsDataLoaded,
        flaggedRows,
        setFlaggedRows,
        actionsPerformed,
        setActionsPerformed,
        validationInProgress,
        setValidationInProgress,
      }}
    >
      {children}
    </DataCleanerContext.Provider>
  );
};

// Custom hook for using the context
export const useDataCleaner = () => {
  const context = useContext(DataCleanerContext);
  if (!context) {
    throw new Error("useDataCleaner must be used within a DataCleanerProvider");
  }
  return context;
};
