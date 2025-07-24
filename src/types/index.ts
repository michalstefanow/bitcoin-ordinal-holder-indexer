/**
 * Type Definitions for Bitcoin Inscription Holder Analysis
 * 
 * This module contains TypeScript interfaces and type definitions for Bitcoin inscription
 * collections and holder data structures used throughout the analysis application.
 * 
 * @author Michal Stefanow <michalstefanow.marek@gmail.com>
 * @version 1.0.0
 * @since 2025-01-24
 */

/**
 * Interface representing a Bitcoin inscription collection with comprehensive metadata
 * Contains all relevant information about an inscription collection including market data,
 * supply information, and trading statistics across multiple platforms
 * 
 * @interface ICollection
 */
export interface ICollection {
  /** Human-readable collection name */
  name: string;
  
  /** Unique collection identifier used in API requests and URLs */
  slug: string;
  
  /** Inscription ID of the collection's icon/representative image */
  inscription_icon_id: string;
  
  /** Direct URL to the collection's icon image */
  icon_url: string;
  
  /** Rendered version of the icon URL (may be null if not available) */
  icon_render_url: string | null;
  
  /** BestInSlot platform URL for this collection */
  bis_url: string;
  
  /** Total number of inscriptions in this collection (as string for large numbers) */
  supply: string;
  
  /** Lowest inscription number in the collection range */
  min_number: number;
  
  /** Median inscription number (used for sorting and analysis) */
  median_number: number;
  
  /** Highest inscription number in the collection range */
  max_number: number;
  
  /** Current number of inscriptions listed for sale */
  listed_count: number;
  
  /** Current floor price across all platforms (null if no listings) */
  floor_price: number | null;
  
  /** Floor price specifically on OrdSwap platform */
  floor_price_ordswap: number | null;
  
  /** Floor price specifically on Magic Eden platform */
  floor_price_magiceden: number | null;
  
  /** Floor price specifically on Ordinals Wallet platform */
  floor_price_ordinalswallet: number | null;
  
  /** Floor price specifically on Gamma.io platform */
  floor_price_gammaio: number | null;
  
  /** Floor price specifically on Ordynals platform */
  floor_price_ordynals: number | null;
  
  /** Floor price specifically on Unisat platform */
  floor_price_unisat: number | null;
  
  /** Floor price specifically on Ordinals Market platform */
  floor_price_ordinalsmarket: number | null;
  
  /** Floor price specifically on OKX platform */
  floor_price_okx: number | null;
  
  /** Trading volume in Bitcoin over the last 3 hours */
  vol_3h_in_btc: number;
  
  /** Trading volume in Bitcoin over the last 24 hours */
  vol_24h_in_btc: number;
  
  /** Trading volume in Bitcoin over the last 7 days */
  vol_7d_in_btc: number;
  
  /** Trading volume in Bitcoin over the last 30 days */
  vol_30d_in_btc: number;
  
  /** Number of sales transactions in the last 7 days */
  sale_cnt_7d: number;
  
  /** Total trading volume in Bitcoin since collection inception */
  vol_total_in_btc: number;
  
  /** Total number of sales transactions since collection inception */
  sale_cnt_total: number;
  
  /** Current market capitalization based on floor price and supply */
  marketcap: number;
}

/**
 * Interface representing an inscription holder with their owned inscriptions
 * Used for cross-collection analysis and whale identification
 * 
 * @interface IHolder
 */
export interface IHolder {
  /** Bitcoin wallet address of the inscription holder */
  wallet: string;
  
  /** Array of inscription IDs owned by this wallet in the specific collection */
  inscription_ids: string[];
}

/**
 * Interface representing a Bitcoin bitmap holder with their owned bitmap inscriptions
 * Used for bitmap-specific analysis and integration with collection holder data
 * 
 * @interface IBitmap
 */
export interface IBitmap {
  /** Bitcoin wallet address of the bitmap holder */
  wallet: string;
  
  /** Array of bitmap inscription IDs owned by this wallet */
  inscription_ids: string[];
}