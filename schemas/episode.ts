// schemas/Episode.ts
import { list } from '@keystone-6/core';
import { text, relationship, timestamp, integer, select } from '@keystone-6/core/fields';
import { allowAll } from '@keystone-6/core/access';

export const Episode = list({
  access: {
    operation: {
      query: allowAll, // Allow reading episodes
      create: () => false, // Disallow creating episodes
      update: () => false, // Disallow updating episodes
      delete: () => false, // Disallow deleting episodes
    },
    filter: {
      // No filters needed since all read operations are allowed
    },
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
