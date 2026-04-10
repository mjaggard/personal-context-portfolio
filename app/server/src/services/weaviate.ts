import weaviate, {
  type WeaviateClient,
  type Collection,
} from "weaviate-client";
import { Filters } from "weaviate-client";
import { config } from "../config.js";

const COLLECTION_NAME = "PortfolioDocument";

export const VALID_FILE_NAMES = [
  "identity",
  "role-and-responsibilities",
  "current-projects",
  "team-and-relationships",
  "tools-and-systems",
  "communication-style",
  "goals-and-priorities",
  "preferences-and-constraints",
  "domain-knowledge",
  "decision-log",
] as const;

export type PortfolioFileName = (typeof VALID_FILE_NAMES)[number];

let client: WeaviateClient;

export async function initWeaviate(): Promise<void> {
  const url = new URL(config.weaviate.url);
  client = await weaviate.connectToCustom({
    httpHost: url.hostname,
    httpPort: parseInt(url.port || "8080", 10),
    httpSecure: url.protocol === "https:",
    grpcHost: url.hostname,
    grpcPort: 50051,
    grpcSecure: url.protocol === "https:",
  });

  const exists = await client.collections.exists(COLLECTION_NAME);
  if (!exists) {
    await client.collections.create({
      name: COLLECTION_NAME,
      properties: [
        { name: "userId", dataType: "text", indexFilterable: true, indexSearchable: false },
        { name: "fileName", dataType: "text", indexFilterable: true, indexSearchable: false },
        { name: "content", dataType: "text", indexSearchable: true },
        { name: "updatedAt", dataType: "date", indexFilterable: true },
      ],
    });
    console.log(`Created Weaviate collection: ${COLLECTION_NAME}`);
  } else {
    console.log(`Weaviate collection ${COLLECTION_NAME} already exists`);
  }
}

function getCollection(): Collection {
  return client.collections.get(COLLECTION_NAME);
}

function userFileFilter(collection: Collection, userId: string, fileName: string) {
  return Filters.and(
    collection.filter.byProperty("userId").equal(userId),
    collection.filter.byProperty("fileName").equal(fileName),
  );
}

export async function upsertDocument(
  userId: string,
  fileName: string,
  content: string,
): Promise<void> {
  const collection = getCollection();

  const existing = await collection.query.fetchObjects({
    filters: userFileFilter(collection, userId, fileName),
    limit: 1,
  });

  const data = {
    userId,
    fileName,
    content,
    updatedAt: new Date().toISOString(),
  };

  if (existing.objects.length > 0) {
    await collection.data.update({
      id: existing.objects[0].uuid,
      properties: data,
    });
  } else {
    await collection.data.insert({ properties: data });
  }
}

export async function getDocument(
  userId: string,
  fileName: string,
): Promise<{ content: string; updatedAt: string } | null> {
  const collection = getCollection();
  const result = await collection.query.fetchObjects({
    filters: userFileFilter(collection, userId, fileName),
    limit: 1,
  });

  if (result.objects.length === 0) return null;

  const obj = result.objects[0];
  return {
    content: obj.properties.content as string,
    updatedAt: obj.properties.updatedAt as string,
  };
}

export async function getDocuments(
  userId: string,
  fileNames: string[],
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  await Promise.all(
    fileNames.map(async (fileName) => {
      const doc = await getDocument(userId, fileName);
      if (doc) {
        results[fileName] = doc.content;
      }
    }),
  );

  return results;
}

export async function listDocuments(
  userId: string,
): Promise<Array<{ fileName: string; updatedAt: string }>> {
  const collection = getCollection();
  const result = await collection.query.fetchObjects({
    filters: collection.filter.byProperty("userId").equal(userId),
    limit: 20,
  });

  return result.objects.map((obj) => ({
    fileName: obj.properties.fileName as string,
    updatedAt: obj.properties.updatedAt as string,
  }));
}

export async function deleteDocument(
  userId: string,
  fileName: string,
): Promise<boolean> {
  const collection = getCollection();
  const existing = await collection.query.fetchObjects({
    filters: userFileFilter(collection, userId, fileName),
    limit: 1,
  });

  if (existing.objects.length === 0) return false;

  await collection.data.deleteById(existing.objects[0].uuid);
  return true;
}

export async function searchDocuments(
  userId: string,
  query: string,
  limit: number = 5,
): Promise<Array<{ fileName: string; content: string; score: number }>> {
  const collection = getCollection();
  const result = await collection.query.nearText(query, {
    filters: collection.filter.byProperty("userId").equal(userId),
    limit,
    returnMetadata: ["distance"],
  });

  return result.objects.map((obj) => ({
    fileName: obj.properties.fileName as string,
    content: obj.properties.content as string,
    score: obj.metadata?.distance != null ? 1 - obj.metadata.distance : 0,
  }));
}
