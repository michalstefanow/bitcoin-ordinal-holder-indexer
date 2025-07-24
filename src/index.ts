/**
 * Bitcoin Inscription Holder Analyzer - Main Application Entry Point
 * 
 * This application analyzes Bitcoin inscription holders across collections using the BestInSlot API.
 * It performs a comprehensive three-stage data processing pipeline:
 * 1. Collection Data Fetching - Retrieves all inscription collections
 * 2. Holder Analysis - Fetches and aggregates holder information across collections
 * 3. Strategic Filtering - Identifies high-value holders based on configurable criteria
 * 
 * @author Michal Stefanow <michalstefanow.marek@gmail.com>
 * @version 1.0.0
 * @since 2025-01-24
 */

// Load environment variables from .env file for secure API key management
import 'dotenv/config';

// Import custom utilities and type definitions
import { Logger } from './utils/logger';
import { ICollection, IHolder} from './types';
import { delay } from './utils/delay';

// Import Node.js built-in modules for file system operations
import fs from 'fs/promises';
import path from 'path';

/**
 * Global logger instance for the main application context
 * Provides structured logging throughout the application lifecycle
 */
const logger = new Logger('Main');

/**
 * Main application orchestrator function
 * Executes the complete three-stage analysis pipeline in sequence
 * 
 * @async
 * @function main
 * @returns {Promise<void>} Resolves when all analysis stages complete successfully
 * @throws {Error} Propagates errors from any stage of the pipeline
 */
async function main(): Promise<void> {
  logger.info('Starting TypeScript application...');

  // Stage 1: Fetch all inscription collections from BestInSlot API
  await fetchCollectionList();
  logger.info('Collection list fetched');
  
  // Stage 2: Analyze holders across all collections and aggregate data
  await summarizeHolders();
  logger.info('Holders summarized');
  
  // Stage 3: Filter holders based on inscription count threshold
  await filterHolders();
  logger.info('Holders filtered');
}

/**
 * Fetches comprehensive collection data from BestInSlot API with pagination
 * Implements robust error handling and rate limiting for reliable data retrieval
 * 
 * @async
 * @function fetchCollectionList
 * @returns {Promise<void>} Resolves when all collections are fetched and saved
 * @throws {Error} When API key is missing or API requests fail consistently
 */
async function fetchCollectionList(): Promise<void> {
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
  while(true) {
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

  // Persist collected data to timestamped JSON file
  await saveCollectionsToFile(collectionList);
}

/**
 * Analyzes holder patterns across all collections and creates cross-collection mapping
 * Aggregates inscription ownership data to identify multi-collection holders
 * 
 * @async
 * @function summarizeHolders
 * @returns {Promise<Record<string, string[]>>} Wallet-to-inscriptions mapping object
 * @throws {Error} When collections file is not found or API requests fail
 */
async function summarizeHolders() {
  /** 
   * Cross-collection holder summary mapping wallet addresses to inscription IDs
   * Structure: { "wallet_address": ["inscription_id1", "inscription_id2", ...] }
   */
  const holdersSummary: Record<string, string[]> = {};

  // Load collection data from the most recent collections file
  /** File path to the latest collections data file */
  const collectionsPath = await getLatestCollectionsFile();
  
  /** Raw file content containing collection data in JSON format */
  const collectionsData = await fs.readFile(collectionsPath, 'utf-8');
  
  /** Parsed array of collection objects for processing */
  const collections: ICollection[] = JSON.parse(collectionsData);

  logger.info(`Summarizing holders for ${collections.length} collections`);

  // Process each collection to fetch and aggregate holder data
  for (const collection of collections) {
    /** Array of holder records for the current collection */
    const holders = await fetchHoldersPerCollection(collection.slug);
    
    // Process each holder in the current collection
    holders.forEach((holder) => {
      // Initialize wallet entry if this is the first time seeing this wallet
      if (!holdersSummary[holder.wallet]) {
        holdersSummary[holder.wallet] = [];
      } else {
        // Log when we find cross-collection holders (valuable insight)
        logger.info(`Holder ${holder.wallet} already exists`);
        logger.info(`✅ More ${holder.inscription_ids.length} is added to ${holder.wallet}`);
      }
      
      // Aggregate inscription IDs for this wallet across collections
      holdersSummary[holder.wallet]!.push(...holder.inscription_ids);
    });
  }

  // Persist aggregated holder data for subsequent analysis
  await saveHoldersSummaryToFile(holdersSummary);
  return holdersSummary;
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
async function fetchHoldersPerCollection(slug: string): Promise<IHolder[]> {
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

/**
 * Automatically discovers and returns the path to the most recent collections file
 * Implements intelligent file selection based on timestamp-based naming convention
 * 
 * @async
 * @function getLatestCollectionsFile
 * @returns {Promise<string>} Absolute file path to the latest collections data file
 * @throws {Error} When no collections files are found in the data directory
 */
async function getLatestCollectionsFile(): Promise<string> {
  /** Absolute path to the data directory containing generated files */
  const dataDir = path.join(process.cwd(), 'data');
  
  try {
    /** Array of all files in the data directory */
    const files = await fs.readdir(dataDir);
    
    /** 
     * Filtered and sorted array of collections files
     * Sorted in descending order to get the most recent file first
     */
    const collectionsFiles = files
      .filter(file => file.startsWith('collections-') && file.endsWith('.json'))
      .sort()
      .reverse(); // Sort descending by filename (which includes timestamp)
    
    // Validate that collections files exist
    if (collectionsFiles.length === 0) {
      throw new Error('No collections files found in data directory');
    }
    
    /** The most recently created collections file */
    const latestFile = collectionsFiles[0]!; // Non-null assertion since we validated length
    
    logger.info(`Using latest collections file: ${latestFile}`);
    return path.join(dataDir, latestFile);
  } catch (error) {
    logger.error('Error finding collections files:', error);
    throw error;
  }
}

/**
 * Automatically discovers and returns the path to the most recent holder summary file
 * Enables automated processing of the latest aggregated holder data
 * 
 * @async
 * @function getLatestHoldersSummaryFile
 * @returns {Promise<string>} Absolute file path to the latest holder summary file
 * @throws {Error} When no holder summary files are found in the data directory
 */
async function getLatestHoldersSummaryFile(): Promise<string> {
  /** Absolute path to the data directory containing generated files */
  const dataDir = path.join(process.cwd(), 'data');
  
  try {
    /** Array of all files in the data directory */
    const files = await fs.readdir(dataDir);
    
    /** 
     * Filtered and sorted array of holder summary files
     * Sorted in descending order to get the most recent file first
     */
    const holdersSummaryFiles = files
      .filter(file => file.startsWith('holderSummary-') && file.endsWith('.json'))
      .sort()
      .reverse(); // Sort descending by filename timestamp
    
    // Validate that holder summary files exist
    if (holdersSummaryFiles.length === 0) {
      throw new Error('No holderSummary files found in data directory');
    }
    
    /** The most recently created holder summary file */
    const latestFile = holdersSummaryFiles[0]!; // Non-null assertion since we validated length
    
    logger.info(`Using latest holderSummary file: ${latestFile}`);
    return path.join(dataDir, latestFile);
  } catch (error) {
    logger.error('Error finding holderSummary files:', error);
    throw error;
  }
}

/**
 * Applies strategic filtering criteria to identify high-value inscription holders
 * Generates investment-ready data by filtering based on configurable thresholds
 * 
 * @async
 * @function filterHolders
 * @returns {Promise<void>} Resolves when filtered data is successfully saved
 * @throws {Error} When holder summary file is not found or file operations fail
 */
async function filterHolders(): Promise<void> {
  /** 
   * Filtered holder summary containing only wallets meeting the threshold criteria
   * Structure mirrors the input but contains only qualified holders
   */
  const filteredHoldersSummary: Record<string, string[]> = {};

  // Load the most recent holder summary data for filtering
  /** File path to the latest holder summary data */
  const holdersSummaryPath = await getLatestHoldersSummaryFile();
  
  /** Raw file content containing aggregated holder data */
  const holdersSummaryData = await fs.readFile(holdersSummaryPath, 'utf-8');
  
  /** Parsed holder summary object for processing */
  const holdersSummary: Record<string, string[]> = JSON.parse(holdersSummaryData);
  
  logger.info(`Filtering holders for ${Object.keys(holdersSummary).length} holders`);

  // Apply filtering criteria to identify significant holders
  for (const wallet in holdersSummary) {
    /** Array of inscription IDs owned by the current wallet */
    const inscriptions = holdersSummary[wallet];
    
    // Filter based on inscription count threshold (configurable criteria)
    if(inscriptions && inscriptions.length > 10) {
      filteredHoldersSummary[wallet] = inscriptions;
    }
  }

  // Persist filtered results for investment analysis
  await saveFilteredHoldersSummaryToFile(filteredHoldersSummary);
}

/**
 * Persists collection data to a timestamped JSON file for future analysis
 * Creates organized data storage with automatic directory management
 * 
 * @async
 * @function saveCollectionsToFile
 * @param {ICollection[]} collections - Array of collection objects to save
 * @returns {Promise<void>} Resolves when file is successfully written
 * @throws {Error} When file system operations fail
 */
async function saveCollectionsToFile(collections: ICollection[]): Promise<void> {
  try {
    /** ISO timestamp formatted for use in filenames (replacing invalid characters) */
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    /** Descriptive filename with timestamp for easy identification */
    const filename = `collections-${timestamp}.json`;
    
    /** Absolute path where the collections file will be saved */
    const filePath = path.join(process.cwd(), 'data', filename);

    // Ensure data directory exists (create if necessary)
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write collections data to file with pretty formatting for readability
    await fs.writeFile(filePath, JSON.stringify(collections, null, 2));

    // Log success metrics for monitoring and debugging
    logger.info(`Collections saved to: ${filePath}`);
    logger.info(`Total collections saved: ${collections.length}`);
  } catch (error) {
    logger.error('Failed to save collections to file:', error);
  }
}

/**
 * Persists holder summary data to a timestamped JSON file for analysis and filtering
 * Enables tracking of cross-collection holder patterns over time
 * 
 * @async
 * @function saveHoldersSummaryToFile
 * @param {Record<string, string[]>} holdersSummary - Wallet-to-inscriptions mapping
 * @returns {Promise<void>} Resolves when file is successfully written
 * @throws {Error} When file system operations fail
 */
async function saveHoldersSummaryToFile(holdersSummary: Record<string, string[]>): Promise<void> {
  try {
    /** ISO timestamp formatted for use in filenames */
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    /** Descriptive filename identifying this as aggregated holder data */
    const filename = `holderSummary-${timestamp}.json`;
    
    /** Absolute path where the holder summary will be saved */
    const filePath = path.join(process.cwd(), 'data', filename);
    
    // Ensure data directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Write holder summary with formatting for human readability
    await fs.writeFile(filePath, JSON.stringify(holdersSummary, null, 2));
    
    // Log metrics for monitoring and analysis validation
    logger.info(`Holders summary saved to: ${filePath}`);
    logger.info(`Total unique holders: ${Object.keys(holdersSummary).length}`);
  } catch (error) {
    logger.error('Failed to save holders summary to file:', error);
  }
}

/**
 * Persists filtered holder data as the final analysis result for investment research
 * Generates the primary output file for external analysis and decision-making
 * 
 * @async
 * @function saveFilteredHoldersSummaryToFile
 * @param {Record<string, string[]>} filteredHoldersSummary - Qualified holders meeting criteria
 * @returns {Promise<void>} Resolves when final results are successfully saved
 * @throws {Error} When file system operations fail
 */
async function saveFilteredHoldersSummaryToFile(filteredHoldersSummary: Record<string, string[]>): Promise<void> {
  try {
    /** ISO timestamp for final results file identification */
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    /** Final results filename indicating this is the primary analysis output */
    const filename = `FinalResult-${timestamp}.json`;
    
    /** Absolute path for the final analysis results file */
    const filePath = path.join(process.cwd(), 'data', filename);
    
    // Ensure data directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Write final filtered results with formatting
    await fs.writeFile(filePath, JSON.stringify(filteredHoldersSummary, null, 2));
    
    // Log final analysis metrics for validation and monitoring
    logger.info(`Filtered holders summary saved to: ${filePath}`);
    logger.info(`Total qualified holders: ${Object.keys(filteredHoldersSummary).length}`);
  } catch (error) {
    logger.error('Failed to save filtered holders summary to file:', error);
  }
}

/**
 * Application entry point with comprehensive error handling
 * Ensures graceful shutdown and proper error reporting for debugging
 */
main().catch((error) => {
  logger.error('Application failed:', error);
  process.exit(1);
});
