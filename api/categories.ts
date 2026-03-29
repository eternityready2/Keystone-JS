import { Request, Response } from 'express';
import { KeystoneContext } from '@keystone-6/core/types';
import { z } from 'zod';

const querySchema = z.object({});

export const categoriesHandler = async (
  req: Request,
  res: Response,
  context: KeystoneContext
) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Validate query parameters
    const parseResult = querySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid query parameters.' });
    }

    // Fetch the podcast categories directly from the database
    const podcasts = await context.query.Podcast.findMany({
      query: 'categories',
    });

    // Normalize and prepare unique categories from the CSV field
    const uniqueCategories = Array.from(
      new Set(
        podcasts
          .flatMap((podcast) =>
            podcast.categories ? podcast.categories.split(',') : []
          )
          .map((category) => category.trim().toLowerCase())
      )
    )
      .map((category) => category.charAt(0).toUpperCase() + category.slice(1)) // Capitalize
      .sort((a, b) => a.localeCompare(b)); // Sort alphabetically

    res.status(200).json({ categories: uniqueCategories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories.',
    });
  }
};
