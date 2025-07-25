// keystone.ts
import React from "react";
import { config } from "@keystone-6/core";
import { lists } from "./schema";
import { withAuth, session } from "./auth";
import express, { Request, Response } from "express";
import syncEpisodes from "./api/sync"; // Adjust the path to your sync file
import cors from "cors"; // Import CORS middleware
// import rateLimit from 'express-rate-limit'; // Import rate limiter
import { podcastsHandler } from "./api/podcasts"; // Import the existing podcasts handler
import { allEpisodesHandler, episodesHandler } from "./api/episodes"; // Import the existing episodes handler
import { categoriesHandler } from "./api/categories"; // Import the new categories handler
import { featuredPodcastsHandler } from "./api/featured";
import { latestPodcastsHandler } from "./api/lastestPodcasts";
import { seasonsHandler } from "./api/seasons"; // Import the new seasons handler
import { podcastInfoHandler } from "./api/podcastInfo";
import { config as dotenvConfig } from "dotenv";
import path from "path";
import syncPodcasts from "./scheduler";

import { getMemoryLogs } from "./services/memoryLog";

dotenvConfig();

// Ensure that required environment variables are set
const requiredEnvVars = ["DATABASE_URL", "ALLOWED_ORIGINS"];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Error: Missing required environment variable ${varName}`);
    process.exit(1); // Exit the application if any required variable is missing
  }
});

// Define allowed origins
// Parse ALLOWED_ORIGINS from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000", "http://erpodcasts"]; // Fallback to default if not set

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
      provider: "mysql",
      url: process.env.DATABASE_URL,
    },
    lists,
    session,
    ui: {
      basePath: "/admin",
    },
    server: {
      extendExpressApp: (app, context) => {
        // Configure CORS middleware for API routes
        // Start the scheduler after Keystone is initialized
        console.log("Starting scheduler...");
        syncPodcasts(context); // Pass Keystone context to the scheduler
        console.log("Scheduler started.");
        app.use(
          cors({
            origin: function (origin, callback) {
              // Allow requests with no origin (like mobile apps or curl requests)
              if (!origin) return callback(null, true);
              if (allowedOrigins.includes(origin)) {
                return callback(null, true);
              } else {
                return callback(new Error("Not allowed by CORS"));
              }
            },
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true, // Enable credentials
          })
        );

        // Apply rate limiting to /api/podcasts and /api/categories if needed
        // app.use('/api/podcasts', apiLimiter);
        // app.use('/api/categories', apiLimiter); // Apply the same rate limiter

        // Handle CORS errors
        app.use((err, req, res, next) => {
          if (err instanceof Error && err.message === "Not allowed by CORS") {
            res.status(403).json({ error: "CORS Error: Not allowed by CORS" });
          } else {
            next(err);
          }
        });

        // Add JSON body parser middleware
        app.use(express.json());

        app.get("/", (req, res) => {
          res.redirect("/admin/signin");
        });

        // Define the /api/sync route
        app.post("/api/sync", async (req: Request, res: Response) => {
          const { podcastId } = req.body; // Now req.body should be parsed properly

          if (!podcastId) {
            return res.status(400).json({ error: "Podcast ID is required." });
          }

          try {
            const data = await syncEpisodes(podcastId, context); // Call your sync logic
            res.status(200).json({
              message: "Ok: Sync completed successfully.",
              data: data,
            });
          } catch (error) {
            console.error("Error syncing episodes:", error);

            res.status(500).json({ error: "Failed to sync episodes." });
          }
        });

        // Define the /api/podcasts route and delegate to podcastsHandler
        app.get("/api/podcasts", async (req: Request, res: Response) => {
          await podcastsHandler(req, res, context);
        });

        // Define the /api/episodes route and delegate to episodesHandler
        app.get(
          "/api/episodes/:podcastId",
          async (req: Request, res: Response) => {
            await episodesHandler(req, res, context);
          }
        );

        app.get("/api/allEpisodes", async (req: Request, res: Response) => {
          await allEpisodesHandler(req, res, context);
        });

        // Define the /api/categories route and delegate to categoriesHandler
        app.get("/api/categories", async (req: Request, res: Response) => {
          await categoriesHandler(req, res, context);
        });

        app.get("/api/featured", async (req: Request, res: Response) => {
          await featuredPodcastsHandler(req, res, context);
        });

        app.get("/api/categories", async (req: Request, res: Response) => {
          await categoriesHandler(req, res, context);
        });

        // Define the /api/seasons route and delegate to seasonsHandler
        app.get("/api/latestPodcasts", async (req: Request, res: Response) => {
          await latestPodcastsHandler(req, res, context);
        });

        // Register /api/podcast-info endpoint
        app.get("/api/podcast-info", async (req, res) => {
          await podcastInfoHandler(req, res, context);
        });

        // Serve images with correct CORS settings
        const imagesPath = path.resolve(process.cwd(), "public", "images");

        app.use(
          "/images",
          cors({
            origin: "*", // Allow all origins for images
            methods: ["GET"], // Only GET requests are needed for static files
            allowedHeaders: ["Content-Type"], // Allow necessary headers
            credentials: false, // Disable credentials as they aren't needed for static assets
          }),
          express.static(imagesPath, {
            dotfiles: "deny", // Prevent serving dotfiles (e.g., .env, .gitignore)
            etag: true, // Enable ETag for caching
            extensions: ["jpg", "jpeg", "png"], // Allow serving files without explicit extensions in the request
            index: false, // Disable directory listing
            maxAge: "1d", // Cache-Control max-age (1 day in this case)
          })
        );

        app.get("/api/admin/memoryLogs", async (req, res) => {
          // const session = await context.session;
          // if (!session) {
          //   return res.status(401).json({ error: 'Not authorized' });
          // }

          const logs = getMemoryLogs();
          return res.json(logs.reverse());
        });
      },
    },
  })
);
