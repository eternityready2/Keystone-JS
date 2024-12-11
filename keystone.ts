// keystone.ts

import { config } from '@keystone-6/core';
import { lists } from './schema';
import { withAuth, session } from './auth';
import express, { Request, Response } from 'express';
import syncEpisodes from './api/sync'; // Adjust the path to your sync file
import cors from 'cors'; // Import CORS middleware
// import rateLimit from 'express-rate-limit'; // Import rate limiter
import { podcastsHandler } from './api/podcasts'; // Import the existing podcasts handler
import { categoriesHandler } from './api/categories'; // Import the new categories handler
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();
// Ensure that required environment variables are set
const requiredEnvVars = ['DATABASE_URL', 'ALLOWED_ORIGINS'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Error: Missing required environment variable ${varName}`);
    process.exit(1); // Exit the application if any required variable is missing
  }
});
// Define allowed origins
// Parse ALLOWED_ORIGINS from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://erpodcasts']; // Fallback to default if not set

// // Define rate limiter
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });

// Export the Keystone configuration with extended Express app
export default withAuth(
  config({
    db: {
      provider: 'mysql',
      url: process.env.DATABASE_URL,
    },
    lists,
    session,
    server: {
      extendExpressApp: (app, context) => {
        // Configure CORS middleware
        app.use(
          cors({
            origin: function (origin, callback) {
              // Allow requests with no origin (like mobile apps or curl requests)
              if (!origin) return callback(null, true);
              if (allowedOrigins.includes(origin)) {
                return callback(null, true);
              } else {
                return callback(new Error('Not allowed by CORS'));
              }
            },
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true, // Enable credentials
          })
        );

        // Apply rate limiting to /api/podcasts and /api/categories
        // app.use('/api/podcasts', apiLimiter);
        // app.use('/api/categories', apiLimiter); // Apply the same rate limiter

        // Handle CORS errors
        app.use((err, req, res, next) => {
          if (err instanceof Error && err.message === 'Not allowed by CORS') {
            res.status(403).json({ error: 'CORS Error: Not allowed by CORS' });
          } else {
            next(err);
          }
        });

        // Add JSON body parser middleware
        app.use(express.json());

        // Define the /api/sync route
        app.post('/api/sync', async (req: Request, res: Response) => {
          const { podcastId } = req.body; // Now req.body should be parsed properly

          if (!podcastId) {
            return res.status(400).json({ error: 'Podcast ID is required.' });
          }

          try {
            await syncEpisodes(podcastId, context); // Call your sync logic
            res.status(200).json({ message: 'Sync completed successfully.' });
          } catch (error) {
            console.error('Error syncing episodes:', error);
            res.status(500).json({ error: 'Failed to sync episodes.' });
          }
        });

        // Define the /api/podcasts route and delegate to podcastsHandler
        app.get('/api/podcasts', async (req: Request, res: Response) => {
          await podcastsHandler(req, res, context);
        });

        // Define the /api/categories route and delegate to categoriesHandler
        app.get('/api/categories', async (req: Request, res: Response) => {
          await categoriesHandler(req, res, context);
        });
      },
    },
  })
);
