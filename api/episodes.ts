import { Request, Response } from "express";
import { KeystoneContext } from "@keystone-6/core/types";
import { z } from "zod";

// MUDANÇA 1: O schema agora valida APENAS os parâmetros da query string.
// Removemos `podcast: z.string()` daqui.
const episodesQuerySchema = z.object({
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
    .default("1") // Usar default é mais limpo
    .transform(Number),
  limit: z
    .string()
    .regex(/^\d+$/, { message: "Limit must be a valid number." })
    .default("20") // Usar default é mais limpo
    .transform(Number),
});

// Handler function para a rota /api/episodes/:podcastId
export const episodesHandler = async (
  req: Request,
  res: Response,
  context: KeystoneContext
) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // MUDANÇA 2: Obter o ID do podcast diretamente dos parâmetros da rota.
  const { podcastId } = req.params;

  if (!podcastId) {
    return res
      .status(400)
      .json({ error: "Podcast ID is required in the URL path." });
  }

  try {
    // MUDANÇA 3: Validar apenas os parâmetros de consulta (req.query).
    const queryParams = episodesQuerySchema.parse(req.query);
    const { season, episode, search, page, limit } = queryParams;

    // MUDANÇA 4: Construir os filtros usando o `podcastId` da rota.
    const filters: any = {
      podcast: { slug: { equals: podcastId } }, // Usando o podcastId da rota
      season: { equals: season },
    };

    if (episode !== undefined) {
      filters.episode = { equals: episode };
    }

    if (search) {
      filters.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    console.log("Applied Filters:", filters);

    // MUDANÇA 5: O `skip` é calculado com os valores já validados e convertidos.
    const skip = (page - 1) * limit;

    // A busca no banco de dados continua igual.
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
        podcast { keywords }
      `,
      take: limit,
      skip: skip,
      orderBy: [{ releaseDate: "desc" }],
    });

    const total = await context.query.Episode.count({
      where: filters,
    });

    const totalPages = Math.ceil(total / limit);

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
    // Se o erro for do Zod, ele será capturado aqui
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid query parameters", details: error.errors });
    }

    console.error("Error fetching episodes:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch episodes", details: error.message });
  }
};

export const allEpisodesHandler = async (
  req: Request,
  res: Response,
  context: KeystoneContext
) => {
  try {
    const episodes = await context.query.Episode.findMany({
      query: `
        id
        title
        imageUrl
        audioUrl
        duration
        podcast {
          title
          keywords 
        }
      `,
      orderBy: [{ title: "asc" }],
    });

    const total = await context.query.Episode.count();

    res.status(200).json({
      total,
      data: episodes,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid query parameters", details: error.errors });
    }

    console.error("Error fetching episodes:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch episodes", details: error.message });
  }
};
