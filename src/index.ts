import 'dotenv/config';
import { Logger } from './utils/logger';
import { ICollection, IHolder} from './types';
import { delay } from './utils/delay';
import fs from 'fs/promises';
import path from 'path';

const logger = new Logger('Main');

async function main(): Promise<void> {
  logger.info('Starting TypeScript application...');

  // await fetchCollectionList();
  // await summarizeHolders();
  await filterHolders();
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

async function summarizeHolders() {
  const holdersSummary: Record<string, string[]> = {};

  // Load collections from JSON file
  const collectionsPath = path.join(process.cwd(), 'data', 'collections.json');
  const collectionsData = await fs.readFile(collectionsPath, 'utf-8');
  const collections: ICollection[] = JSON.parse(collectionsData);

  logger.info(`Summarizing holders for ${collections.length} collections`);

  let index = 0;

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
    index++;
    if(index > 30) {
      break;
    }
  }

  // Save holders summary to JSON file
  await saveHoldersSummaryToFile(holdersSummary);
  return holdersSummary;
}

async function filterHolders(): Promise<void> {
  const filteredHoldersSummary: Record<string, string[]> = {};

  // Load holders summary from JSON file
  const holdersSummaryPath = path.join(process.cwd(), 'data', 'holderSummary.json');
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
    const filename = `filteredHolderSummary-${timestamp}.json`;
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
