// schemas/Podcast.ts
import { list } from '@keystone-6/core';
import { text, relationship, timestamp, integer, select } from '@keystone-6/core/fields';
import { allowAll } from '@keystone-6/core/access';
import { graphql } from '@keystone-6/core';
import syncEpisodes from '../api/sync';
import { CustomSyncDaysView } from '../components/CustomSyncDaysView';


export const Podcast = list({
  access: allowAll,
  fields: {
    rssFeedUrl: text({
      validation: {
        isRequired: true,
        match: {
          regex: /^https?:\/\/\S+$/,
          explanation: 'RSS Feed URL must start with http:// or https://',
        },
      },
      label: 'RSS Feed URL',
    }),
    category: text({ label: 'Category' }),
    keywords: text({ label: 'Keywords (comma seperated)' }),
    syncFrequency: select({
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Custom', value: 'custom' },
      ],
      defaultValue: 'weekly',
      validation: { isRequired: true },
      label: 'Sync Frequency',
      ui: {
        // Path should be relative to the project root
        views: './admin/components/syncFrequencyView',
      },
      
    }),
    customSyncDays: integer({
      label: 'Custom Sync Days',
      validation: { min: 1 },
      ui: {
        // Path should be relative to the project root
        views: './admin/components/CustomSyncDaysView',
      },
    }),
    lastSyncedAt: timestamp({
      label: 'Last Synced At',
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
        views: './admin/components/LastSyncedAtView', // Path to your custom component
      },
    }),
    title: text({
      label: 'Podcast Title',
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      },
    }),
    description: text({
      db: {
        nativeType: 'LongText',
      },
      ui: {
        displayMode: 'textarea',
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      },
      label: 'Podcast Description',
    }),
    imageUrl: text({
      label: 'Podcast Image URL',
      validation: { isRequired: false },
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      },
    }),
    episodes: relationship({
      ref: 'Episode.podcast',
      many: true,
      ui: {
        hideCreate: true,
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
        views: './admin/components/EpisodesView', // Path to custom component
      },
    }),
    
    createdAt: timestamp({ defaultValue: { kind: 'now' },
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      },
     }),
    updatedAt: timestamp({ defaultValue: { kind: 'now' },
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      }, isIndexed: true }),
  },
  db: {
    // Define compound uniqueness for podcast and episodeNumber
    indexes: [
      {
        fields: ['podcast', 'title'],
        unique: true,
      },
    ],
  },
  
  hooks: {
    afterOperation: async ({ operation, item, context }) => {
      if (operation === 'create') {
        // Cast `item` to the expected type for the Podcast schema
        const { rssFeedUrl, id } = item as { rssFeedUrl: string; id: string };

        if (!rssFeedUrl || !id) {
          console.error('Missing RSS feed URL or Podcast ID.');
          return;
        }

        console.log(`Podcast created: ${id} - ${rssFeedUrl}`);
        try {
          await syncEpisodes(id, context); // Run the sync logic
        } catch (error) {
          console.error('Failed to sync episodes:', error);
        }
      }
    },
    beforeOperation: async ({ operation, item, context }) => {
      if (operation === 'delete' && item) {
        const podcastId = item.id;
    
        try {
          console.log(`Deleting episodes for Podcast ID: ${podcastId}`);
    
          // Fetch all episodes associated with the podcast
          const episodesToDelete = await context.query.Episode.findMany({
            where: { podcast: { id: { equals: podcastId } } },
            query: 'id',
          });
    
          console.log(`Found ${episodesToDelete.length} episodes to delete.`);
    
          // Delete episodes individually
          for (const episode of episodesToDelete) {
            await context.query.Episode.deleteOne({ where: { id: episode.id } });
          }
    
          console.log(`Episodes for Podcast ID ${podcastId} deleted successfully.`);
        } catch (error) {
          console.error(`Failed to delete episodes for Podcast ID: ${podcastId}`, error);
        }
      }
    },
    
  },
});
