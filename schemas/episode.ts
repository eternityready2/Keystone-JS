// schemas/Episode.ts
import { list } from '@keystone-6/core';
import { text, relationship, timestamp, integer, select } from '@keystone-6/core/fields';
import { allowAll } from '@keystone-6/core/access';

export const Episode = list({
  access: {
    operation: {
      query: allowAll, // Allow read access
      create: () => false, // Disallow creation via Admin UI
      update: () => false, // Disallow updates via Admin UI
      delete: () => false, // Disallow deletion via Admin UI
    },
    filter: {
      // No additional filters
    },
  },
  ui: {
    isHidden: true, // Hide the Episode list from the Admin UI
  },
  fields: {
    title: text({
      validation: { isRequired: true },
      label: 'Episode Title',
    }),
    description: text({
      ui: { displayMode: 'textarea' },
      label: 'Episode Description',
    }),
    audioUrl: text({
      validation: { isRequired: true },
      label: 'Audio URL',
    }),
    releaseDate: timestamp({
      validation: { isRequired: true },
      label: 'Release Date',
    }),
    duration: integer({
      validation: { isRequired: true },
      label: 'Duration (seconds)',
    }),
    podcast: relationship({
      ref: 'Podcast.episodes',
      many: false,
      label: 'Podcast',
      ui: {
        // Display podcast title in the relationship field
        displayMode: 'select',
        labelField: 'title',
      },
    }),
    seasonNumber: integer({
      label: 'Season Number',
      validation: { isRequired: false },
    }),
    episodeNumber: integer({
      label: 'Episode Number',
      validation: { isRequired: false },
    }),
    explicit: select({
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
        { label: 'Clean', value: 'clean' },
      ],
      label: 'Explicit Content',
      ui: {
        displayMode: 'segmented-control',
        createView: { fieldMode: 'hidden' },
      },
      defaultValue: 'no',
    }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
      label: 'Created At',
    }),
    updatedAt: timestamp({
      defaultValue: { kind: 'now' },
      isIndexed: true,
      label: 'Updated At',
    }),
  },
});
