import { OpenAIEmbeddings } from "@langchain/openai";
import { Client } from "@notionhq/client";
import { createClient } from "@supabase/supabase-js";

const NOTION_LESSONS_DATABASEID = "3d183cc5f5b049dbb5c87c7342ee1791";

const notion = new Client({
  auth: process.env.NOTION_API_TOKEN,
});
const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PRIVATE_KEY!,
);

type Station = {
  id: string;
  lessonId: string;
  title: string;
  embedding: number[];
};

type Lesson = {
  id: string;
  title: string;
  grade: number;
  notionPageId: string;
  stationPageIds: string[];
  stations?: Station[];
};

export type NotionRelation = {
  id: string;
};

export const getBlockChildrenRecursively = async (blockId: string) => {
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
      block.children = await getBlockChildrenRecursively(block.id);
    }
  }

  return blocks;
};

export const extractTextFromBlocks = (blocks: any[]): string => {
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

const syncNotionStations = async (
  stationPageIds: string[],
  lessonId: string,
) => {
  const lessonStations = await supabaseClient
    .from("station")
    .select("id")
    .eq("lessonId", lessonId);
  const lessonStationsIds = lessonStations.data?.map((station) => station.id);
  console.log(`lessonStationsIds: ${lessonStationsIds}`);
  console.log(`stationPageIds: ${stationPageIds}`);

  for (const stationPageId of stationPageIds) {
    const response = await notion.pages.retrieve({ page_id: stationPageId });
    const { properties } = response as any;
    const id: string = properties.Id?.formula?.string;
    if (lessonStationsIds?.includes(id)) {
      console.log(`id: ${id} is already in database, continue`);
      continue;
    }
    const title: string =
      properties.Pavadinimas?.title[0]?.plain_text || `Unknown station${id}`;
    const nuggetPageIds: string[] = properties.Dalys?.relation.map(
      (relation: NotionRelation) => relation.id,
    );
    const textNuggets: string[] = [];
    for (const nuggetPageId of nuggetPageIds) {
      const nuggetResponse = await notion.pages.retrieve({
        page_id: nuggetPageId,
      });
      const nuggetProperties = (nuggetResponse as any).properties;
      const nuggetType = nuggetProperties.Tipas?.select?.name;
      const nuggetTitle: string =
        nuggetProperties.Pavadinimas?.title?.[0]?.plain_text || "";
      const isTextNugget =
        nuggetType == "Content" && !nuggetTitle.toUpperCase().includes("VIDEO");
      if (!isTextNugget) continue;
      const blocks = await getBlockChildrenRecursively(nuggetPageId);
      const text = extractTextFromBlocks(blocks);
      textNuggets.push(text);
    }
    const text = textNuggets.join("\n");
    const embeddingsModel = new OpenAIEmbeddings();
    const embeddingVector = await embeddingsModel.embedQuery(text);
    console.log(
      `created embedding vector for ${title}, vector length: ${embeddingVector.length}`,
    );
    await supabaseClient.from("station").upsert({
      id,
      title,
      lessonId,
      embedding: embeddingVector,
    });
  }
};

const syncNotionLessons = async () => {
  let hasMore = true;
  let nextCursor: string | undefined = undefined;
  const lessons: Lesson[] = [];

  while (hasMore) {
    const response = await notion.databases.query({
      database_id: NOTION_LESSONS_DATABASEID,
      start_cursor: nextCursor,
    });
    lessons.push(
      ...response.results.map((result) => {
        const { properties, id: notionPageId } = result as any;
        const id: string = properties.Id?.formula?.string;
        const title: string =
          properties.Pavadinimas?.title[0]?.plain_text || "Unknown lesson";
        const grade: number =
          parseInt(properties.Klasė?.select?.name, 10) || 12;
        const stationPageIds: string[] = properties.Stotelės?.relation.map(
          (relation: NotionRelation) => relation.id,
        );

        return {
          id,
          title,
          grade,
          notionPageId,
          stationPageIds,
        };
      }),
    );

    hasMore = response.has_more;
    nextCursor = response.next_cursor as string;
  }

  await Promise.all(
    lessons.map(async (lesson) => {
      await supabaseClient.from("lesson").upsert({
        id: lesson.id,
        title: lesson.title,
        grade: lesson.grade,
        notionPageId: lesson.notionPageId,
        stationPageIds: lesson.stationPageIds,
      });

      return syncNotionStations(lesson.stationPageIds, lesson.id);
    }),
  );
};

export const syncNotionLessonByPageId = async (pageId: string) => {
  const response = await notion.pages.retrieve({ page_id: pageId });
  const { properties } = response as any;
  const id: string = properties.Id?.formula?.string;
  const title: string =
    properties.Pavadinimas?.title[0]?.plain_text || "Unknown lesson";
  const grade: number = parseInt(properties.Klasė?.select?.name, 10) || 12;
  const stationPageIds: string[] = properties.Stotelės?.relation.map(
    (relation: NotionRelation) => relation.id,
  );

  console.log("will try to add lesson to database");
  await supabaseClient.from("lesson").upsert({
    id,
    title,
    grade,
    notionPageId: pageId,
  });
  console.log("lesson added to database");

  return syncNotionStations(stationPageIds, id);
};
