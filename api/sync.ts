import fetch from 'node-fetch';
import xml2js from 'xml2js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const parseDurationToSeconds = (duration: string): number | null => {
  if (!duration) return null;

  const parts = duration.split(':').map(Number);
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return null;
};

const downloadAndSaveImage = async (
  imageUrl: string,
  savePath: string,
  resizeOptions: { width: number; height: number },
  podcastId: string
): Promise<string | null> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);

    const buffer = await response.buffer();
    const fileName = path.basename(new URL(imageUrl).pathname);
    const filePath = path.join(savePath, fileName);

    // Ensure directory exists
    fs.mkdirSync(savePath, { recursive: true });

    // Resize and save the image
    await sharp(buffer)
      .resize(resizeOptions.width, resizeOptions.height, { fit: 'cover' })
      .toFile(filePath);

    console.log(`Image saved to ${filePath}`);

    // Return the relative path to be stored in the database
    return `/images/${podcastId}/${fileName}`;
  } catch (error) {
    console.error(`Error downloading or resizing image: ${error.message}`);
    return null;
  }
};

const deleteUnusedImages = (savedImagePaths: Set<string>, imageDirectory: string) => {
  try {
    const files = fs.readdirSync(imageDirectory);

    for (const file of files) {
      const filePath = path.join(imageDirectory, file);
      const relativePath = `/${path.relative('./public', filePath).replace(/\\/g, '/')}`;

      if (fs.statSync(filePath).isFile() && !savedImagePaths.has(relativePath)) {
        fs.unlinkSync(filePath);
        console.log(`Removed unused image: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`Error cleaning up images: ${error.message}`);
  }
};



const syncEpisodes = async (podcastId: string, context: any) => {
  try {
    const podcast = await context.query.Podcast.findOne({
      where: { id: podcastId },
      query: 'rssFeedUrl title description imageUrl',
    });

    if (!podcast || !podcast.rssFeedUrl) {
      throw new Error(`Podcast with ID ${podcastId} not found or missing RSS feed URL.`);
    }

    const { rssFeedUrl } = podcast;
    console.log(`Starting synchronization for Podcast ID: ${podcastId} from ${rssFeedUrl}`);

    const response = await fetch(rssFeedUrl);
    if (!response.ok) throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);

    const rssData = await response.text();
    const parsedData = await xml2js.parseStringPromise(rssData, { explicitArray: false });
    const podcastChannel = parsedData?.rss?.channel;

    if (!podcastChannel) throw new Error('Invalid RSS feed format.');

    const baseImageDirectory = './public/images';
    const podcastImageDirectory = path.join(baseImageDirectory, podcastId);
    const savedImagePaths = new Set<string>();

    // Save and resize podcast image
    const podcastDetails = {
      title: podcastChannel.title || podcast.title,
      description: podcastChannel.description || podcast.description,
      imageUrl: podcastChannel?.image?.url || podcastChannel['itunes:image']?.['$']?.href || podcast.imageUrl || '/images/no-thumbnail.jpg',
      lastSyncedAt: new Date().toISOString(),
    };

    if (podcastDetails.imageUrl) {
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

    const episodesFromRss = Array.isArray(podcastChannel.item) ? podcastChannel.item : [podcastChannel.item];
    const parsedEpisodes = await Promise.all(
      episodesFromRss.map(async (episode) => {
        let episodeImagePath: string | null = null;

        const episodeImageUrl = episode['itunes:image']?.['$']?.href;
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

        // Extract season and episode numbers, with default values if not available
        const season = parseInt(episode['itunes:season']) || 0;
        const episodeNumber = parseInt(episode['itunes:episode']) || 0;

        return {
          title: episode.title,
          description: episode.description,
          audioUrl: episode.enclosure?.['$']?.url,
          releaseDate: new Date(episode.pubDate).toISOString(),
          duration: parseDurationToSeconds(episode['itunes:duration']),
          imageUrl: episodeImagePath || podcastDetails.imageUrl,
          season, // Add season
          episode: episodeNumber, // Add episode number
        };
      })
    );

    for (const episode of parsedEpisodes) {
      const existingEpisode = await context.query.Episode.findMany({
        where: {
          podcast: { id: { equals: podcastId } },
          title: { equals: episode.title },
        },
        query: 'id',
      });

      if (existingEpisode.length > 0) {
        await context.query.Episode.updateOne({
          where: { id: existingEpisode[0].id },
          data: { ...episode },
        });
      } else {
        await context.query.Episode.createOne({
          data: { ...episode, podcast: { connect: { id: podcastId } } },
        });
      }
    }

    await savePodcastDetailsToDatabase(context, podcastId, podcastDetails, parsedEpisodes);

    // Cleanup unused images in the podcast directory
    deleteUnusedImages(savedImagePaths, podcastImageDirectory);

    console.log('Synchronization completed successfully.');
  } catch (error) {
    console.error('Error syncing RSS feed:', error);
  }
};

const savePodcastDetailsToDatabase = async (
  context: any,
  podcastId: string,
  podcastDetails: { title: string; description: string; imageUrl?: string; lastSyncedAt?: string },
  episodes: Array<{
    title: string;
    description: string;
    audioUrl: string;
    releaseDate: string;
    duration?: string;
    imageUrl?: string;
    season?: number | null;
    episode?: number | null;
  }>
) => {
  console.log(`Saving podcast details for Podcast ID: ${podcastId}`);

  await context.query.Podcast.updateOne({
    where: { id: podcastId },
    data: {
      title: podcastDetails.title,
      description: podcastDetails.description,
      imageUrl: podcastDetails.imageUrl,
      lastSyncedAt: podcastDetails.lastSyncedAt,
    },
  });
};

export default syncEpisodes;
