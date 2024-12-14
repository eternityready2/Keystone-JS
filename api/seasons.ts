// api/seasons.ts

import { Request, Response } from 'express';
import { KeystoneContext } from '@keystone-6/core/types';
import { z } from 'zod';

// Define a schema for query parameters using Zod for validation
const seasonsQuerySchema = z.object({
  podcast: z.string().min(1, { message: 'Podcast ID is required.' }),
});

// Helper function to parse and validate query parameters
const parseSeasonsQueryParams = (req: Request) => {
  const parseResult = seasonsQuerySchema.safeParse(req.query);
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

// Handler function for /api/seasons
export const seasonsHandler = async (
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
    parsedParams = parseSeasonsQueryParams(req);
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
    // Fetch all episodes for the given podcast, selecting only 'season' field
    const episodes = await context.query.Episode.findMany({
      where: {
        podcast: { id: { equals: podcast } },
      },
      query: 'season',
    });

    // Extract unique season numbers using a Set
    const seasonsSet = new Set<number>();
    episodes.forEach((episode) => {
      if (episode.season !== undefined && episode.season !== null) {
        seasonsSet.add(episode.season);
      }
    });

    const seasons = Array.from(seasonsSet).sort((a, b) => a - b); // Sort seasons in ascending order

    // Respond with the list of seasons
    res.status(200).json({
      data: seasons,
    });
  } catch (error: any) {
    console.error('Error fetching seasons:', error);
    res.status(500).json({ error: 'Failed to fetch seasons', details: error.message });
  }
};
