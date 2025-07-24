/**
 * BestInSlot API Service Module
 * 
 * This module handles all interactions with the BestInSlot API, including
 * collection data, holder data, and bitmap data fetching with proper
 * error handling and rate limiting.
 * 
 * @author Michal Stefanow <michalstefanow.marek@gmail.com>
 * @version 1.0.0
 * @since 2025-01-24
 */

import { Logger } from '../utils/logger';
import { delay } from '../utils/delay';
import { ICollection, IHolder, IBitmap } from '../types';

/**
 * Global logger instance for API operations
 */
const logger = new Logger('API');

/**
 * Fetches comprehensive collection data from BestInSlot API with pagination
 * Implements robust error handling and rate limiting for reliable data retrieval
 * 
 * @async
 * @function fetchCollectionList
 * @returns {Promise<ICollection[]>} Array of all collection objects
 * @throws {Error} When API key is missing or API requests fail consistently
 */
export async function fetchCollectionList(): Promise<ICollection[]> {
  /** Array to accumulate all collection records from paginated API responses */
  const collectionList: ICollection[] = [];

  /** Current pagination offset for API requests */
  let offset = 0;

  /** Number of records to fetch per API request (optimized for API limits) */
  const count = 100;

  /** Secure API key loaded from environment variables */
  const bestinslotApiKey = process.env.BEST_IN_SLOT;

  // Validate that API key is properly configured
  if (!bestinslotApiKey) {
    throw new Error('BEST_IN_SLOT API key is required');
  }

  // Paginated data retrieval loop with automatic termination
  while (true) {
    /** Constructed API endpoint URL with pagination parameters */
    const url = `https://api.bestinslot.xyz/v3/collection/collections?sort_by=median_number&order=asc&offset=${offset}&count=${count}`;

    logger.info(`Fetching collection list from ${url}`);

    /** HTTP response from BestInSlot collections API */
    const collectionListRequest = await fetch(url, {
      headers: {
        'x-api-key': bestinslotApiKey,
      },
    });

    // Handle API request failures with detailed error logging
    if (!collectionListRequest.ok) {
      logger.error(`API request failed: ${collectionListRequest.status} ${collectionListRequest.statusText}`);
      const errorText = await collectionListRequest.text();
      logger.error(`Error response: ${errorText}`);
      break;
    }

    /** Parsed JSON response containing collection data */
    const payload = await collectionListRequest.json();

    /** Current batch of collection records from this API response */
    const tempCollectionList = payload.data;

    // Merge current batch into the main collection array
    collectionList.push(...tempCollectionList);

    // Exit loop when API returns fewer records than requested (end of data)
    if (tempCollectionList.length < count) {
      break;
    }

    // Implement rate limiting to respect API constraints
    await delay(1500);

    // Update offset for next page and log progress
    offset += count;
    logger.info(`Fetched ${offset} collections`);
  }

  logger.info(`Fetched ${collectionList.length} collections`);
  return collectionList;
}

/**
 * Fetches comprehensive bitmap holder data from BestInSlot API with pagination
 * Implements robust error handling and rate limiting for reliable data retrieval
 * 
 * @async
 * @function fetchBitmapList
 * @returns {Promise<IBitmap[]>} Array of all bitmap holder objects
 * @throws {Error} When API key is missing or API requests fail consistently
 */
export async function fetchBitmapList(): Promise<IBitmap[]> {
  /** Array to accumulate all bitmap holder records from paginated API responses */
  const bitmapList: IBitmap[] = [];

  /** Current pagination offset for API requests */
  let offset = 0;

  /** Number of records to fetch per API request (optimized for API limits) */
  const count = 100;

  /** Secure API key loaded from environment variables */
  const bestinslotApiKey = process.env.BEST_IN_SLOT;

  // Validate that API key is properly configured
  if (!bestinslotApiKey) {
    throw new Error('BEST_IN_SLOT API key is required');
  }

  // Paginated data retrieval loop with automatic termination
  while (true) {
    /** Constructed API endpoint URL for bitmap holders with pagination parameters */
    const url = `https://api.bestinslot.xyz/v3/bitmap/holders?offset=${offset}&count=${count}`;

    logger.info(`Fetching bitmap holders from ${url}`);

    /** HTTP response from BestInSlot bitmap holders API */
    const bitmapListRequest = await fetch(url, {
      headers: {
        'x-api-key': bestinslotApiKey,
      },
    });

    // Handle API request failures with detailed error logging
    if (!bitmapListRequest.ok) {
      logger.error(`API request failed: ${bitmapListRequest.status} ${bitmapListRequest.statusText}`);
      const errorText = await bitmapListRequest.text();
      logger.error(`Error response: ${errorText}`);
      break;
    }

    /** Parsed JSON response containing bitmap holder data */
    const payload = await bitmapListRequest.json();

    /** Current batch of bitmap holder records from this API response */
    const tempbitmapList = payload.data;

    // Merge current batch into the main bitmap holder array
    bitmapList.push(...tempbitmapList);

    // Exit loop when API returns fewer records than requested (end of data)
    if (tempbitmapList.length < count) {
      break;
    }

    // Implement rate limiting to respect API constraints
    await delay(1500);

    // Update offset for next page and log progress
    offset += count;
    logger.info(`Fetched ${offset} bitmap holders`);
  }

  logger.info(`Fetched ${bitmapList.length} bitmap holders`);
  return bitmapList;
}

/**
 * Fetches detailed holder information for a specific collection
 * Implements error handling and rate limiting for reliable data retrieval
 * 
 * @async
 * @function fetchHoldersPerCollection
 * @param {string} slug - Unique collection identifier for API requests
 * @returns {Promise<IHolder[]>} Array of holder objects with wallet and inscription data
 * @throws {Error} When API key is missing or collection is not found
 */
export async function fetchHoldersPerCollection(slug: string): Promise<IHolder[]> {
  /** Secure API key for BestInSlot authentication */
  const bestinslotApiKey = process.env.BEST_IN_SLOT;

  // Validate API key availability
  if (!bestinslotApiKey) {
    throw new Error('BEST_IN_SLOT API key is required');
  }

  /** Constructed API endpoint for collection-specific holder data */
  const url = `https://api.bestinslot.xyz/v3/collection/holders?slug=${slug}`;
  logger.info(`Fetching holders for collection ${slug} from ${url}`);

  /** HTTP response from BestInSlot holders API */
  const holdersRequest = await fetch(url, {
    headers: {
      'x-api-key': bestinslotApiKey,
    },
  });

  // Handle API failures gracefully without stopping the entire process
  if (!holdersRequest.ok) {
    logger.error(`API request failed: ${holdersRequest.status} ${holdersRequest.statusText}`);
    const errorText = await holdersRequest.text();
    logger.error(`Error response: ${errorText}`);
    return []; // Return empty array to continue processing other collections
  }

  /** Parsed JSON response containing holder data */
  const payload = await holdersRequest.json();

  /** Array of holder objects for this specific collection */
  const holdersList = payload.data;

  logger.info(`Fetched ${holdersList.length} holders for collection ${slug}`);

  // Implement rate limiting to prevent API throttling
  await delay(1500);

  return holdersList;
} 