"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const NotionPage = () => {
  const { pageId } = useParams();
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pageId) {
      setError("No Page ID provided");
      return;
    }

    const fetchNotionData = async () => {
      try {
        // Call the API route using fetch
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
