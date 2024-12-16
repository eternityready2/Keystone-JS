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

    // Fetch categories directly from the Category list
    const categoriesData = await context.query.Category.findMany({
      query: `
        id
        name
      `,
    });

    // Normalize and prepare categories
    const uniqueCategories = categoriesData
      .map((category) => category.name?.trim().toLowerCase())
      .filter((name): name is string => !!name) // Remove null or undefined names
      .map((name) => name.charAt(0).toUpperCase() + name.slice(1)) // Capitalize
      .sort((a, b) => a.localeCompare(b)); // Sort alphabetically

    res.status(200).json({ categories: uniqueCategories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories.',
      details: error.message,
    });
  }
};
