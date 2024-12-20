export const latestPodcastsHandler = async (req: Request, res: Response, context: KeystoneContext) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    // Extract query parameters for pagination
    const { page = '1', limit = '10' } = req.query;
  
    const parsedPage = parseInt(page as string, 10);
    const parsedLimit = parseInt(limit as string, 10);
  
    const validatedPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
    const validatedLimit = isNaN(parsedLimit) || parsedLimit < 1 ? 10 : parsedLimit;
  
    const skip = (validatedPage - 1) * validatedLimit;
  
    try {
      // Fetch paginated podcasts
      const podcasts = await context.query.Podcast.findMany({
        query: `
          id
          title
          description
          categories
          imageUrl
        `,
        orderBy: { createdAt: 'desc' },
        take: validatedLimit,
        skip: skip,
      });
  
      // Fetch total count for pagination
      const total = await context.query.Podcast.count();
      const totalPages = Math.ceil(total / validatedLimit);
  
      // Randomize the order
      const randomizedPodcasts = podcasts.sort(() => Math.random() - 0.5);
  
      // Respond with paginated data
      res.status(200).json({
        data: randomizedPodcasts,
        pagination: {
          total,
          page: validatedPage,
          limit: validatedLimit,
          totalPages,
        },
      });
    } catch (error: any) {
      console.error('Error fetching latest podcasts:', error);
      res.status(500).json({ error: 'Failed to fetch latest podcasts', details: error.message });
    }
  };
  