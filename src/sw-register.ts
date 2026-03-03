// Service Worker registration with robust error handling and cache cleanup

interface SWRegister {
  register(): void;
  handleChunkError(event: ErrorEvent): Promise<void>;
  clearCaches(): Promise<void>;
  unregister(): Promise<void>;
}

const swRegister: SWRegister = {
  register() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // Limpar caches antigos antes de registrar
        this.clearCaches().then(() => {
          navigator.serviceWorker.register('/sw.js', {
            updateViaCache: 'none' // Sempre buscar nova versão
          })
            .then((registration) => {
              console.log('✅ Service Worker registered successfully:', registration);
              
              // Verificar se há atualizações
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      console.log('🔄 New Service Worker available');
                      // Opcional: mostrar notificação para o usuário atualizar
                    }
                  });
                }
              });
            })
            .catch((registrationError) => {
              console.warn('⚠️ Service Worker registration skipped (sw.js not found)');
            });
        });
      });
    }
  },

  async handleChunkError(event: ErrorEvent) {
    const msg = String(event?.message || '');
    if (/ChunkLoadError|Loading chunk \d+ failed/i.test(msg)) {
      console.log('🚨 Chunk loading error detected, clearing caches and reloading...');
      await this.clearCaches();
      location.reload();
    }
  },

  async clearCaches() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('🗑️ Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        console.log('✅ All caches cleared successfully');
      } catch (error) {
        console.error('❌ Error clearing caches:', error);
      }
    }
  },

  async unregister() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
          console.log('✅ Service Worker unregistered');
        }
      } catch (error) {
        console.error('❌ Error unregistering Service Worker:', error);
      }
    }
  }
};

// Registrar service worker somente em produção
if (import.meta.env.PROD) {
  swRegister.register();
}

// Listener para erros de chunk
window.addEventListener('error', (event) => {
  swRegister.handleChunkError(event);
});

// Listener para erros não capturados
window.addEventListener('unhandledrejection', (event) => {
  console.warn('⚠️ Unhandled promise rejection:', event.reason);
  
  // Se for erro de cache, limpar caches
  if (event.reason && event.reason.message && 
      event.reason.message.includes('Cache')) {
    console.log('🗑️ Cache error detected, clearing caches...');
    swRegister.clearCaches();
  }
});

// Expor funções para debug
(window as any).swRegister = swRegister;

export default swRegister;