import { Request, Response } from "express";
import { KeystoneContext } from "@keystone-6/core/types";

export const featuredPodcastsHandler = async (
  req: Request,
  res: Response,
  context: KeystoneContext
) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch featured podcasts in random order
    const podcasts = await context.query.Podcast.findMany({
      where: { isFeatured: { equals: true } },
      query: `
          id
          title
          description
          categories
          imageUrl
          slug
          featuredAt
        `,
    });

    res.status(200).json({ data: podcasts });
  } catch (error: any) {
    console.error("Error fetching featured podcasts:", error);
    res.status(500).json({
      error: "Failed to fetch featured podcasts",
      details: error.message,
    });
  }
};
