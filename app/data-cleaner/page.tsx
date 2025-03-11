import { DataCleanerProvider } from "@/context/DataCleanerContext";
import { DataCleanerInterface } from "@/components/data-cleaner/DataCleanerInterface";

export default function DataCleanerPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">CSV Data Cleaner</h1>
      <DataCleanerProvider>
        <DataCleanerInterface />
      </DataCleanerProvider>
    </div>
  );
}
