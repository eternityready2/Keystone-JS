// schemas/Podcast.ts
import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  integer,
  select,
  checkbox,
} from "@keystone-6/core/fields";
import { allowAll } from "@keystone-6/core/access";
import { graphql } from "@keystone-6/core";
import syncEpisodes from "../api/sync";
import { SyncTimeField } from "../components/SyncTimeField";

import { generateSlug } from "../api/slugify";

export const Podcast = list({
  access: allowAll,
  fields: {
    rssFeedUrl: text({
      validation: {
        isRequired: true,
        match: {
          regex: /^https?:\/\/\S+$/,
          explanation: "RSS Feed URL must start with http:// or https://",
        },
      },
      label: "RSS Feed URL",
      isIndexed: "unique", // Enforce uniqueness
    }),
    isFeatured: checkbox({
      label: "Featured Podcast",
      defaultValue: false,
      ui: {
        displayMode: "checkbox",
        label: "Featured",
      },
    }),
    featuredAt: timestamp({
      // New field
      label: "Featured At",
      defaultValue: { kind: "now" },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "read" },
      },
    }),
    categories: text({ label: "Categories (comma seperated)" }),
    keywords: text({ label: "Keywords (comma seperated)" }),
    syncTime: text({
      ui: {
        views: "./admin/components/SyncTimeField",
      },
    }),
    lastSyncedAt: timestamp({
      label: "Last Synced At",
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "read" },
        views: "./admin/components/LastSyncedAtView", // Path to your custom component
      },
    }),
    title: text({
      label: "Podcast Title",
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "read" },
      },
    }),
    slug: text({
      isIndexed: "unique",
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "read" },
      },
    }),
    description: text({
      db: {
        nativeType: "LongText",
      },
      ui: {
        displayMode: "textarea",
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "read" },
      },
      label: "Podcast Description",
    }),
    imageUrl: text({
      label: "Podcast Image URL",
      validation: { isRequired: false },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "read" },
      },
    }),
    episodes: relationship({
      ref: "Episode.podcast",
      many: true,
      ui: {
        hideCreate: true,
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "read" },
        views: "./admin/components/EpisodesView", // Path to custom component
      },
    }),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "read" },
      },
    }),
    updatedAt: timestamp({
      defaultValue: { kind: "now" },
      ui: {
        createView: { fieldMode: "hidden" },
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "read" },
      },
      isIndexed: true,
    }),
  },

  hooks: {
    afterOperation: async ({ operation, item, context }) => {
      if (operation === "create") {
        // Cast `item` to the expected type for the Podcast schema
        const { rssFeedUrl, id } = item as { rssFeedUrl: string; id: string };

        if (!rssFeedUrl || !id) {
          console.error("Missing RSS feed URL or Podcast ID.");
          return;
        }

        console.log(`Podcast created: ${id} - ${rssFeedUrl}`);
        try {
          await syncEpisodes(id, context); // Run the sync logic
        } catch (error) {
          console.error("Failed to sync episodes:", error);
        }
      }
    },
    beforeOperation: async ({ operation, item, context }) => {
      if (operation === "delete" && item) {
        const podcastId = item.id;

        try {
          console.log(`Deleting episodes for Podcast ID: ${podcastId}`);

          // Fetch all episodes associated with the podcast
          const episodesToDelete = await context.query.Episode.findMany({
            where: { podcast: { id: { equals: podcastId } } },
            query: "id",
          });

          console.log(`Found ${episodesToDelete.length} episodes to delete.`);

          // Delete episodes individually
          for (const episode of episodesToDelete) {
            await context.query.Episode.deleteOne({
              where: { id: episode.id },
            });
          }

          console.log(
            `Episodes for Podcast ID ${podcastId} deleted successfully.`
          );
        } catch (error) {
          console.error(
            `Failed to delete episodes for Podcast ID: ${podcastId}`,
            error
          );
        }
      }
    },
  },
});
