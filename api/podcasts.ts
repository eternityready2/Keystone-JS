// lib/podcasts.ts

import { Request, Response } from "express";
import { KeystoneContext } from "@keystone-6/core/types";
import { z } from "zod";

// Define a schema for query parameters using Zod for validation
const querySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

// Helper function to parse and validate query parameters
const parseQueryParams = (req: Request) => {
  const parseResult = querySchema.safeParse(req.query);
  if (!parseResult.success) {
    throw new Error("Invalid query parameters");
  }

  const { category, search, page = "1", limit = "20" } = parseResult.data;

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);

  return {
    category: typeof category === "string" ? category.trim() : undefined,
    search: typeof search === "string" ? search.trim() : undefined,
    page: isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
    limit: isNaN(parsedLimit) || parsedLimit < 1 ? 20 : parsedLimit,
  };
};

// Handler function for /api/podcasts
export const podcastsHandler = async (
  req: Request,
  res: Response,
  context: KeystoneContext
) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let parsedParams;
  try {
    parsedParams = parseQueryParams(req);
  } catch (validationError: any) {
    return res.status(400).json({ error: validationError.message });
  }

  const { category, search, page, limit } = parsedParams;

  try {
    // Build filters based on query parameters
    const filters: any = {};
    if (category) {
      filters.OR = [
        { categories: { equals: category } },
        { categories: { contains: `${category},` } },
        { categories: { contains: `,${category},` } },
        { categories: { contains: `,${category}` } },
      ];
    }

    if (search) {
      filters.OR = [
        ...(filters.OR || []),
        { title: { contains: search } },
        { description: { contains: search } },
        { keywords: { contains: search } },
        { categories: { contains: search } },
      ];
    }

    console.log("Applied Filters:", filters);

    // Pagination calculations
    const skip = (page - 1) * limit;

    // Fetch podcasts with applied filters and pagination
    const podcasts = await context.query.Podcast.findMany({
      where: filters,
      query: `
        id
        title
        description
        keywords
        categories
        imageUrl
        rssFeedUrl
        syncTime
        lastSyncedAt
        slug
      `, // Adjust fields as needed
      take: limit,
      skip: skip,
      orderBy: { title: "asc" }, // Optional: order by creation date
    });

    // Fetch total count for pagination
    const total = await context.query.Podcast.count({
      where: filters,
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Respond with podcasts data
    res.status(200).json({
      data: podcasts,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("Error fetching podcasts:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch podcasts", details: error.message });
  }
};
