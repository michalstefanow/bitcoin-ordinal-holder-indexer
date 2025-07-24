import 'dotenv/config';
import { Logger } from './utils/logger';
import { ICollection, IHolder} from './types';
import { delay } from './utils/delay';
import fs from 'fs/promises';
import path from 'path';

const logger = new Logger('Main');

async function main(): Promise<void> {
  logger.info('Starting TypeScript application...');

  await fetchCollectionList();
  logger.info('Collection list fetched');
  await summarizeHolders();
  logger.info('Holders summarized');
  await filterHolders();
  logger.info('Holders filtered');
}

async function fetchCollectionList(): Promise<void> {
  const collectionList: ICollection[] = [];
  let offset = 0;
  const count = 100;
  const bestinslotApiKey = process.env.BEST_IN_SLOT;

  if (!bestinslotApiKey) {
    throw new Error('BEST_IN_SLOT API key is required');
  }

  while(true) {
    const url = `https://api.bestinslot.xyz/v3/collection/collections?sort_by=median_number&order=asc&offset=${offset}&count=${count}`;
    logger.info(`Fetching collection list from ${url}`);
    const collectionListRequest = await fetch(url, {
      headers: {
        'x-api-key': bestinslotApiKey,
      },
    });

    if (!collectionListRequest.ok) {
      logger.error(`API request failed: ${collectionListRequest.status} ${collectionListRequest.statusText}`);
      const errorText = await collectionListRequest.text();
      logger.error(`Error response: ${errorText}`);
      break;
    }

    const payload = await collectionListRequest.json();
    const tempCollectionList = payload.data;
    collectionList.push(...tempCollectionList);

    if (tempCollectionList.length < count) {
      break;
    }
    await delay(1500);
    offset += count;
    logger.info(`Fetched ${offset} collections`);
  }

  logger.info(`Fetched ${collectionList.length} collections`);

  // Save to JSON file with timestamp
  await saveCollectionsToFile(collectionList);
}

async function summarizeHolders() {
  const holdersSummary: Record<string, string[]> = {};

  // Load collections from latest JSON file
  const collectionsPath = await getLatestCollectionsFile();
  const collectionsData = await fs.readFile(collectionsPath, 'utf-8');
  const collections: ICollection[] = JSON.parse(collectionsData);

  logger.info(`Summarizing holders for ${collections.length} collections`);

  for (const collection of collections) {
    const holders = await fetchHoldersPerCollection(collection.slug);
    holders.forEach((holder) => {
      if (!holdersSummary[holder.wallet]) {
        holdersSummary[holder.wallet] = [];
      } else {
        logger.info(`Holder ${holder.wallet} already exists`);
        logger.info(`✅ More ${holder.inscription_ids.length} is added to ${holder.wallet}`);
      }
      holdersSummary[holder.wallet]!.push(...holder.inscription_ids);
    });
  }

  // Save holders summary to JSON file
  await saveHoldersSummaryToFile(holdersSummary);
  return holdersSummary;
}

async function fetchHoldersPerCollection(slug: string): Promise<IHolder[]> {
  const bestinslotApiKey = process.env.BEST_IN_SLOT;
  
  if (!bestinslotApiKey) {
    throw new Error('BEST_IN_SLOT API key is required');
  }
  
  const url = `https://api.bestinslot.xyz/v3/collection/holders?slug=${slug}`;
  logger.info(`Fetching holders for collection ${slug} from ${url}`);

  const holdersRequest = await fetch(url, {
    headers: {
      'x-api-key': bestinslotApiKey,
    },
  });

  if (!holdersRequest.ok) {
    logger.error(`API request failed: ${holdersRequest.status} ${holdersRequest.statusText}`);
    const errorText = await holdersRequest.text();
    logger.error(`Error response: ${errorText}`);
    return [];
  }

  const payload = await holdersRequest.json();
  const holdersList = payload.data;
  logger.info(`Fetched ${holdersList.length} holders for collection ${slug}`);
  await delay(1500);

  return holdersList;
}

async function getLatestCollectionsFile(): Promise<string> {
  const dataDir = path.join(process.cwd(), 'data');
  
  try {
    const files = await fs.readdir(dataDir);
    const collectionsFiles = files
      .filter(file => file.startsWith('collections-') && file.endsWith('.json'))
      .sort()
      .reverse(); // Sort descending to get latest first
    
    if (collectionsFiles.length === 0) {
      throw new Error('No collections files found in data directory');
    }
    
    const latestFile = collectionsFiles[0]!; // Non-null assertion since we checked length
    logger.info(`Using latest collections file: ${latestFile}`);
    return path.join(dataDir, latestFile);
  } catch (error) {
    logger.error('Error finding collections files:', error);
    throw error;
  }
}

async function getLatestHoldersSummaryFile(): Promise<string> {
  const dataDir = path.join(process.cwd(), 'data');
  
  try {
    const files = await fs.readdir(dataDir);
    const holdersSummaryFiles = files
      .filter(file => file.startsWith('holderSummary-') && file.endsWith('.json'))
      .sort()
      .reverse(); // Sort descending to get latest first
    
    if (holdersSummaryFiles.length === 0) {
      throw new Error('No holderSummary files found in data directory');
    }
    
    const latestFile = holdersSummaryFiles[0]!; // Non-null assertion since we checked length
    logger.info(`Using latest holderSummary file: ${latestFile}`);
    return path.join(dataDir, latestFile);
  } catch (error) {
    logger.error('Error finding holderSummary files:', error);
    throw error;
  }
}

async function filterHolders(): Promise<void> {
  const filteredHoldersSummary: Record<string, string[]> = {};

  // Load holders summary from latest JSON file
  const holdersSummaryPath = await getLatestHoldersSummaryFile();
  const holdersSummaryData = await fs.readFile(holdersSummaryPath, 'utf-8');
  const holdersSummary: Record<string, string[]> = JSON.parse(holdersSummaryData);
  
  logger.info(`Filtering holders for ${holdersSummary.length} holders`);

  for (const wallet in holdersSummary) {
    const inscriptions = holdersSummary[wallet];
    if(inscriptions && inscriptions.length > 10) {
      filteredHoldersSummary[wallet] = inscriptions;
    }
  }

  await saveFilteredHoldersSummaryToFile(filteredHoldersSummary);
}

async function saveCollectionsToFile(collections: ICollection[]): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `collections-${timestamp}.json`;
    const filePath = path.join(process.cwd(), 'data', filename);

    // Create data directory if it doesn't exist
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Save collections to file
    await fs.writeFile(filePath, JSON.stringify(collections, null, 2));

    logger.info(`Collections saved to: ${filePath}`);
    logger.info(`Total collections saved: ${collections.length}`);
  } catch (error) {
    logger.error('Failed to save collections to file:', error);
  }
}

async function saveHoldersSummaryToFile(holdersSummary: Record<string, string[]>): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `holderSummary-${timestamp}.json`;
    const filePath = path.join(process.cwd(), 'data', filename);
    
    // Create data directory if it doesn't exist
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Save holders summary to file
    await fs.writeFile(filePath, JSON.stringify(holdersSummary, null, 2));
    
    logger.info(`Holders summary saved to: ${filePath}`);
    logger.info(`Total unique holders: ${Object.keys(holdersSummary).length}`);
  } catch (error) {
    logger.error('Failed to save holders summary to file:', error);
  }
}

async function saveFilteredHoldersSummaryToFile(filteredHoldersSummary: Record<string, string[]>): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `FinalResult-${timestamp}.json`;
    const filePath = path.join(process.cwd(), 'data', filename);
    
    // Create data directory if it doesn't exist
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Save holders summary to file
    await fs.writeFile(filePath, JSON.stringify(filteredHoldersSummary, null, 2));
    
    logger.info(`Filtered holders summary saved to: ${filePath}`);
    logger.info(`Total unique holders: ${Object.keys(filteredHoldersSummary).length}`);
  } catch (error) {
    logger.error('Failed to save filtered holders summary to file:', error);
  }
}

// Run the application
main().catch((error) => {
  logger.error('Application failed:', error);
  process.exit(1);
});
