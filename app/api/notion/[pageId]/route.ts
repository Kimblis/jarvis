import { Client } from "@notionhq/client";
import { NextResponse, NextRequest } from "next/server";

const notion = new Client({
  auth: process.env.NOTION_API_TOKEN,
});

const getBlockChildrenRecursively = async (notion: Client, blockId: string) => {
  const blocks: any[] = [];
  let hasMore = true;
  let startCursor: string | undefined | null = undefined;

  while (hasMore) {
    const { results, has_more, next_cursor } =
      await notion.blocks.children.list({
        block_id: blockId,
        start_cursor: startCursor ?? undefined,
        page_size: 100,
      });
    blocks.push(...results);
    hasMore = has_more;
    startCursor = next_cursor;
  }

  for (const block of blocks) {
    if (block.has_children) {
      block.children = await getBlockChildrenRecursively(notion, block.id);
    }
  }

  return blocks;
};

const extractTextFromBlocks = (blocks: any[]): string => {
  let allText = "";

  for (const block of blocks) {
    switch (block.type) {
      case "paragraph":
        allText +=
          block.paragraph.rich_text.map((r: any) => r.plain_text).join(" ") +
          "\n";
        break;

      case "heading_1":
      case "heading_2":
      case "heading_3":
        allText +=
          block[block.type].rich_text.map((r: any) => r.plain_text).join(" ") +
          "\n";
        break;

      case "equation":
        allText += block.equation.expression + "\n";
        break;

      case "code":
        allText +=
          block.code.rich_text.map((r: any) => r.plain_text).join(" ") + "\n";
        break;

      case "bulleted_list_item":
      case "numbered_list_item":
      case "to_do":
      case "toggle":
      case "quote":
      case "callout":
        // All these use .rich_text for their content
        allText +=
          block[block.type].rich_text.map((r: any) => r.plain_text).join(" ") +
          "\n";
        break;

      case "table_row":
        // Processing table rows
        const rowText = block.table_row.cells
          .map((cell: any[]) =>
            cell.map((content) => content.plain_text).join(" "),
          )
          .join(" | "); // Using " | " as a separator between columns
        allText += rowText + "\n";
        break;
    }

    // If the block has children, recurse
    if (block.children && block.children.length > 0) {
      allText += extractTextFromBlocks(block.children);
    }
  }

  return allText;
};

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
    const blocks = await getBlockChildrenRecursively(notion, pageId);
    const text = extractTextFromBlocks(blocks);
    return NextResponse.json({ text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
