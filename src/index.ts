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

// Import custom utilities and services
import { Logger } from './utils/logger';
import { runFullPipeline, getAnalysisStatus } from './services';

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
  logger.info('🚀 Starting Bitcoin Inscription Holder Analyzer...');

  try {
    // Execute the complete analysis pipeline
    await runFullPipeline();
    
    // Get and display final status
    const status = await getAnalysisStatus();
    logger.info(`📊 Final Analysis Results:`);
    logger.info(`   • Qualified Holders: ${status.qualifiedHolders.toLocaleString()}`);
    logger.info(`   • Analysis Timestamp: ${status.timestamp}`);
    
    logger.info('🎉 Application completed successfully!');
  } catch (error) {
    logger.error('❌ Application failed:', error);
    process.exit(1);
  }
}

/**
 * Application entry point with comprehensive error handling
 * Ensures graceful shutdown and proper error reporting for debugging
 */
main().catch((error) => {
  logger.error('💥 Critical application error:', error);
  process.exit(1);
});
