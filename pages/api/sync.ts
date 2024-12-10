// pages/api/sync.ts
import { NextApiRequest, NextApiResponse } from 'next';
import syncEpisodes from '../../sync';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { podcastId, rssFeedUrl } = req.body;

  try {
    await syncEpisodes(rssFeedUrl, podcastId, { /* Pass your Keystone context */ });
    res.status(200).json({ message: 'Sync completed successfully' });
  } catch (error) {
    console.error('Failed to sync episodes:', error);
    res.status(500).json({ error: 'Failed to sync episodes' });
  }
}
