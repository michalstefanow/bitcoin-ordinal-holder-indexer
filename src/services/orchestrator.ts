/**
 * Application Orchestrator Service Module
 * 
 * This module coordinates all application operations and manages the complete
 * data processing pipeline from API fetching to final analysis results.
 * 
 * @author Michal Stefanow <michalstefanow.marek@gmail.com>
 * @version 1.0.0
 * @since 2025-01-24
 */

import { Logger } from '../utils/logger';
import { fetchCollectionList, fetchBitmapList } from './api';
import { saveCollectionsToFile, saveBitmapListToFile, getLatestFinalResultFile } from './fileManager';
import { summarizeHolders, filterHolders } from './dataProcessor';

/**
 * Global logger instance for orchestrator operations
 */
const logger = new Logger('Orchestrator');

/**
 * Main application orchestrator function
 * Executes the complete three-stage analysis pipeline in sequence
 * 
 * @async
 * @function runFullPipeline
 * @returns {Promise<void>} Resolves when all analysis stages complete successfully
 * @throws {Error} Propagates errors from any stage of the pipeline
 */
export async function runFullPipeline(): Promise<void> {
  logger.info('Starting complete Bitcoin inscription analysis pipeline...');

  try {
    // Stage 1: Fetch all inscription collections from BestInSlot API
    logger.info('Stage 1: Fetching collection data...');
    const collections = await fetchCollectionList();
    await saveCollectionsToFile(collections);
    logger.info('✅ Collection data fetched and saved');

    // Stage 1.5: Fetch bitmap holder data
    logger.info('Stage 1.5: Fetching bitmap holder data...');
    const bitmapList = await fetchBitmapList();
    await saveBitmapListToFile(bitmapList);
    logger.info('✅ Bitmap holder data fetched and saved');

    // Stage 2: Analyze holders across all collections and aggregate data
    logger.info('Stage 2: Analyzing and summarizing holders...');
    await summarizeHolders();
    logger.info('✅ Holders summarized and cross-collection analysis complete');

    // Stage 3: Filter holders based on inscription count threshold
    logger.info('Stage 3: Filtering holders based on criteria...');
    await filterHolders();
    logger.info('✅ Holders filtered and final results generated');

    // Stage 4: Get final result metrics
    logger.info('Stage 4: Analyzing final results...');
    const qualifiedHolderCount = await getLatestFinalResultFile();
    logger.info(`✅ Analysis complete: ${qualifiedHolderCount} qualified holders identified`);

    logger.info('🎉 Complete pipeline executed successfully!');
  } catch (error) {
    logger.error('❌ Pipeline execution failed:', error);
    throw error;
  }
}

/**
 * Executes only the data fetching stages (collections and bitmaps)
 * Useful for updating source data without re-processing existing analysis
 * 
 * @async
 * @function runDataFetchingOnly
 * @returns {Promise<void>} Resolves when data fetching completes
 * @throws {Error} When API requests fail
 */
export async function runDataFetchingOnly(): Promise<void> {
  logger.info('Starting data fetching operations...');

  try {
    // Fetch collections
    logger.info('Fetching collection data...');
    const collections = await fetchCollectionList();
    await saveCollectionsToFile(collections);
    logger.info('✅ Collection data fetched and saved');

    // Fetch bitmaps
    logger.info('Fetching bitmap holder data...');
    const bitmapList = await fetchBitmapList();
    await saveBitmapListToFile(bitmapList);
    logger.info('✅ Bitmap holder data fetched and saved');

    logger.info('🎉 Data fetching completed successfully!');
  } catch (error) {
    logger.error('❌ Data fetching failed:', error);
    throw error;
  }
}

/**
 * Executes only the analysis stages using existing data
 * Useful for re-analyzing data without re-fetching from API
 * 
 * @async
 * @function runAnalysisOnly
 * @returns {Promise<void>} Resolves when analysis completes
 * @throws {Error} When analysis operations fail
 */
export async function runAnalysisOnly(): Promise<void> {
  logger.info('Starting analysis operations using existing data...');

  try {
    // Analyze holders
    logger.info('Analyzing and summarizing holders...');
    await summarizeHolders();
    logger.info('✅ Holders summarized');

    // Filter holders
    logger.info('Filtering holders based on criteria...');
    await filterHolders();
    logger.info('✅ Holders filtered');

    // Get final metrics
    const qualifiedHolderCount = await getLatestFinalResultFile();
    logger.info(`✅ Analysis complete: ${qualifiedHolderCount} qualified holders identified`);

    logger.info('🎉 Analysis completed successfully!');
  } catch (error) {
    logger.error('❌ Analysis failed:', error);
    throw error;
  }
}

/**
 * Executes only the holder summarization stage
 * Useful for updating holder analysis with new bitmap data
 * 
 * @async
 * @function runHolderSummarizationOnly
 * @returns {Promise<void>} Resolves when summarization completes
 * @throws {Error} When summarization fails
 */
export async function runHolderSummarizationOnly(): Promise<void> {
  logger.info('Starting holder summarization...');

  try {
    await summarizeHolders();
    logger.info('✅ Holder summarization completed successfully!');
  } catch (error) {
    logger.error('❌ Holder summarization failed:', error);
    throw error;
  }
}

/**
 * Executes only the holder filtering stage
 * Useful for applying different filtering criteria to existing data
 * 
 * @async
 * @function runHolderFilteringOnly
 * @returns {Promise<void>} Resolves when filtering completes
 * @throws {Error} When filtering fails
 */
export async function runHolderFilteringOnly(): Promise<void> {
  logger.info('Starting holder filtering...');

  try {
    await filterHolders();
    const qualifiedHolderCount = await getLatestFinalResultFile();
    logger.info(`✅ Holder filtering completed: ${qualifiedHolderCount} qualified holders identified`);
  } catch (error) {
    logger.error('❌ Holder filtering failed:', error);
    throw error;
  }
}

/**
 * Gets the current status and metrics of the latest analysis
 * Provides a quick overview without running any processing
 * 
 * @async
 * @function getAnalysisStatus
 * @returns {Promise<{qualifiedHolders: number, timestamp: string}>} Current analysis status
 * @throws {Error} When status retrieval fails
 */
export async function getAnalysisStatus(): Promise<{qualifiedHolders: number, timestamp: string}> {
  try {
    const qualifiedHolders = await getLatestFinalResultFile();
    const timestamp = new Date().toISOString();
    
    logger.info(`Current analysis status: ${qualifiedHolders} qualified holders (as of ${timestamp})`);
    
    return {
      qualifiedHolders,
      timestamp
    };
  } catch (error) {
    logger.error('❌ Status retrieval failed:', error);
    throw error;
  }
} 