import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Authentication utility for API requests
 * Provides real JWT tokens from Supabase auth
 */

export interface AuthHeaders {
  'Authorization': string;
  'Content-Type': string;
  [key: string]: string;
}

/**
 * Get authentication headers with real JWT token
 * Returns headers with Bearer token or throws error if not authenticated
 */
export const getAuthHeaders = async (): Promise<AuthHeaders> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('Error getting auth session:', error);
      throw new Error(`Auth session error: ${error.message}`);
    }
    
    if (!session?.access_token) {
      logger.warn('No active session found');
      throw new Error('No authenticated session found. Please login first.');
    }
    
    const headers: AuthHeaders = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
    
    logger.debug('Auth headers created successfully');
    return headers;
    
  } catch (error) {
    logger.error('Failed to get auth headers:', error);
    throw error;
  }
};

/**
 * Get just the Bearer token string
 * Returns the token or throws error if not authenticated
 */
export const getAuthToken = async (): Promise<string> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('Error getting auth token:', error);
      throw new Error(`Auth token error: ${error.message}`);
    }
    
    if (!session?.access_token) {
      logger.warn('No active session found for token');
      throw new Error('No authenticated session found. Please login first.');
    }
    
    return session.access_token;
    
  } catch (error) {
    logger.error('Failed to get auth token:', error);
    throw error;
  }
};

/**
 * Check if user is currently authenticated
 * Returns boolean without throwing errors
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.access_token;
  } catch (error) {
    logger.error('Error checking authentication status:', error);
    return false;
  }
};

/**
 * Get user information from current session
 * Returns user data or null if not authenticated
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      logger.error('Error getting current user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    logger.error('Failed to get current user:', error);
    return null;
  }
};

/**
 * Safe fetch with automatic authentication
 * Automatically includes auth headers and handles auth errors
 */
export const authenticatedFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  try {
    const authHeaders = await getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers
      }
    });
    
    // Handle auth-specific errors
    if (response.status === 401) {
      logger.warn('Request failed with 401 - token may be expired');
      throw new Error('Authentication failed. Please login again.');
    }
    
    if (response.status === 403) {
      logger.warn('Request failed with 403 - insufficient permissions');
      throw new Error('Insufficient permissions for this operation.');
    }
    
    return response;
    
  } catch (error) {
    logger.error('Authenticated fetch failed:', error);
    throw error;
  }
};

export default {
  getAuthHeaders,
  getAuthToken,
  isAuthenticated,
  getCurrentUser,
  authenticatedFetch
};