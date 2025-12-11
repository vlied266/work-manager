/**
 * Helper functions to fetch collections and records for statistics
 */

export interface CollectionStats {
  totalCollections: number;
  totalRecords: number;
  recordsByCollection: Record<string, number>;
}

export async function fetchCollectionsStats(orgId: string): Promise<CollectionStats> {
  try {
    // Fetch collections
    const collectionsResponse = await fetch(`/api/data/collections?orgId=${orgId}`);
    if (!collectionsResponse.ok) {
      return { totalCollections: 0, totalRecords: 0, recordsByCollection: {} };
    }
    const collectionsData = await collectionsResponse.json();
    const collections = collectionsData.collections || [];

    // Fetch records for each collection
    let totalRecords = 0;
    const recordsByCollection: Record<string, number> = {};

    for (const collection of collections) {
      try {
        const recordsResponse = await fetch(`/api/data/records?collectionId=${collection.id}`);
        if (recordsResponse.ok) {
          const recordsData = await recordsResponse.json();
          const recordCount = recordsData.records?.length || 0;
          recordsByCollection[collection.id] = recordCount;
          totalRecords += recordCount;
        }
      } catch (error) {
        console.error(`Error fetching records for collection ${collection.id}:`, error);
      }
    }

    return {
      totalCollections: collections.length,
      totalRecords,
      recordsByCollection,
    };
  } catch (error) {
    console.error("Error fetching collections stats:", error);
    return { totalCollections: 0, totalRecords: 0, recordsByCollection: {} };
  }
}

