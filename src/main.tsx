import { createRoot } from 'react-dom/client'
import React from 'react'
import App from './App'
import './index.css'
import '@/utils/env-debug'
import '@/utils/verify-system'
import '@/styles/responsive.css'
import '@/styles/page-shell.css'
import i18n from '@/i18n'
import { ErrorBoundary } from '@/components/ErrorBoundary';
import SafeAreaLayout from "@/layouts/SafeAreaLayout";
import { DensityProvider } from "@/contexts/DensityContext";
import { monitorWebVitals, analyzeBundle } from './config/performance';

// Register Service Worker only in production to avoid HMR conflicts in dev
if (import.meta.env.PROD) {
  import('./sw-register');
}

// Create root only once
let root: ReturnType<typeof createRoot> | null = null;

// Função para renderizar a aplicação após i18n estar pronto
const renderApp = () => {
  if (!root) {
    root = createRoot(document.getElementById("root")!);
  }
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <DensityProvider>
          <SafeAreaLayout>
            <App />
          </SafeAreaLayout>
        </DensityProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

// Verificar se i18n já está inicializado
if (i18n.isInitialized) {
  renderApp();
} else {
  // Adicionar listener para quando i18n estiver pronto
  i18n.on('initialized', () => {
    console.log('🌐 i18n initialized, rendering app');
    renderApp();
  });
  
  // Fallback: se após 2 segundos i18n ainda não estiver pronto, renderizar mesmo assim
  setTimeout(() => {
    if (!i18n.isInitialized) {
      console.warn('🌐 i18n initialization timeout, rendering app anyway');
      renderApp();
    }
  }, 2000);
}

// 🚀 Development: ensure no Service Worker interferes with Vite HMR
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {});
  if ('caches' in window) {
    caches.keys()
      .then((keys) => keys.forEach((key) => caches.delete(key)))
      .catch(() => {});
  }
}

// 🚀 Performance Monitoring
if (import.meta.env.DEV) {
  monitorWebVitals();
  
  // 📊 Bundle Analysis após carregamento
  window.addEventListener('load', () => {
    setTimeout(analyzeBundle, 1000);
  });
}
