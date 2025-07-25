import cron from "node-cron";
import syncEpisodes from "./api/sync"; // Assume you already have a syncEpisodes function
import type { KeystoneContext } from "@keystone-6/core/types";

async function syncPodcasts(context: KeystoneContext) {
  // Schedule the task to run every minute for testing
  cron.schedule("0 * * * *", async () => {
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

      const currentHour = now.getUTCHours();
      const currentDay = now.getUTCDay(); // Sunday = 0
      const currentDate = now.getUTCDate(); // Day of the month

      const todayUTCString = now.toISOString().slice(0, 10);

      function convertTo24Hour(hourStr: string, period: string) {
        let hour = parseInt(hourStr, 10);
        if (period.toLowerCase() === "am" && hour === 12) {
          return 0;
        }
        if (period.toLowerCase() === "pm" && hour !== 12) {
          return hour + 12;
        }
        return hour;
      }

      for (const podcast of podcasts) {
        const { syncTime, lastSyncedAt, id, rssFeedUrl } = podcast;
        if (!syncTime || !rssFeedUrl) continue;

        // Parse syncTime into individual components
        const [frequency, hour, period, extra] = syncTime.split("|");

        // Convert hour to 24-hour format
        const scheduledHour = convertTo24Hour(hour, period);

        if (scheduledHour !== currentHour) continue;

        const lastSyncDayUTCString = lastSyncedAt
          ? new Date(lastSyncedAt).toISOString().slice(0, 10)
          : null;

        // if (
        //   frequency === "daily" ||
        //   frequency === "weekly" ||
        //   frequency === "monthly" ||
        //   (frequency === "custom" && lastSyncDayUTCString === todayUTCString)
        // ) {
        //   console.log(`Skipping sync for ${id}, already synced today.`);
        //   continue;
        // }

        if (frequency === "daily") {
          console.log(`Syncing daily podcast: ${podcast.id}`);
          await syncEpisodes(podcast.id, context); // Run daily sync logic
        } else if (frequency === "weekly") {
          const dayMap = {
            sun: 0,
            mon: 1,
            tue: 2,
            wed: 3,
            thu: 4,
            fri: 5,
            sat: 6,
          };
          if (dayMap[extra as keyof typeof dayMap] === currentDay) {
            console.log(`Syncing weekly podcast: ${podcast.id}`);
            await syncEpisodes(podcast.id, context); // Run weekly sync logic
          }
        } else if (frequency === "monthly") {
          const specifiedDay = parseInt(extra, 10);

          // Determine the last day of the current month
          const lastDayOfMonth = new Date(
            now.getUTCFullYear(),
            now.getUTCMonth() + 1,
            0
          ).getUTCDate();

          if (
            specifiedDay === currentDate ||
            (specifiedDay > lastDayOfMonth && currentDate === lastDayOfMonth)
          ) {
            console.log(`Syncing monthly podcast: ${podcast.id}`);
            await syncEpisodes(podcast.id, context); // Run monthly sync logic
          }
        } else if (frequency === "custom") {
          const requiredDays = parseInt(extra, 10);
          const lastSyncDate = lastSyncedAt
            ? new Date(lastSyncedAt)
            : new Date(0);
          const diffDays = Math.floor(
            (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diffDays >= requiredDays) {
            console.log(`Syncing custom podcast: ${podcast.id}`);
            await syncEpisodes(podcast.id, context); // Run custom sync logic
          }
        }
      }
    } catch (error) {
      console.error("Error in scheduler:", error);
    }
  });
}

export default syncPodcasts;
