// Welcome to Keystone!
//
// This file is what Keystone uses as the entry-point to your headless backend
//
// Keystone imports the default export of this file, expecting a Keystone configuration object
//   you can find out more at https://keystonejs.com/docs/apis/config

import { config } from '@keystone-6/core'

// to keep this file tidy, we define our schema in a different file
import { lists } from './schema'

// authentication is configured separately here too, but you might move this elsewhere
// when you write your list-level access control functions, as they typically rely on session data
import { withAuth, session } from './auth'

import express from 'express';

import syncEpisodes from './sync'; // Adjust the path to your sync file


export default withAuth(
  config({
    db: {
      // we're using sqlite for the fastest startup experience
      //   for more information on what database might be appropriate for you
      //   see https://keystonejs.com/docs/guides/choosing-a-database#title
      provider: 'mysql',
      url: 'mysql://ERPodcast:719719719@localhost:3306/erpodcasts',
    },
    lists,
    session,
    server: {
      extendExpressApp: (app, context) => {
        // Add JSON body parser middleware
        app.use(express.json());
  
        // Define the /api/sync route
        app.post('/api/sync', async (req, res) => {
          const { podcastId } = req.body; // Now req.body should be parsed properly
  
          if (!podcastId) {
            return res.status(400).json({ error: 'Podcast ID is required.' });
          }
  
          try {
            await syncEpisodes(podcastId, context); // Call your sync logic
            res.status(200).json({ message: 'Sync completed successfully.' });
          } catch (error) {
            console.error('Error syncing episodes:', error);
            res.status(500).json({ error: 'Failed to sync episodes.' });
          }
        });
      },
    },
  }),
)
