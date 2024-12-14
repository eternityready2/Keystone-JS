// api/podcastInfo.ts

import { Request, Response } from 'express';
import { KeystoneContext } from '@keystone-6/core/types';
import { z } from 'zod';

// Define a schema for query parameters using Zod for validation
const podcastInfoQuerySchema = z.object({
  podcast: z.string().min(1, { message: 'Podcast ID is required.' }),
});

// Helper function to parse and validate query parameters
const parsePodcastInfoQueryParams = (req: Request) => {
  const parseResult = podcastInfoQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    // Extract detailed validation errors
    const errors = parseResult.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    throw new Error(JSON.stringify(errors));
  }

  const { podcast } = parseResult.data;

  return {
    podcast: podcast.trim(),
  };
};

// Handler function for /api/podcast-info
export const podcastInfoHandler = async (
  req: Request,
  res: Response,
  context: KeystoneContext
) => {
  // Allow only GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  let parsedParams;
  try {
    parsedParams = parsePodcastInfoQueryParams(req);
  } catch (validationError: any) {
    // Parse the JSON stringified errors back to an object
    let errorDetails;
    try {
      errorDetails = JSON.parse(validationError.message);
    } catch {
      errorDetails = [{ message: 'Invalid query parameters.' }];
    }
    return res.status(400).json({ error: 'Invalid query parameters', details: errorDetails });
  }

  const { podcast } = parsedParams;

  try {
    // Fetch podcast details
    const podcastData = await context.query.Podcast.findOne({
      where: { id: podcast },
      query: 'id title description imageUrl category', // Adjust fields as needed
    });

    if (!podcastData) {
      return res.status(404).json({ error: 'Podcast not found.' });
    }

    // Fetch total episodes
    const totalEpisodes = await context.query.Episode.count({
      where: { podcast: { id: { equals: podcast } } },
    });

    // Fetch total seasons using distinct seasons
    const seasons = await context.query.Episode.findMany({
      where: { podcast: { id: { equals: podcast } }, season: { not: { equals: 0 } } },
      query: 'season',
    });

    const uniqueSeasons = new Set<number>();
    seasons.forEach((episode) => {
      uniqueSeasons.add(episode.season);
    });

    const totalSeasons = uniqueSeasons.size;

    // Check for unknown season (season = 0)
    const hasUnknownSeason = await context.query.Episode.count({
      where: { podcast: { id: { equals: podcast } }, season: { equals: 0 } },
    }) > 0;

    // Respond with podcast details and aggregated data
    res.status(200).json({
      data: {
        podcast: podcastData,
        totalEpisodes,
        totalSeasons,
        hasUnknownSeason,
      },
    });
  } catch (error: any) {
    console.error('Error fetching podcast info:', error);
    res.status(500).json({ error: 'Failed to fetch podcast info', details: error.message });
  }
};
-