import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../app/src/App';
import MinimalApp from './MinimalApp';
import '../../app/src/index.css';
import './styles/minimal-theme.css';
import { PlatformProvider } from '../../app/src/platform/PlatformContext';
import { webPlatform } from './platform';
import { OpenAPI } from '../../app/src/lib/api';

// Configure API client
OpenAPI.BASE = 'http://localhost:17493';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Use MinimalApp by default, can switch to App with ?mode=full
const useMinimalUI = !window.location.search.includes('mode=full');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <PlatformProvider platform={webPlatform}>
        {useMinimalUI ? <MinimalApp /> : <App />}
      </PlatformProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
