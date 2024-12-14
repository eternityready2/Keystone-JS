// api/episodes.ts

import { Request, Response } from 'express';
import { KeystoneContext } from '@keystone-6/core/types';
import { z } from 'zod';

// Define allowed categories or other filters if needed
const allowedCategories = ['technology', 'health', 'education', 'family']; // Adjust as needed

// Define a schema for query parameters using Zod for validation
const episodesQuerySchema = z.object({
  podcast: z.string(),
  season: z
  .string()
  .regex(/^\d+$/, { message: "Season must be a valid number." })
  .transform((val) => parseInt(val, 10)),
  episode: z
    .string()
    .regex(/^\d+$/, { message: "Episode must be a valid number." })
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  search: z.string().optional(),
  page: z
    .string()
    .regex(/^\d+$/, { message: "Page must be a valid number." })
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/, { message: "Limit must be a valid number." })
    .optional(),
});

// Helper function to parse and validate query parameters
const parseEpisodesQueryParams = (req: Request) => {
  const parseResult = episodesQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    // Extract detailed validation errors
    const errors = parseResult.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    throw new Error(JSON.stringify(errors));
  }

  const { podcast, season, episode, search, page = '1', limit = '20' } = parseResult.data;

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);

  return {
    podcast: podcast.trim(),
    season: season === 0 || season > 0 ? season : 1,
    episode: episode !== undefined ? (isNaN(episode) || episode < 1 ? undefined : episode) : undefined,
    search: search ? search.trim() : undefined,
    page: isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
    limit: isNaN(parsedLimit) || parsedLimit < 1 ? 20 : parsedLimit,
  };
};

// Handler function for /api/episodes
export const episodesHandler = async (
  req: Request,
  res: Response,
  context: KeystoneContext
) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let parsedParams;
  try {
    parsedParams = parseEpisodesQueryParams(req);
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

  const { podcast, season, episode, search, page, limit } = parsedParams;

  try {
    // Build filters based on query parameters
    const filters: any = {
    podcast: { id: { equals: podcast } },
      season: { equals: season },
    };

    if (episode !== undefined) {
      filters.episode = { equals: episode };
    }

    if (search) {
      // Use 'contains' for substring matches in title or description
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    console.log('Applied Filters:', filters);

    // Pagination calculations
    const skip = (page - 1) * limit;

    // Fetch episodes with applied filters and pagination
    const episodes = await context.query.Episode.findMany({
      where: filters,
      query: `
        id
        season
        episode
        title
        description
        imageUrl
        audioUrl
        releaseDate
        duration
        createdAt
        updatedAt
      `, // Removed 'podcast' from the query string
      take: limit,
      skip: skip,
      orderBy: { episode: 'asc' }, // Order by episode number ascending
    });

    // Fetch total count for pagination
    const total = await context.query.Episode.count({
      where: filters,
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Respond with episodes data
    res.status(200).json({
      data: episodes,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({ error: 'Failed to fetch episodes', details: error.message });
  }
};
