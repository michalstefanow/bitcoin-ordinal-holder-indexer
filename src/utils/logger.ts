/**
 * Advanced Logging Utility for Bitcoin Inscription Holder Analysis
 * 
 * Provides structured, timestamped logging with multiple severity levels for comprehensive
 * application monitoring, debugging, and operational visibility. Implements a context-aware
 * logging system that enables tracking of operations across different application components.
 * 
 * @author Michal Stefanow <michalstefanow.marek@gmail.com>
 * @version 1.0.0
 * @since 2025-01-24
 */

/**
 * Enumeration of available log levels with explicit string values
 * Provides type-safe logging levels for consistent message categorization
 * 
 * @enum {string} LogLevel
 */
export enum LogLevel {
  /** Debug level for detailed diagnostic information during development */
  DEBUG = 'DEBUG',
  
  /** Info level for general application flow and milestone logging */
  INFO = 'INFO',
  
  /** Warning level for potentially problematic situations that don't stop execution */
  WARN = 'WARN',
  
  /** Error level for critical issues that may cause operation failures */
  ERROR = 'ERROR',
}

/**
 * Advanced logger class providing structured, contextual logging capabilities
 * Features timestamped messages, multiple severity levels, and flexible output formatting
 * 
 * @class Logger
 */
export class Logger {
  /** 
   * Contextual identifier for this logger instance 
   * Enables tracking of log messages to specific application components
   */
  private readonly context: string;

  /**
   * Creates a new Logger instance with the specified context identifier
   * 
   * @constructor
   * @param {string} context - Descriptive name for the application component using this logger
   */
  constructor(context: string) {
    this.context = context;
  }

  /**
   * Logs a debug-level message with optional additional arguments
   * Primarily used during development for detailed diagnostic information
   * 
   * @public
   * @method debug
   * @param {string} message - Primary log message content
   * @param {...unknown[]} args - Additional arguments for detailed context
   * @returns {void}
   */
  public debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Logs an info-level message for general application flow tracking
   * Used for milestone logging, successful operations, and general status updates
   * 
   * @public
   * @method info
   * @param {string} message - Primary log message content
   * @param {...unknown[]} args - Additional arguments for enhanced context
   * @returns {void}
   */
  public info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Logs a warning-level message for potentially problematic situations
   * Used for recoverable issues, deprecated functionality, or unusual conditions
   * 
   * @public
   * @method warn
   * @param {string} message - Primary log message content
   * @param {...unknown[]} args - Additional arguments for diagnostic context
   * @returns {void}
   */
  public warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Logs an error-level message for critical failures and exceptions
   * Used for operation failures, API errors, and other critical issues
   * 
   * @public
   * @method error
   * @param {string} message - Primary error message content
   * @param {...unknown[]} args - Additional arguments including error objects and context
   * @returns {void}
   */
  public error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  /**
   * Core logging implementation that formats and outputs messages to appropriate channels
   * Provides consistent timestamp formatting and structured message output
   * 
   * @private
   * @method log
   * @param {LogLevel} level - Severity level for this log message
   * @param {string} message - Primary message content to be logged
   * @param {...unknown[]} args - Additional arguments for enhanced context and debugging
   * @returns {void}
   */
  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    /** ISO 8601 timestamp for precise log message timing */
    const timestamp = new Date().toISOString();
    
    /** Structured log message format: [timestamp] [level] [context] message */
    const formattedMessage = `[${timestamp}] [${level}] [${this.context}] ${message}`;

    // Route log messages to appropriate console methods based on severity level
    switch (level) {
      case LogLevel.DEBUG:
        // Debug messages for development and detailed diagnostic information
        console.debug(formattedMessage, ...args);
        break;
      case LogLevel.INFO:
        // Informational messages for general application flow tracking
        console.info(formattedMessage, ...args);
        break;
      case LogLevel.WARN:
        // Warning messages for potentially problematic but non-critical situations
        console.warn(formattedMessage, ...args);
        break;
      case LogLevel.ERROR:
        // Error messages for critical failures and exceptions requiring attention
        console.error(formattedMessage, ...args);
        break;
    }
  }
}
