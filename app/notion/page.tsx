"use client";

import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const NotionPage = () => {
  const { pageId } = useParams();
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [inputPageId, setInputPageId] = useState<string>("");

  const handleSyncNotionStuff = async () => {
    const pageIdToSend = inputPageId.trim();
    if (!pageIdToSend.length) {
      setError("Page ID is required.");
      return;
    }

    setIsSyncing(true);
    setError(null);
    const res = await fetch(`/api/notion/${pageIdToSend}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    setIsSyncing(false);
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    setText("Susyncinom notiona");
  };
  useEffect(() => {
    if (!pageId) return;

    const fetchNotionData = async () => {
      try {
        const res = await fetch(`/api/notion/${pageId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch data: ${res.statusText}`);
        }
        const data = await res.json();
        setText(data.text);
      } catch (error: any) {
        setError(error.message);
      }
    };

    // Fetch data when the component mounts
    fetchNotionData();
  }, [pageId]);

  if (isSyncing) return <div>Syncing stuff...</div>;

  if (error) {
    return <div>Error: {error}</div>;
  }

  return pageId ? (
    <div>
      <h1>Notion Page Content</h1>
      <pre>{text}</pre>
    </div>
  ) : (
    <div className="flex justify-center items-center h-screen">
      {!text?.length ? (
        <div className="flex flex-col items-center">
          <label htmlFor="pageIdInput" className="mb-1">
            Lesson Page ID
          </label>
          <input
            id="pageIdInput"
            type="text"
            value={inputPageId}
            onChange={(e) => setInputPageId(e.target.value)}
            placeholder="e.g. 843ebb53195443038a83477bd85017e2"
            className="border rounded p-2 mb-4"
          />
          <Button onClick={handleSyncNotionStuff}>Sync Notion Stuff</Button>
        </div>
      ) : (
        <div>{text}</div>
      )}
    </div>
  );
};

export default NotionPage;
