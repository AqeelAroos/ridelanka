/**
 * Run with: node apply-cors.js
 * Requires: npm install @google-cloud/storage
 *
 * OR use the Google Cloud Console steps in README-CORS.md
 */
import { Storage } from '@google-cloud/storage';

const BUCKET = 'fir-proj1-36d47.firebasestorage.app';

const corsConfig = [
  {
    origin: ['*'],
    method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
    maxAgeSeconds: 3600,
    responseHeader: [
      'Content-Type',
      'Authorization',
      'Content-Length',
      'User-Agent',
      'x-goog-resumable',
      'x-goog-meta-firebaseStorageDownloadTokens',
    ],
  },
];

const storage = new Storage();
await storage.bucket(BUCKET).setCorsConfiguration(corsConfig);
console.log(`✓ CORS applied to gs://${BUCKET}`);
