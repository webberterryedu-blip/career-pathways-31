import { logger } from '@/utils/logger';
import { supabase } from '@/lib/supabase';

/**
 * Supabase Error Handler
 * Handles common Supabase errors including schema cache issues
 */

export interface SupabaseErrorDetails {
  isSchemaCache: boolean;
  is400BadRequest: boolean;
  isRLS: boolean;
  isNetwork: boolean;
  message: string;
  recommendation: string;
}

/**
 * Analyze Supabase error and provide details
 */
export const analyzeSupabaseError = (error: any): SupabaseErrorDetails => {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorCode = error?.code || '';
  
  const isSchemaCache = 
    errorMessage.includes('schema cache') ||
    errorMessage.includes('column') ||
    errorMessage.includes('PGRST') ||
    errorMessage.includes('relation') ||
    errorMessage.includes('does not exist');
    
  const is400BadRequest = 
    error?.status === 400 ||
    errorCode === '400' ||
    errorMessage.includes('400');
    
  const isRLS = 
    errorMessage.includes('RLS') ||
    errorMessage.includes('row level security') ||
    errorMessage.includes('policy') ||
    error?.status === 403;
    
  const isNetwork = 
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('ECONNREFUSED');

  let recommendation = 'Try the operation again';
  
  if (isSchemaCache) {
    recommendation = 'Schema cache issue detected. The operation will be retried with fallback data.';
  } else if (isRLS) {
    recommendation = 'Permission issue. Check if you are logged in and have the required permissions.';
  } else if (isNetwork) {
    recommendation = 'Network connectivity issue. Check your internet connection.';
  }

  return {
    isSchemaCache,
    is400BadRequest,
    isRLS,
    isNetwork,
    message: errorMessage,
    recommendation
  };
};

/**
 * Handle Supabase schema cache refresh
 */
export const refreshSchemaCache = async (): Promise<boolean> => {
  try {
    logger.info('Attempting to refresh Supabase schema cache...');
    
    // Try to trigger schema cache refresh by making a simple query
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (error) {
      logger.warn('Schema refresh attempt returned error (this may be expected):', error);
    }
    
    // Wait a moment for cache to potentially refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info('Schema cache refresh attempted');
    return true;
  } catch (error) {
    logger.error('Failed to refresh schema cache:', error);
    return false;
  }
};

/**
 * Execute operation with automatic retry on schema cache issues
 */
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  fallbackValue?: T
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      logger.debug(`Executing operation (attempt ${attempt})`);
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error;
      const errorDetails = analyzeSupabaseError(error);
      
      logger.warn(`Operation failed (attempt ${attempt}):`, errorDetails.message);
      
      if (errorDetails.isSchemaCache && attempt <= maxRetries) {
        logger.info('Schema cache issue detected, attempting refresh and retry...');
        await refreshSchemaCache();
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        continue;
      }
      
      // If not a schema cache issue or out of retries, break
      break;
    }
  }
  
  // If we have a fallback value and this is a schema cache issue, use it
  const errorDetails = analyzeSupabaseError(lastError);
  if (errorDetails.isSchemaCache && fallbackValue !== undefined) {
    logger.warn('Using fallback value due to persistent schema cache issues');
    return fallbackValue;
  }
  
  // Re-throw the last error
  throw lastError;
};

/**
 * Safe query execution with error handling
 */
export const safeQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallbackData?: T
): Promise<{ data: T | null; error: any; usedFallback: boolean }> => {
  try {
    const result = await executeWithRetry(queryFn);
    return { ...result, usedFallback: false };
  } catch (error) {
    const errorDetails = analyzeSupabaseError(error);
    
    if (errorDetails.isSchemaCache && fallbackData !== undefined) {
      logger.warn('Query failed with schema cache issue, using fallback data');
      return { 
        data: fallbackData, 
        error: null, 
        usedFallback: true 
      };
    }
    
    return { 
      data: null, 
      error, 
      usedFallback: false 
    };
  }
};

/**
 * Log Supabase error with analysis
 */
export const logSupabaseError = (context: string, error: any): void => {
  const errorDetails = analyzeSupabaseError(error);
  
  logger.error(`Supabase error in ${context}:`, {
    message: errorDetails.message,
    isSchemaCache: errorDetails.isSchemaCache,
    isRLS: errorDetails.isRLS,
    isNetwork: errorDetails.isNetwork,
    recommendation: errorDetails.recommendation
  });
};

export default {
  analyzeSupabaseError,
  refreshSchemaCache,
  executeWithRetry,
  safeQuery,
  logSupabaseError
};