import {
  extractTextFromBlocks,
  getBlockChildrenRecursively,
  syncNotionLessonByPageId,
} from "@/utils/syncNotionLessons";
import { NextResponse, NextRequest } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> },
) => {
  const { pageId } = await params;

  if (!pageId || Array.isArray(pageId)) {
    return NextResponse.json(
      { error: "Page ID is required and must be a single string" },
      { status: 400 },
    );
  }

  try {
    const blocks = await getBlockChildrenRecursively(pageId);
    const text = extractTextFromBlocks(blocks);
    return NextResponse.json({ text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> },
) => {
  const { pageId } = await params;

  if (!pageId || Array.isArray(pageId)) {
    return NextResponse.json(
      { error: "Page ID is required and must be a single string" },
      { status: 400 },
    );
  }

  try {
    console.log(`syncing lesson ${pageId}`);
    await syncNotionLessonByPageId(pageId);
    return NextResponse.json({ message: "Lesson synced" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "An error occurred!" }, { status: 500 });
  }
};
