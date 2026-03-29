// Import necessary modules
import fetch from "node-fetch";
import xml2js from "xml2js";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import pLimit from "p-limit";
import { generateSlug } from "./slugify";
import { addMemoryLog } from "../services/memoryLog";

/**
 * Parses a duration string in the format "HH:MM:SS" or "MM:SS" into total seconds.
 * @param duration - The duration string to parse.
 * @returns The total duration in seconds, or null if parsing fails.
 */
const parseDurationToSeconds = (duration: string): number | null => {
  if (!duration) return null;

  const parts = duration.split(":").map(Number);
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return null;
};

// Set concurrency limit for image processing
const CONCURRENCY_LIMIT = 1;
const limit = pLimit(CONCURRENCY_LIMIT);

/**
 * Downloads an image from a given URL, optimizes it, resizes it, and saves it to the specified path in WebP format.
 * @param imageUrl - The URL of the image to download.
 * @param savePath - The directory path where the image will be saved.
 * @param resizeOptions - The desired width and height for resizing.
 * @param podcastId - The ID of the podcast, used for organizing images.
 * @returns The relative path to the saved image, or null if an error occurs.
 */
const downloadAndSaveImage = async (
  imageUrl: string,
  savePath: string,
  resizeOptions: { width: number; height: number },
  podcastId: string
): Promise<string | null> => {
  return limit(async () => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok)
        throw new Error(`Failed to download image: ${response.statusText}`);

      const buffer = await response.buffer();
      const urlPath = new URL(imageUrl).pathname;
      const originalFileName = path.basename(urlPath);
      const fileExtension = path.extname(originalFileName).toLowerCase();
      const fileNameWithoutExt = path.basename(originalFileName, fileExtension);
      const optimizedFileName = `${fileNameWithoutExt}.webp`; // Convert all images to WebP for consistency
      const filePath = path.join(savePath, optimizedFileName);

      // Ensure the save directory exists
      await fs.mkdir(savePath, { recursive: true });

      // Initialize sharp with the buffer
      const image = sharp(buffer)
        .resize(resizeOptions.width, resizeOptions.height, { fit: "cover" })
        .toFormat("webp", { quality: 80 }) // Convert to WebP with quality 80
        .withMetadata(false); // Strip metadata to reduce size

      // Save the optimized image
      await image.toFile(filePath);

      console.log(`Image saved to ${filePath}`);

      // Return the relative path to be stored in the database
      return `/images/${podcastId}/${optimizedFileName}`;
    } catch (error) {
      console.error(
        `Error downloading or resizing image (${imageUrl}): ${
          (error as Error).message
        }`
      );
      return null;
    }
  });
};

/**
 * Deletes images in the specified directory that are not present in the savedImagePaths set.
 * @param savedImagePaths - A set of relative image paths that should be retained.
 * @param imageDirectory - The directory where images are stored.
 */
const deleteUnusedImages = async (
  savedImagePaths: Set<string>,
  imageDirectory: string
) => {
  try {
    const files = await fs.readdir(imageDirectory);

    const deletePromises = files.map(async (file) => {
      const filePath = path.join(imageDirectory, file);
      const relativePath = `/images/${path.basename(imageDirectory)}/${file}`;

      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile() && !savedImagePaths.has(relativePath)) {
          await fs.unlink(filePath);
          console.log(`Removed unused image: ${filePath}`);
        }
      } catch (error) {
        console.error(
          `Error processing file ${filePath}: ${(error as Error).message}`
        );
      }
    });

    await Promise.all(deletePromises);
  } catch (error) {
    console.error(
      `Error cleaning up images in ${imageDirectory}: ${
        (error as Error).message
      }`
    );
  }
};

/**
 * Synchronizes podcast episodes by fetching the RSS feed, updating the database, and managing images.
 * @param podcastId - The ID of the podcast to synchronize.
 * @param context - The context object, typically provided by the framework (e.g., KeystoneJS).
 */
const syncEpisodes = async (podcastId: string, context: any) => {
  try {
    async function notifyFrontendOfUpdate() {
      const revalidationUrl = `https://podcasts.eternityready.com/api/revalidate?secret=${process.env.REVALIDATION_TOKEN}`;
      try {
        await fetch(revalidationUrl, { method: "POST" });
        console.log("Frontend cache successfully revalidated.");
      } catch (err) {
        console.error("Failed to revalidate frontend cache:", err);
      }
    }

    // Fetch the podcast details from the database
    const podcast = await context.query.Podcast.findOne({
      where: { id: podcastId },
      query: "rssFeedUrl title description imageUrl",
    });

    if (!podcast || !podcast.rssFeedUrl) {
      throw new Error(
        `Podcast with ID ${podcastId} not found or missing RSS feed URL.`
      );
    }

    const { rssFeedUrl } = podcast;
    console.log(
      `Starting synchronization for Podcast ID: ${podcastId} from ${rssFeedUrl}`
    );

    // Fetch the RSS feed
    const response = await fetch(rssFeedUrl);
    if (!response.ok) {
      const errorMessage = `Failed to fetch RSS feed: ${response.status} ${response.statusText}`;

      addMemoryLog({
        level: "ERROR",
        message: errorMessage,
        context: {
          function: "syncEpisodes",
          podcastId: podcastId,
          rssFeedUrl: rssFeedUrl,
        },
        stack: new Error(errorMessage).stack,
      });

      throw new Error(errorMessage);
    }

    const rssData = await response.text();
    const parsedData = await xml2js.parseStringPromise(rssData, {
      explicitArray: false,
    });
    const podcastChannel = parsedData?.rss?.channel;

    if (!podcastChannel) throw new Error("Invalid RSS feed format.");

    const baseImageDirectory = path.resolve("./public/images");
    const podcastImageDirectory = path.join(baseImageDirectory, podcastId);
    const savedImagePaths = new Set<string>();

    // Prepare podcast details
    const podcastDetails = {
      title: podcastChannel.title || podcast.title,
      description: podcastChannel.description || podcast.description,
      imageUrl:
        podcastChannel?.image?.url ||
        podcastChannel["itunes:image"]?.["$"]?.href ||
        podcast.imageUrl ||
        "/images/no-thumbnail.jpg",
      lastSyncedAt: new Date().toISOString(),
    };

    // Download and optimize the podcast image
    if (
      podcastDetails.imageUrl &&
      podcastDetails.imageUrl !== "/images/no-thumbnail.jpg"
    ) {
      const savedPodcastImagePath = await downloadAndSaveImage(
        podcastDetails.imageUrl,
        podcastImageDirectory,
        { width: 350, height: 350 }, // Podcast image size
        podcastId
      );
      if (savedPodcastImagePath) {
        podcastDetails.imageUrl = savedPodcastImagePath;
        savedImagePaths.add(savedPodcastImagePath);
      }
    }

    // Parse episodes from RSS feed
    const episodesFromRss = Array.isArray(podcastChannel.item)
      ? podcastChannel.item
      : [podcastChannel.item];
    const parsedEpisodes = await Promise.all(
      episodesFromRss.map(async (episode: any) => {
        let episodeImagePath: string | null = null;

        const episodeImageUrl = episode["itunes:image"]?.["$"]?.href;
        if (episodeImageUrl) {
          episodeImagePath = await downloadAndSaveImage(
            episodeImageUrl,
            podcastImageDirectory,
            { width: 125, height: 125 }, // Episode image size
            podcastId
          );
          if (episodeImagePath) {
            savedImagePaths.add(episodeImagePath);
          }
        }

        // Extract season and episode numbers, defaulting to 0 if not available
        const season = parseInt(episode["itunes:season"]) || 0;
        const episodeNumber = parseInt(episode["itunes:episode"]) || 0;

        return {
          title: episode.title,
          description: episode.description,
          audioUrl: episode.enclosure?.["$"]?.url,
          releaseDate: new Date(episode.pubDate).toISOString(),
          duration: parseDurationToSeconds(episode["itunes:duration"]),
          imageUrl: episodeImagePath || podcastDetails.imageUrl,
          season, // Season number
          episode: episodeNumber, // Episode number
        };
      })
    );

    // Update or create episodes in the database (create-first upsert to avoid TOCTOU race)
    for (const episode of parsedEpisodes) {
      try {
        try {
          // Try creating first — avoids race where two syncs check simultaneously
          await context.query.Episode.createOne({
            data: {
              ...episode,
              podcast: { connect: { id: podcastId } },
            },
          });
          console.log(`Created new episode: ${episode.title}`);
        } catch (createErr: any) {
          // Unique constraint or already exists — update instead
          const existingEpisodes = await context.query.Episode.findMany({
            where: {
              podcast: { id: { equals: podcastId } },
              title: { equals: episode.title },
            },
            query: "id",
          });

          if (existingEpisodes.length > 0) {
            const { slug, ...updateData } = episode;
            await context.query.Episode.updateOne({
              where: { id: existingEpisodes[0].id },
              data: updateData,
            });
            console.log(`Updated episode: ${episode.title}`);
          } else {
            // Re-throw if it wasn't a duplicate issue
            throw createErr;
          }
        }
      } catch (error) {
        console.error(
          `Error processing episode "${episode.title}": ${
            (error as Error).message
          }`
        );
      }
    }

    // Save updated podcast details to the database
    await savePodcastDetailsToDatabase(
      context,
      podcastId,
      podcastDetails,
      parsedEpisodes
    );

    // Cleanup unused images in the podcast directory
    await deleteUnusedImages(savedImagePaths, podcastImageDirectory);
    notifyFrontendOfUpdate();

    console.log("Synchronization completed successfully.");
  } catch (error) {
    const errorMessage = `Error syncing RSS feed: ${(error as Error).message}`;

    addMemoryLog({
      level: "ERROR",
      message: errorMessage,
      context: {
        function: "syncEpisodes",
        podcastId: podcastId,
      },
      stack: new Error(errorMessage).stack,
    });

    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Updates the podcast details in the database.
 * @param context - The context object, typically provided by the framework (e.g., KeystoneJS).
 * @param podcastId - The ID of the podcast to update.
 * @param podcastDetails - An object containing the updated podcast details.
 * @param episodes - An array of parsed episodes.
 */
const savePodcastDetailsToDatabase = async (
  context: any,
  podcastId: string,
  podcastDetails: {
    title: string;
    description: string;
    imageUrl?: string;
    lastSyncedAt?: string;
  },
  episodes: Array<{
    title: string;
    description: string;
    audioUrl: string;
    releaseDate: string;
    duration?: number | null;
    imageUrl?: string;
    season?: number;
    episode?: number;
  }>
) => {
  try {
    console.log(`Saving podcast details for Podcast ID: ${podcastId}`);

    const slug = generateSlug(podcastDetails.title);

    await context.query.Podcast.updateOne({
      where: { id: podcastId },
      data: {
        title: podcastDetails.title,
        description: podcastDetails.description,
        imageUrl: podcastDetails.imageUrl,
        lastSyncedAt: podcastDetails.lastSyncedAt,
        slug: slug,
      },
    });

    console.log("Podcast details updated successfully.");
  } catch (error) {
    console.error(`Error saving podcast details: ${(error as Error).message}`);
  }
};

export default syncEpisodes;
