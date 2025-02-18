import { inngest } from "@/inggest/inngest.client";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Client } from "@notionhq/client";
import { GetPageResponse } from "@notionhq/client/build/src/api-endpoints";
import { createClient } from "@supabase/supabase-js";

const NOTION_LESSONS_DATABASEID = "2fc21ed7f56a473383c58032fbf4961d";

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

export type Lesson = {
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const getBlockChildrenRecursively = async (blockId: string) => {
  const blocks: any[] = [];
  let hasMore = true;
  let startCursor: string | undefined | null = undefined;

  while (hasMore) {
    try {
      const { results, has_more, next_cursor } =
        await notion.blocks.children.list({
          block_id: blockId,
          start_cursor: startCursor ?? undefined,
          page_size: 100,
        });

      blocks.push(...results);
      hasMore = has_more;
      startCursor = next_cursor;
    } catch (error) {
      console.log(`error`, error);
      break;
    }
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

export const syncNotionStationsBatched = async (
  stationPageIds: string[],
  lessonId: string,
  batchSize: number = 3,
) => {
  const databaseStations = await supabaseClient
    .from("station")
    .select("notionPageId")
    .in("notionPageId", stationPageIds);
  const databaseStationNotionPageIds = databaseStations.data?.map(
    (station) => station.notionPageId,
  );
  const filteredStationPageIds = stationPageIds.filter(
    (stationPageId) => !databaseStationNotionPageIds?.includes(stationPageId),
  );

  for (let i = 0; i < filteredStationPageIds.length; i += batchSize) {
    const batch = filteredStationPageIds.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (stationPageId) => {
        console.log(`syncing station ${stationPageId}`);
        const response = await notion.pages.retrieve({
          page_id: stationPageId,
        });
        const { properties } = response as any;
        const id: string = properties.Id?.formula?.string;
        const title: string =
          properties.Pavadinimas?.title[0]?.plain_text ||
          `Unknown station${id}`;
        const nuggetPageIds: string[] = properties.Dalys?.relation.map(
          (relation: NotionRelation) => relation.id,
        );
        const textNuggets: string[] = [];

        await Promise.all(
          nuggetPageIds.map(async (nuggetPageId) => {
            let nuggetResponse: GetPageResponse;
            try {
              nuggetResponse = await notion.pages.retrieve({
                page_id: nuggetPageId,
              });
            } catch (error) {
              const baseDelay = 5000;
              const jitter = Math.random() * 15000; // up to 15 second of random delay jitter
              console.log(
                `retrieved error, will sleep for: ${(baseDelay + jitter) / 1000}s`,
              );
              await sleep(baseDelay + jitter);
              nuggetResponse = await notion.pages.retrieve({
                page_id: nuggetPageId,
              });
            }
            const nuggetProperties = (nuggetResponse as any).properties;
            const nuggetType = nuggetProperties.Tipas?.select?.name;
            const nuggetTitle: string =
              nuggetProperties.Pavadinimas?.title?.[0]?.plain_text || "";
            const isTextNugget =
              nuggetType == "Content" &&
              !nuggetTitle.toUpperCase().includes("VIDEO");
            if (!isTextNugget) return;
            const blocks = await getBlockChildrenRecursively(nuggetPageId);
            const text = extractTextFromBlocks(blocks);
            textNuggets.push(text);
          }),
        );

        const text = textNuggets.join("\n");
        const embeddingsModel = new OpenAIEmbeddings();
        const embeddingVector = await embeddingsModel.embedQuery(text);
        console.log(
          `created embedding vector for ${title}, vector length: ${embeddingVector.length}`,
        );
        await supabaseClient.from("station").upsert(
          {
            id,
            title,
            lessonId,
            embedding: embeddingVector,
          },
          { onConflict: "id" },
        );
      }),
    );
  }
};

export const syncNotionStations = async (
  stationPageIds: string[],
  lessonId: string,
) => {
  const databaseStations = await supabaseClient
    .from("station")
    .select("id")
    .in("notionPageId", stationPageIds);
  const databaseStationIds = databaseStations.data?.map(
    (station) => station.id,
  );
  const filteredStationPageIds = stationPageIds.filter(
    (stationPageId) => !databaseStationIds?.includes(stationPageId),
  );

  for (const stationPageId of filteredStationPageIds) {
    console.log(`syncing station ${stationPageId}`);
    const response = await notion.pages.retrieve({ page_id: stationPageId });
    const { properties } = response as any;
    const id: string = properties.Id?.formula?.string;
    const title: string =
      properties.Pavadinimas?.title[0]?.plain_text || `Unknown station${id}`;
    const nuggetPageIds: string[] = properties.Dalys?.relation.map(
      (relation: NotionRelation) => relation.id,
    );
    const textNuggets: string[] = [];
    for (const nuggetPageId of nuggetPageIds) {
      let nuggetResponse: GetPageResponse;
      try {
        nuggetResponse = await notion.pages.retrieve({
          page_id: nuggetPageId,
        });
      } catch (error) {
        const baseDelay = 5000;
        const jitter = Math.random() * 15000; // up to 15 second of random delay jitter
        console.log(
          `retrieved error, will sleep for: ${(baseDelay + jitter) / 1000}s`,
        );
        await sleep(baseDelay + jitter);
        nuggetResponse = await notion.pages.retrieve({
          page_id: nuggetPageId,
        });
      }
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
    await supabaseClient.from("station").upsert(
      {
        id,
        title,
        lessonId,
        embedding: embeddingVector,
        notionPageId: stationPageId,
      },
      { onConflict: "id" },
    );
  }
};

export const syncNotionLessons = async () => {
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

  const totalBatches = Math.ceil(lessons.length / 10);
  const halfBatch = Math.floor(totalBatches / 2);

  for (let i = 0; i < lessons.length; i += 10) {
    const batchNumber = i / 10 + 1; // Human-friendly batch numbering (1-indexed)
    console.log(`sending batch ${batchNumber} of ${totalBatches}`);
    const batch = lessons.slice(i, i + 10);
    await inngest.send({
      name: "sync/notion.lessons.batch",
      data: { lessons: batch },
    });
    const isHalfWayBatch = batchNumber === halfBatch;
    const sleepDuration = isHalfWayBatch ? 10 * 60 * 1000 : 6 * 60 * 1000; // 10 minutes if half of the batches are finished, 6 minutes if not
    await sleep(sleepDuration);
  }
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

  await supabaseClient.from("lesson").upsert({
    id,
    title,
    grade,
    notionPageId: pageId,
  });

  return syncNotionStations(stationPageIds, id);
};
