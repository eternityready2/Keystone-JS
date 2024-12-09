// scripts/syncEpisodes.ts
import keystoneConfig from '../keystone'; // Adjust the path based on your project structure
import { Keystone } from '@keystone-6/core';
import fetch from 'node-fetch';
import xml2js from 'xml2js';

async function main() {
  // Initialize Keystone with your configuration
  const keystone = new Keystone(keystoneConfig);
  
  // Connect to the database
  await keystone.connect();

  // Create a context for performing queries and mutations
  const context = keystone.createContext({ skipAccessControl: true });

  // Fetch all podcasts
  const podcasts = await context.query.Podcast.findMany({
    query: 'id title rssFeedUrl syncFrequency lastSyncedAt',
  });

  for (const podcast of podcasts) {
    try {
      // Fetch the RSS feed
      const response = await fetch(podcast.rssFeedUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch RSS feed for podcast "${podcast.title}": ${response.statusText}`);
      }
      const text = await response.text();
      
      // Parse the RSS feed
      const rssData = await xml2js.parseStringPromise(text, { explicitArray: false });

      const items = rssData.rss.channel.item;

      for (const item of items) {
        // Determine a unique identifier for the episode (e.g., audioUrl)
        const audioUrl = item.enclosure?.$?.url;
        if (!audioUrl) {
          console.warn(`Episode "${item.title}" does not have an audio URL. Skipping.`);
          continue;
        }

        // Check if the episode already exists
        const existingEpisode = await context.query.Episode.findOne({
          where: { audioUrl: audioUrl },
          query: 'id',
        });

        if (!existingEpisode) {
          // Create a new episode
          await context.query.Episode.createOne({
            data: {
              title: item.title,
              description: item.description,
              audioUrl: audioUrl,
              releaseDate: new Date(item.pubDate),
              duration: parseDuration(item['itunes:duration']),
              podcast: { connect: { id: podcast.id } },
              seasonNumber: item['itunes:season'] ? parseInt(item['itunes:season']) : null,
              episodeNumber: item['itunes:episode'] ? parseInt(item['itunes:episode']) : null,
              explicit: item['itunes:explicit'] || 'no',
            },
          });
          console.log(`Added episode: ${item.title}`);
        }
      }

      // Update the lastSyncedAt timestamp
      await context.query.Podcast.updateOne({
        where: { id: podcast.id },
        data: { lastSyncedAt: new Date() },
      });
    } catch (error) {
      console.error(`Error syncing podcast "${podcast.title}":`, error);
    }
  }

  // Disconnect from Keystone
  await keystone.disconnect();
}

// Helper function to parse duration strings (e.g., "1:02:30") into seconds
function parseDuration(durationStr: string): number {
  const parts = durationStr.split(':').map(Number);
  let seconds = 0;
  if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    seconds = parts[0];
  }
  return seconds;
}

main()
  .then(() => {
    console.log('Episode synchronization complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Synchronization failed:', error);
    process.exit(1);
  });
