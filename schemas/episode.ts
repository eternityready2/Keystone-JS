// schemas/Episode.ts
import { list } from '@keystone-6/core';
import { text, relationship, timestamp, integer, select } from '@keystone-6/core/fields';
import { allowAll } from '@keystone-6/core/access';

export const Episode = list({
  access: {
    operation: {
      query: allowAll, // Allow read access for all contexts
      create: ({ session, context }) => {
        // Allow creation only from server-side processes
        return !!context.sudo || !!session?.isServer;
      },
      update: ({ session, context }) => {
        // Allow updates only from server-side processes
        return !!context.sudo || !!session?.isServer;
      },
      delete: ({ session, context }) => {
        // Allow deletion only from server-side processes
        return !!context.sudo || !!session?.isServer;
      },
    },
  },
  fields: {
    season: integer({ 
      validation: { isRequired: true },
      db: { isIndexed: true },
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      },
     }),
     episode: integer({ 
      validation: { isRequired: true },
      db: { isIndexed: true },
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      },
     }),
    title: text({ 
      validation: { isRequired: true },
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      },
     }),
     description: text({
      db: {
        nativeType: 'LongText', // Use for medium-sized descriptions
      },
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      },
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
    audioUrl: text({
      db: {
        nativeType: 'LongText',
      },
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      },
    }),
    releaseDate: timestamp({
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      },
    }),
    duration: integer({
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      },
    }),
    podcast: relationship({
      ref: 'Podcast.episodes',
      many: false,
      label: 'Podcast',
      ui: {
        // Display podcast title in the relationship field
        displayMode: 'select',
        labelField: 'title',
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      },
    }),
    createdAt: timestamp({
      defaultValue: { kind: 'now' },
      label: 'Created At',
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      },
    }),
    updatedAt: timestamp({
      defaultValue: { kind: 'now' },
      isIndexed: true,
      label: 'Updated At',
      ui: {
        createView: { fieldMode: 'hidden' },
        itemView: { fieldMode: 'read' },
        listView: { fieldMode: 'read' },
      },
    }),
  },
  ui: {
    hideCreate: true, // Hides the "Add" button from the list view
    createView: { fieldMode: 'hidden' }, // Prevents access to the create form
  },
});
