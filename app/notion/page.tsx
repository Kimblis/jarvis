"use client";

import { useEffect, useState } from "react";

const NotionPage = () => {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotionData = async () => {
      try {
        // Call the API route using fetch
        const res = await fetch("/api/notion");
        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await res.json();
        setText(data.text);
      } catch (error: any) {
        setError(error.message);
      }
    };

    // Fetch data when the component mounts
    fetchNotionData();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Notion Page Content</h1>
      <pre>{text}</pre>
    </div>
  );
};

export default NotionPage;
