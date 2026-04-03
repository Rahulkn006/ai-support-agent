import { Index } from "@upstash/vector";

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

export async function addChunksToUpstash(
  documentId: string,
  chunks: string[],
  metadata: { workspaceId: string; documentName: string }
) {
  try {
    const vectors = chunks.map((chunk, i) => ({
      id: `${documentId}-${i}`,
      data: chunk, // Upstash handles the embedding!
      metadata: {
        ...metadata,
        documentId,
        chunkIndex: i,
        content: chunk // Store content in metadata for easy retrieval
      },
    }));

    // Batch upsert (max 100 per call for efficiency, but here chunks is likely small)
    await index.upsert(vectors);
    console.log(`Successfully indexed ${chunks.length} chunks to Upstash Vector.`);
  } catch (error) {
    console.error("Upstash Indexing Error:", error);
    throw error;
  }
}

export async function searchRelevantChunks(
  query: string,
  workspaceId: string,
  limit: number = 5
) {
  try {
    const results = await index.query({
      data: query,
      topK: limit,
      includeMetadata: true,
      filter: `workspaceId = '${workspaceId}'`,
    });

    return results.map((res) => ({
      content: res.metadata?.content as string,
      metadata: res.metadata,
      score: res.score,
    }));
  } catch (error) {
    console.error("Upstash Search Error:", error);
    return [];
  }
}

export async function deleteDocumentChunks(documentId: string) {
  try {
    // Upstash Vector allows deleting by metadata filter
    // Note: This requires the index to support filtering on documentId
    // If not, we'd need to fetch IDs first or use a naming convention.
    // However, we can also delete by prefix if IDs are like `${documentId}-${i}`
    // But easiest is to use the `delete` with direct IDs if we know them.
    // For now, let's use a simpler approach: if we don't have the count, 
    // we can try deleting a reasonable range or use the filter if supported.
    
    // Most robust way in Upstash with current SDK:
    // We don't have a 'deleteByMetadata' directly in the Index class easily without searching first.
    // So let's search for all chunks with this documentId first.
    
    const results = await index.query({
      data: "", // empty query for filtering
      topK: 1000,
      filter: `documentId = '${documentId}'`,
      includeMetadata: false
    });
    
    const ids = results.map(r => String(r.id));
    if (ids.length > 0) {
      await index.delete(ids);
      console.log(`Deleted ${ids.length} chunks from Upstash for document: ${documentId}`);
    }
  } catch (error) {
    console.error("Upstash Deletion Error:", error);
  }
}
