import fetch from 'node-fetch';
import xml2js from 'xml2js';

const parseDurationToSeconds = (duration: string): number | null => {
  if (!duration) return null;

  const parts = duration.split(':').map(Number);
  if (parts.length === 2) {
    // MM:SS format
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return null; // Invalid format
};

const syncEpisodes = async (podcastId: string, context: any) => {
  try {
    // Fetch the podcast details using the podcastId
    const podcast = await context.query.Podcast.findOne({
      where: { id: podcastId },
      query: 'rssFeedUrl title description imageUrl',
    });

    if (!podcast || !podcast.rssFeedUrl) {
      throw new Error(`Podcast with ID ${podcastId} not found or missing RSS feed URL.`);
    }

    const { rssFeedUrl } = podcast;

    console.log(`Starting synchronization for Podcast ID: ${podcastId} from ${rssFeedUrl}`);

    // Fetch and parse the RSS feed
    const response = await fetch(rssFeedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }

    const rssData = await response.text();
    const parsedData = await xml2js.parseStringPromise(rssData, { explicitArray: false });
    const podcastChannel = parsedData?.rss?.channel;

    if (!podcastChannel) {
      throw new Error('Invalid RSS feed format.');
    }

    const podcastDetails = {
      title: podcastChannel.title || podcast.title,
      description: podcastChannel.description || podcast.description,
      imageUrl: podcastChannel?.image?.url || podcastChannel['itunes:image']?.['$']?.href || podcast.imageUrl,
      lastSyncedAt: new Date().toISOString(),
    };

    const episodesFromRss = Array.isArray(podcastChannel.item) ? podcastChannel.item : [podcastChannel.item];
    const parsedEpisodes = episodesFromRss.map((episode) => ({
      title: episode.title,
      description: episode.description,
      audioUrl: episode.enclosure?.['$']?.url,
      releaseDate: new Date(episode.pubDate).toISOString(),
      duration: parseDurationToSeconds(episode['itunes:duration']),
    }));

    for (const episode of parsedEpisodes) {
      const existingEpisode = await context.query.Episode.findMany({
        where: {
          podcast: { id: { equals: podcastId } },
          title: { equals: episode.title },
        },
        query: 'id',
      });

      if (existingEpisode.length > 0) {
        // Update the existing episode
        await context.query.Episode.updateOne({
          where: { id: existingEpisode[0].id },
          data: { ...episode },
        });
      } else {
        // Create a new episode
        await context.query.Episode.createOne({
          data: { ...episode, podcast: { connect: { id: podcastId } } },
        });
      }
    }

    await savePodcastDetailsToDatabase(context, podcastId, podcastDetails, parsedEpisodes);

    console.log('Synchronization completed successfully.');
  } catch (error) {
    console.error('Error syncing RSS feed:', error);
  }
};

// Example database save function (replace with your actual DB logic)
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
  }>
) => {
  console.log(`Saving podcast details for Podcast ID: ${podcastId}`);

  // Update the podcast details
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
