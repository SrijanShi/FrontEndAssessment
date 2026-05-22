import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

const baseConfig: NextConfig = {
  // Acknowledge Turbopack while still allowing the webpack plugin config from PWA
  turbopack: {},
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'supabase-api',
          expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
        },
      },
      {
        urlPattern: /\.(js|css|woff2?|png|jpg|svg|ico)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
    ],
  },
})(baseConfig);
