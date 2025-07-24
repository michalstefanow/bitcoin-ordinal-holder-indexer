/**
 * Data Processor Service Module
 * 
 * This module handles all data analysis, processing, and aggregation logic
 * including holder summarization, filtering, and cross-collection analysis.
 * 
 * @author Michal Stefanow <michalstefanow.marek@gmail.com>
 * @version 1.0.0
 * @since 2025-01-24
 */

import { Logger } from '../utils/logger';
import { ICollection, IHolder, IBitmap } from '../types';
import { fetchHoldersPerCollection } from './api';
import { 
  getLatestCollectionsFile, 
  getLatestBitmapListFile, 
  getLatestHoldersSummaryFile,
  saveHoldersSummaryToFile,
  saveFilteredHoldersSummaryToFile
} from './fileManager';
import fs from 'fs/promises';

/**
 * Global logger instance for data processing operations
 */
const logger = new Logger('DataProcessor');

/**
 * Analyzes holder patterns across all collections and creates cross-collection mapping
 * Aggregates inscription ownership data to identify multi-collection holders
 * 
 * @async
 * @function summarizeHolders
 * @returns {Promise<Record<string, string[]>>} Wallet-to-inscriptions mapping object
 * @throws {Error} When collections file is not found or API requests fail
 */
export async function summarizeHolders(): Promise<Record<string, string[]>> {
  /** 
   * Cross-collection holder summary mapping wallet addresses to inscription IDs
   * Structure: { "wallet_address": ["inscription_id1", "inscription_id2", ...] }
   */
  const holdersSummary: Record<string, string[]> = {};

  // Load collection data from the most recent collections file
  /** File path to the latest collections data file */
  const collectionsPath = await getLatestCollectionsFile();
  const bitmapListPath = await getLatestBitmapListFile();

  /** Raw file content containing collection data in JSON format */
  const collectionsData = await fs.readFile(collectionsPath, 'utf-8');
  const bitmapListData = await fs.readFile(bitmapListPath, 'utf-8');

  /** Parsed array of collection objects for processing */
  const collections: ICollection[] = JSON.parse(collectionsData);
  const bitmapList: IBitmap[] = JSON.parse(bitmapListData);

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

  // Process bitmap data and merge with existing holder summary
  logger.info(`Processing ${bitmapList.length} bitmap holders`);
  
  bitmapList.forEach((bitmap) => {
    // Validate that inscription_ids is an array to prevent stack overflow
    if (!Array.isArray(bitmap.inscription_ids)) {
      logger.warn(`Invalid inscription_ids for wallet ${bitmap.wallet}: not an array`);
      return;
    }

    // Initialize wallet entry if this is the first time seeing this wallet
    if (!holdersSummary[bitmap.wallet]) {
      holdersSummary[bitmap.wallet] = [];
      logger.debug(`New wallet found: ${bitmap.wallet} with ${bitmap.inscription_ids.length} bitmaps`);
    } else {
      // Log when we find cross-collection holders (valuable insight)
      logger.info(`Holder ${bitmap.wallet} already exists`);
      logger.info(`✅ Adding ${bitmap.inscription_ids.length} bitmaps to ${bitmap.wallet}`);
    }

    // Safely aggregate bitmap inscription IDs for this wallet
    // Use Set to avoid duplicates and prevent stack overflow
    const existingIds = new Set(holdersSummary[bitmap.wallet] || []);
    bitmap.inscription_ids.forEach(id => {
      if (typeof id === 'string' && id.trim() !== '') {
        existingIds.add(id);
      }
    });
    
    // Update the holder summary with deduplicated inscription IDs
    holdersSummary[bitmap.wallet] = Array.from(existingIds);
  });

  // Persist aggregated holder data for subsequent analysis
  await saveHoldersSummaryToFile(holdersSummary);
  return holdersSummary;
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
export async function filterHolders(): Promise<void> {
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
    if (inscriptions && inscriptions.length >= 10) {
      filteredHoldersSummary[wallet] = inscriptions;
    }
  }

  // Persist filtered results for investment analysis
  await saveFilteredHoldersSummaryToFile(filteredHoldersSummary);
}

/**
 * Loads and merges existing holder summary data with new bitmap data
 * Alternative approach that loads existing data instead of re-processing collections
 * 
 * @async
 * @function mergeWithExistingData
 * @returns {Promise<Record<string, string[]>>} Merged wallet-to-inscriptions mapping
 * @throws {Error} When files are not found or processing fails
 */
export async function mergeWithExistingData(): Promise<Record<string, string[]>> {
  // Load existing holder summary data instead of processing collections again
  const holdersSummaryPath = await getLatestHoldersSummaryFile();

  /** Raw file content containing aggregated holder data */
  const holdersSummaryData = await fs.readFile(holdersSummaryPath, 'utf-8');

  /** Parsed holder summary object for processing */
  const holdersSummary: Record<string, string[]> = JSON.parse(holdersSummaryData);

  // Load bitmap data
  const bitmapListPath = await getLatestBitmapListFile();
  const bitmapListData = await fs.readFile(bitmapListPath, 'utf-8');
  const bitmapList: IBitmap[] = JSON.parse(bitmapListData);

  // Process bitmap data and merge with existing holder summary
  logger.info(`Processing ${bitmapList.length} bitmap holders`);
  
  bitmapList.forEach((bitmap) => {
    // Validate that inscription_ids is an array to prevent stack overflow
    if (!Array.isArray(bitmap.inscription_ids)) {
      logger.warn(`Invalid inscription_ids for wallet ${bitmap.wallet}: not an array`);
      return;
    }

    // Initialize wallet entry if this is the first time seeing this wallet
    if (!holdersSummary[bitmap.wallet]) {
      holdersSummary[bitmap.wallet] = [];
      logger.debug(`New wallet found: ${bitmap.wallet} with ${bitmap.inscription_ids.length} bitmaps`);
    } else {
      // Log when we find cross-collection holders (valuable insight)
      logger.info(`Holder ${bitmap.wallet} already exists`);
      logger.info(`✅ Adding ${bitmap.inscription_ids.length} bitmaps to ${bitmap.wallet}`);
    }

    // Safely aggregate bitmap inscription IDs for this wallet
    // Use Set to avoid duplicates and prevent stack overflow
    const existingIds = new Set(holdersSummary[bitmap.wallet] || []);
    bitmap.inscription_ids.forEach(id => {
      if (typeof id === 'string' && id.trim() !== '') {
        existingIds.add(id);
      }
    });
    
    // Update the holder summary with deduplicated inscription IDs
    holdersSummary[bitmap.wallet] = Array.from(existingIds);
  });

  // Persist aggregated holder data for subsequent analysis
  await saveHoldersSummaryToFile(holdersSummary);
  return holdersSummary;
} 