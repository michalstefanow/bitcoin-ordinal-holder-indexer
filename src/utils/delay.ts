/**
 * Rate Limiting and Timing Utilities for API Request Management
 * 
 * Provides essential delay functionality for implementing respectful API rate limiting
 * and preventing throttling when making multiple requests to external services.
 * Critical for maintaining stable connections with the BestInSlot API.
 * 
 * @author Michal Stefanow <michalstefanow.marek@gmail.com>
 * @version 1.0.0
 * @since 2025-01-24
 */

/**
 * Creates a Promise-based delay for implementing rate limiting in API requests
 * 
 * This function is essential for preventing API throttling and maintaining respectful
 * interaction with external services. It uses the standard setTimeout mechanism wrapped
 * in a Promise to provide async/await compatibility with modern TypeScript patterns.
 * 
 * @async
 * @function delay
 * @param {number} ms - Duration of the delay in milliseconds (e.g., 1500 for 1.5 seconds)
 * @returns {Promise<void>} Promise that resolves after the specified delay period
 * 
 * @example
 * // Wait 1.5 seconds between API requests
 * await delay(1500);
 * 
 * @example
 * // Implement rate limiting in a loop
 * for (const item of items) {
 *   await processItem(item);
 *   await delay(1000); // Wait 1 second between iterations
 * }
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}