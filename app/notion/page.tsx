"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

const NotionPage = () => {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncNotionStuff = async () => {
    setIsSyncing(true);
    setError(null);
    const res = await fetch(`/api/notion`, {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch data: ${res.statusText}`);
    }
    const data = await res.json();
    setText(data.text);
    setIsSyncing(false);
    setText("Synchronizacija suzadinta");
  };

  if (isSyncing) return <div>Syncing stuff...</div>;

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="flex flex-col items-center">
      {text ? (
        <p>{text}</p>
      ) : (
        <>
          <p>Synchronizuoti notiono turinį (visą)</p>
          <Button onClick={handleSyncNotionStuff}>Sync Notion Stuff</Button>
        </>
      )}
    </div>
  );
};

export default NotionPage;
