// api/categories.ts

import { Request, Response } from 'express';
import { KeystoneContext } from '@keystone-6/core/types';
import { z } from 'zod';

// Define allowed origins if needed (optional)
const allowedOrigins = ['http://erpodcasts']; // Update as per your requirements

// Define a schema for query parameters using Zod for validation (if needed)
const querySchema = z.object({
  // No query parameters expected for this endpoint
});

// Handler function for /api/categories
export const categoriesHandler = async (
  req: Request,
  res: Response,
  context: KeystoneContext
) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Optional: Validate request (currently no query parameters)
    const parseResult = querySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid query parameters.' });
    }

    // **Fetch distinct categories using Prisma's `findMany` with `distinct`**
    const categoriesData = await context.db.Podcast.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    // **Extract category values and filter out any null or undefined values**
    const rawCategories = categoriesData
      .map((podcast) => podcast.category)
      .filter((category): category is string => typeof category === 'string');

    // **Normalize categories: trim whitespace and convert to lowercase**
    const normalizedCategories = rawCategories.map((category) =>
      category.trim().toLowerCase()
    );

    // **Use a Set to remove duplicates after normalization**
    const uniqueNormalizedCategoriesSet = new Set<string>(normalizedCategories);

    // **Convert the set back to an array**
    const uniqueNormalizedCategories = Array.from(
      uniqueNormalizedCategoriesSet
    );

    // **Capitalize the first letter of each category for presentation**
    const uniqueCategories = uniqueNormalizedCategories.map((category) =>
      category.charAt(0).toUpperCase() + category.slice(1)
    );

    // **Optionally, sort the categories alphabetically**
    uniqueCategories.sort((a, b) => a.localeCompare(b));

    res.status(200).json({ categories: uniqueCategories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories.',
      details: error.message,
    });
  }
};
