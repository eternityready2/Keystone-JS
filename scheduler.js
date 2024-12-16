import cron from 'node-cron';
import syncEpisodes from './api/sync'; // Assume you already have a syncEpisodes function

async function syncPodcasts(context) {
  // Schedule the task to run every minute for testing
  cron.schedule('0 * * * *', async () => {
    console.log(`Scheduler running at ${new Date().toISOString()}`);

    try {
      // Fetch podcasts and syncTime field
      const podcasts = await context.query.Podcast.findMany({
        query: `
          id
          syncTime
          lastSyncedAt
          rssFeedUrl
        `,
      });

      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay(); // Sunday = 0
      const currentDate = now.getDate(); // Day of the month

      for (const podcast of podcasts) {
        const { syncTime, lastSyncedAt, id, rssFeedUrl } = podcast;
        if (!syncTime || !rssFeedUrl) continue;

        // Parse syncTime into individual components
        const [frequency, hour, period, extra] = syncTime.split('|');

        // Convert hour to 24-hour format
        const scheduledHour = parseInt(hour, 10) + (period === 'pm' && hour !== '12' ? 12 : 0) % 24;

        if (scheduledHour !== currentHour) continue;

        if (frequency === 'daily') {
          console.log(`Syncing daily podcast: ${podcast.id}`);
          await syncEpisodes(podcast.id, context); // Run daily sync logic
        } else if (frequency === 'weekly') {
          const dayMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
          if (dayMap[extra] === currentDay) {
            console.log(`Syncing weekly podcast: ${podcast.id}`);
            await syncEpisodes(podcast.id, context); // Run weekly sync logic
          }
        } else if (frequency === 'monthly') {
          const specifiedDay = parseInt(extra, 10);
        
          // Determine the last day of the current month
          const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        
          if (specifiedDay === currentDate || (specifiedDay > lastDayOfMonth && currentDate === lastDayOfMonth)) {
            console.log(`Syncing monthly podcast: ${podcast.id}`);
            await syncEpisodes(podcast.id, context); // Run monthly sync logic
          }
        }
         else if (frequency === 'custom') {
          const requiredDays = parseInt(extra, 10);
          const lastSyncDate = lastSyncedAt ? new Date(lastSyncedAt) : new Date(0);
          const diffDays = Math.floor((now - lastSyncDate) / (1000 * 60 * 60 * 24));

          if (diffDays >= requiredDays) {
            console.log(`Syncing custom podcast: ${podcast.id}`);
            await syncEpisodes(podcast.id, context); // Run custom sync logic
          }
        }
      }
    } catch (error) {
      console.error('Error in scheduler:', error);
    }
  });
}

export default syncPodcasts;
