/**
 * File Manager Service Module
 * 
 * This module handles all file system operations including reading, writing,
 * and managing chunked files with automatic merging capabilities.
 * 
 * @author Michal Stefanow <michalstefanow.marek@gmail.com>
 * @version 1.0.0
 * @since 2025-01-24
 */

import { Logger } from '../utils/logger';
import { ICollection, IBitmap } from '../types';
import fs from 'fs/promises';
import path from 'path';

/**
 * Global logger instance for file operations
 */
const logger = new Logger('FileManager');

/**
 * Safely serializes large objects to JSON with circular reference detection
 * Implements robust error handling for extremely large data structures
 * 
 * @function safeStringify
 * @param {any} obj - Object to serialize
 * @param {number} [space=2] - Number of spaces for indentation
 * @returns {string} JSON string representation
 * @throws {Error} When serialization fails due to size or circular references
 */
function safeStringify(obj: any, space: number = 2): string {
  try {
    // First attempt: standard JSON.stringify
    return JSON.stringify(obj, null, space);
  } catch (error) {
    logger.warn('Standard JSON.stringify failed, attempting with circular reference handling');
    
    try {
      // Second attempt: with circular reference detection
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return value;
      }, space);
    } catch (secondError) {
      logger.error('Circular reference handling failed:', secondError);
      
      // Third attempt: stream-based approach for extremely large objects
      try {
        const chunks: string[] = [];
        const processObject = (obj: any, depth: number = 0): void => {
          if (depth > 10) {
            chunks.push('"[Max Depth Reached]"');
            return;
          }
          
          if (Array.isArray(obj)) {
            chunks.push('[');
            obj.forEach((item, index) => {
              if (index > 0) chunks.push(',');
              processObject(item, depth + 1);
            });
            chunks.push(']');
          } else if (obj && typeof obj === 'object') {
            chunks.push('{');
            const keys = Object.keys(obj);
            keys.forEach((key, index) => {
              if (index > 0) chunks.push(',');
              chunks.push(`"${key}":`);
              processObject(obj[key], depth + 1);
            });
            chunks.push('}');
          } else {
            chunks.push(JSON.stringify(obj));
          }
        };
        
        processObject(obj);
        return chunks.join('');
      } catch (thirdError) {
        logger.error('All serialization methods failed:', thirdError);
        throw new Error(`Failed to serialize object: ${thirdError instanceof Error ? thirdError.message : 'Unknown error'}`);
      }
    }
  }
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
export async function getLatestCollectionsFile(): Promise<string> {
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
 * Automatically discovers and returns the path to the most recent bitmap list file
 * Enables automated processing of the latest bitmap holder data
 * 
 * @async
 * @function getLatestBitmapListFile
 * @returns {Promise<string>} Absolute file path to the latest bitmap list file
 * @throws {Error} When no bitmap list files are found in the data directory
 */
export async function getLatestBitmapListFile(): Promise<string> {
  /** Absolute path to the data directory containing generated files */
  const dataDir = path.join(process.cwd(), 'data');

  try {
    /** Array of all files in the data directory */
    const files = await fs.readdir(dataDir);

    /** 
     * Filtered and sorted array of bitmap list files
     * Sorted in descending order to get the most recent file first
     */
    const bitmapListFiles = files
      .filter(file => file.startsWith('bitmapList-') && file.endsWith('.json'))
      .sort()
      .reverse(); // Sort descending by filename (which includes timestamp)

    // Validate that bitmap list files exist
    if (bitmapListFiles.length === 0) {
      throw new Error('No bitmapList files found in data directory');
    }

    /** The most recently created bitmap list file */
    const latestFile = bitmapListFiles[0]!; // Non-null assertion since we validated length

    logger.info(`Using latest bitmapList file: ${latestFile}`);
    return path.join(dataDir, latestFile);
  } catch (error) {
    logger.error('Error finding bitmapList files:', error);
    throw error;
  }
}

/**
 * Automatically discovers and returns the path to the most recent holder summary file
 * Enables automated processing of the latest aggregated holder data
 * Handles both single files and chunked files by merging multiple chunks
 * 
 * @async
 * @function getLatestHoldersSummaryFile
 * @returns {Promise<string>} Absolute file path to the latest holder summary file (or merged chunks)
 * @throws {Error} When no holder summary files are found in the data directory
 */
export async function getLatestHoldersSummaryFile(): Promise<string> {
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

    // Check if this is a chunked file (contains 'chunk' in filename)
    if (latestFile.includes('chunk')) {
      logger.info(`Detected chunked holder summary files, merging chunks...`);
      
      // Find all chunks for this timestamp
      const timestamp = latestFile.split('-chunk')[0]; // Extract timestamp part
      if (!timestamp) {
        throw new Error('Invalid chunk filename format');
      }
      const chunkFiles = files
        .filter(file => file.startsWith(timestamp) && file.includes('chunk'))
        .sort((a, b) => {
          // Sort by chunk number
          const chunkA = parseInt(a.split('chunk')[1]?.split('.')[0] || '0');
          const chunkB = parseInt(b.split('chunk')[1]?.split('.')[0] || '0');
          return chunkA - chunkB;
        });

      logger.info(`Found ${chunkFiles.length} chunk files to merge`);

      // Merge all chunks into a single dataset
      const mergedData: Record<string, string[]> = {};
      let totalWallets = 0;
      let totalInscriptions = 0;

      for (const chunkFile of chunkFiles) {
        const chunkPath = path.join(dataDir, chunkFile!);
        const chunkData = await fs.readFile(chunkPath, 'utf-8');
        const chunk: Record<string, string[]> = JSON.parse(chunkData);
        
        // Merge chunk data into main dataset
        for (const [wallet, inscriptions] of Object.entries(chunk)) {
          if (inscriptions && Array.isArray(inscriptions)) {
            mergedData[wallet] = inscriptions;
            totalInscriptions += inscriptions.length;
          }
        }
        totalWallets += Object.keys(chunk).length;
        
        logger.info(`Merged chunk ${chunkFile}: ${Object.keys(chunk).length} wallets, ${Object.values(chunk).reduce((sum, inscriptions) => sum + (inscriptions?.length || 0), 0)} inscriptions`);
      }

      // Create a merged file with the original timestamp
      const mergedFilename = `${timestamp}.json`;
      const mergedFilePath = path.join(dataDir, mergedFilename);
      
      // Save merged data
      const jsonContent = safeStringify(mergedData);
      await fs.writeFile(mergedFilePath, jsonContent);
      
      logger.info(`Merged ${chunkFiles.length} chunks into ${mergedFilename}: ${totalWallets} wallets, ${totalInscriptions} inscriptions`);
      logger.info(`Using merged holderSummary file: ${mergedFilename}`);
      
      return mergedFilePath;
    } else {
      // Single file case (no chunks)
      logger.info(`Using latest holderSummary file: ${latestFile}`);
      return path.join(dataDir, latestFile);
    }
  } catch (error) {
    logger.error('Error finding holderSummary files:', error);
    throw error;
  }
}

/**
 * Analyzes the most recent final result file and returns the count of qualified holders
 * Provides metrics on the effectiveness of the filtering criteria
 * 
 * @async
 * @function getLatestFinalResultFile
 * @returns {Promise<number>} Number of qualified holders in the latest final result
 * @throws {Error} When no final result files are found in the data directory
 */
export async function getLatestFinalResultFile(): Promise<number> {
  /** Absolute path to the data directory containing generated files */
  const dataDir = path.join(process.cwd(), 'data');

  try {
    /** Array of all files in the data directory */
    const files = await fs.readdir(dataDir);

    /** 
     * Filtered and sorted array of final result files
     * Sorted in descending order to get the most recent file first
     */
    const finalResultFiles = files
      .filter(file => file.startsWith('FinalResult-') && file.endsWith('.json'))
      .sort()
      .reverse(); // Sort descending by filename timestamp

    // Validate that final result files exist
    if (finalResultFiles.length === 0) {
      throw new Error('No FinalResult files found in data directory');
    }

    /** The most recently created final result file */
    const latestFile = finalResultFiles[0]!; // Non-null assertion since we validated length
    
    /** Full path to the latest final result file */
    const filePath = path.join(dataDir, latestFile);

    logger.info(`Analyzing latest FinalResult file: ${latestFile}`);
    
    // Read and parse the final result file to count holders
    /** Raw file content containing filtered holder data */
    const finalResultData = await fs.readFile(filePath, 'utf-8');
    
    /** Parsed final result object */
    const finalResult: Record<string, string[]> = JSON.parse(finalResultData);
    
    /** Number of qualified holders in the final result */
    const holderCount = Object.keys(finalResult).length;
    
    return holderCount;
  } catch (error) {
    logger.error('Error analyzing FinalResult file:', error);
    throw error;
  }
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
export async function saveCollectionsToFile(collections: ICollection[]): Promise<void> {
  try {
    /** ISO timestamp formatted for use in filenames (replacing invalid characters) */
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    /** Descriptive filename with timestamp for easy identification */
    const filename = `collections-${timestamp}.json`;

    /** Absolute path where the collections file will be saved */
    const filePath = path.join(process.cwd(), 'data', filename);

    // Ensure data directory exists (create if necessary)
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write collections data to file with safe serialization
    const jsonContent = safeStringify(collections);
    await fs.writeFile(filePath, jsonContent);

    // Log success metrics for monitoring and debugging
    logger.info(`Collections saved to: ${filePath}`);
    logger.info(`Total collections saved: ${collections.length}`);
    logger.info(`File size: ${jsonContent.length} bytes`);
  } catch (error) {
    logger.error('Failed to save collections to file:', error);
    throw error;
  }
}

/**
 * Persists bitmap holder data to a timestamped JSON file for future analysis
 * Creates organized data storage with automatic directory management
 * 
 * @async
 * @function saveBitmapListToFile
 * @param {IBitmap[]} bitmapList - Array of bitmap holder objects to save
 * @returns {Promise<void>} Resolves when file is successfully written
 * @throws {Error} When file system operations fail
 */
export async function saveBitmapListToFile(bitmapList: IBitmap[]): Promise<void> {
  try {
    /** ISO timestamp formatted for use in filenames (replacing invalid characters) */
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    /** Descriptive filename with timestamp for easy identification */
    const filename = `bitmapList-${timestamp}.json`;

    /** Absolute path where the bitmap list file will be saved */
    const filePath = path.join(process.cwd(), 'data', filename);

    // Ensure data directory exists (create if necessary)
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write bitmap holder data to file with safe serialization
    const jsonContent = safeStringify(bitmapList);
    await fs.writeFile(filePath, jsonContent);

    // Log success metrics for monitoring and debugging
    logger.info(`BitmapList saved to: ${filePath}`);
    logger.info(`Total bitmap holders saved: ${bitmapList.length}`);
    logger.info(`File size: ${jsonContent.length} bytes`);
  } catch (error) {
    logger.error('Failed to save bitmapList to file:', error);
    throw error;
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
export async function saveHoldersSummaryToFile(holdersSummary: Record<string, string[]>): Promise<void> {
  try {
    // Validate and clean the data before serialization
    const cleanedHoldersSummary: Record<string, string[]> = {};
    let totalInscriptions = 0;
    
    for (const [wallet, inscriptions] of Object.entries(holdersSummary)) {
      // Validate wallet address
      if (typeof wallet !== 'string' || wallet.trim() === '') {
        logger.warn(`Skipping invalid wallet: ${wallet}`);
        continue;
      }
      
      // Validate and clean inscription IDs
      if (Array.isArray(inscriptions)) {
        const validInscriptions = inscriptions.filter(id => 
          typeof id === 'string' && id.trim() !== '' && id.length < 1000
        );
        
        if (validInscriptions.length > 0) {
          cleanedHoldersSummary[wallet] = validInscriptions;
          totalInscriptions += validInscriptions.length;
        }
      }
    }
    
    logger.info(`Cleaned data: ${Object.keys(cleanedHoldersSummary).length} wallets, ${totalInscriptions} inscriptions`);
    
    // Check if data is too large and split if necessary
    // Estimate size before serialization to prevent memory issues
    const estimatedSize = Object.keys(cleanedHoldersSummary).length * 100 + totalInscriptions * 50; // Rough estimate
    const maxSize = 50 * 1024 * 1024; // 50MB limit (reduced from 100MB)
    
    if (estimatedSize > maxSize || Object.keys(cleanedHoldersSummary).length > 100000) {
      logger.warn(`Data size estimated at ${estimatedSize} bytes exceeds limit (${maxSize} bytes), splitting into chunks`);
      
      // Split data into chunks
      const wallets = Object.keys(cleanedHoldersSummary);
      const chunkSize = Math.ceil(wallets.length / 5); // Split into 5 chunks for better manageability
      
      for (let i = 0; i < wallets.length; i += chunkSize) {
        const chunkWallets = wallets.slice(i, i + chunkSize);
        const chunk: Record<string, string[]> = {};
        
        chunkWallets.forEach(wallet => {
          chunk[wallet] = cleanedHoldersSummary[wallet]!;
        });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `holderSummary-${timestamp}-chunk${Math.floor(i / chunkSize) + 1}.json`;
        const filePath = path.join(process.cwd(), 'data', filename);
        
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        try {
          const jsonContent = safeStringify(chunk);
          await fs.writeFile(filePath, jsonContent);
          logger.info(`Chunk ${Math.floor(i / chunkSize) + 1} saved: ${filePath} (${jsonContent.length} bytes)`);
        } catch (chunkError) {
          logger.error(`Failed to save chunk ${Math.floor(i / chunkSize) + 1}:`, chunkError);
          // Continue with other chunks even if one fails
        }
      }
      
      return;
    }
    
    /** ISO timestamp formatted for use in filenames */
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    /** Descriptive filename identifying this as aggregated holder data */
    const filename = `holderSummary-${timestamp}.json`;

    /** Absolute path where the holder summary will be saved */
    const filePath = path.join(process.cwd(), 'data', filename);

    // Ensure data directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write holder summary with safe serialization
    const jsonContent = safeStringify(cleanedHoldersSummary);
    await fs.writeFile(filePath, jsonContent);

    // Log metrics for monitoring and analysis validation
    logger.info(`Holders summary saved to: ${filePath}`);
    logger.info(`Total unique holders: ${Object.keys(cleanedHoldersSummary).length}`);
    logger.info(`Total inscriptions: ${totalInscriptions}`);
    logger.info(`File size: ${jsonContent.length} bytes`);
  } catch (error) {
    logger.error('Failed to save holders summary to file:', error);
    throw error;
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
export async function saveFilteredHoldersSummaryToFile(filteredHoldersSummary: Record<string, string[]>): Promise<void> {
  try {
    // Validate and clean the filtered data
    const cleanedFilteredSummary: Record<string, string[]> = {};
    let totalInscriptions = 0;
    
    for (const [wallet, inscriptions] of Object.entries(filteredHoldersSummary)) {
      if (typeof wallet === 'string' && wallet.trim() !== '' && Array.isArray(inscriptions)) {
        const validInscriptions = inscriptions.filter(id => 
          typeof id === 'string' && id.trim() !== '' && id.length < 1000
        );
        
        if (validInscriptions.length > 0) {
          cleanedFilteredSummary[wallet] = validInscriptions;
          totalInscriptions += validInscriptions.length;
        }
      }
    }
    
    /** ISO timestamp for final results file identification */
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    /** Final results filename indicating this is the primary analysis output */
    const filename = `FinalResult-${timestamp}.json`;

    /** Absolute path for the final analysis results file */
    const filePath = path.join(process.cwd(), 'data', filename);

    // Ensure data directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write final filtered results with safe serialization
    const jsonContent = safeStringify(cleanedFilteredSummary);
    await fs.writeFile(filePath, jsonContent);

    // Log final analysis metrics for validation and monitoring
    logger.info(`Filtered holders summary saved to: ${filePath}`);
    logger.info(`Total qualified holders: ${Object.keys(cleanedFilteredSummary).length}`);
    logger.info(`Total inscriptions: ${totalInscriptions}`);
    logger.info(`File size: ${jsonContent.length} bytes`);
  } catch (error) {
    logger.error('Failed to save filtered holders summary to file:', error);
    throw error;
  }
} 