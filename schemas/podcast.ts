// schemas/Podcast.ts
import { list } from '@keystone-6/core';
import { text, relationship, timestamp, integer } from '@keystone-6/core/fields';
import { allowAll } from '@keystone-6/core/access';

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
    keywords: text({ label: 'Keywords' }),
    syncFrequency: integer({
      defaultValue: 7,
      validation: { isRequired: true },
      label: 'Sync Frequency (days)',
    }),
    lastSyncedAt: timestamp({ label: 'Last Synced At' }),
    title: text({
      label: 'Podcast Title',
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      },
    }),
    description: text({
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
    createdAt: timestamp({ defaultValue: { kind: 'now' } }),
    updatedAt: timestamp({ defaultValue: { kind: 'now' }, isIndexed: true }),
  },
});
