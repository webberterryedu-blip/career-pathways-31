import { useEffect } from 'react';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const VERSION_KEY = 'app_version';

/**
 * CacheBuster component
 * Automatically clears all caches when a new version is deployed
 * Ensures users always get the latest code without manual cache clearing
 */
export const CacheBuster = () => {
  useEffect(() => {
    const clearAllCaches = async () => {
      try {
        // Clear browser caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          console.log('✅ Browser caches cleared');
        }

        // Unregister all service workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(reg => reg.unregister()));
          console.log('✅ Service Workers unregistered');
        }
      } catch (error) {
        console.error('❌ Error clearing caches:', error);
      }
    };

    const checkVersion = async () => {
      const storedVersion = localStorage.getItem(VERSION_KEY);
      
      if (storedVersion !== APP_VERSION) {
        console.log(`🔄 Version change detected: ${storedVersion} → ${APP_VERSION}`);
        
        // Clear all caches
        await clearAllCaches();
        
        // Store new version
        localStorage.setItem(VERSION_KEY, APP_VERSION);
        
        // Force reload to load fresh code
        console.log('🔄 Reloading to load fresh code...');
        window.location.reload();
      }
    };

    // Only run in production
    if (import.meta.env.PROD) {
      checkVersion();
    }
  }, []);

  return null;
};

export default CacheBuster;
