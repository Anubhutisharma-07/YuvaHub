import { enqueueEmail } from "../queues/emailQueue";
import { enqueuePushNotification } from "../queues/pushQueue";
import { Notification } from "../models/notificationSchema";
import { getSocketIO } from "../../server";
import { generateDeadlineReminderHtml, generateWeeklyDigestHtml } from "../workers/emailTemplates";

export async function runDeadlineChecks(db: any): Promise<void> {
  if (!db) {
    console.error("[DeadlineScheduler] Database connection not available.");
    return;
  }

  console.log("[DeadlineScheduler] Starting daily deadline scan...");

  try {
    const usersCollection = db.collection("users");
    const oppsCollection = db.collection("opportunities");
    const notifCollection = db.collection("notifications");

    // Fetch all users who have bookmarks and have deadline reminders enabled
    const userCursor = usersCollection.find({
      bookmarks: { $exists: true, $not: { $size: 0 } }
    });

    const now = new Date();
    const { ObjectId } = await import("mongodb");

    for await (const user of userCursor) {
      const prefs = user.notificationPreferences || {
        emailEnabled: true,
        pushEnabled: true,
        deadlineRemindersEnabled: true,
        skillAlertsEnabled: true,
        scholarshipAlertsEnabled: true,
        hackathonAlertsEnabled: true,
        opportunityAlertsEnabled: true
      };

      if (!prefs.deadlineRemindersEnabled) {
        continue;
      }

      const bookmarks = user.bookmarks || [];
      if (bookmarks.length === 0) continue;

      const objectIds = [];
      const stringIds = [];

      for (const oppId of bookmarks) {
        try {
          objectIds.push(new ObjectId(oppId));
        } catch {
          stringIds.push(oppId);
        }
      }

      const opportunities = await oppsCollection.find({
        $or: [
          { _id: { $in: objectIds } },
          { id: { $in: stringIds } }
        ]
      }).toArray();
      
      for (const oppId of bookmarks) {
        const opportunity = opportunities.find((o: any) => 
          (o._id && o._id.toString() === oppId.toString()) || o.id === oppId
        );

        if (!opportunity) {
          continue;
        }

        const deadlineStr = opportunity.deadline;
        if (!deadlineStr || deadlineStr.toLowerCase() === "tbd" || deadlineStr.toLowerCase() === "rolling") {
          continue;
        }

        const deadline = new Date(deadlineStr);
        if (isNaN(deadline.getTime())) {
          continue;
        }

        // Calculate difference in days
        const timeDiff = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        // Trigger alerts on 7, 3, 2 (~48 hours), 1, or 0 days remaining
        if (![7, 3, 2, 1, 0].includes(diffDays)) {
          continue;
        }

        let title = `Deadline approaching in ${diffDays} days!`;
        let message = `Reminder: The deadline for bookmarked opportunity "${opportunity.title}" is in ${diffDays} days (${deadline.toLocaleDateString()}).`;

        if (diffDays === 2) {
          title = `Deadline in 48 Hours (~2 Days)!`;
          message = `48-Hour Reminder: The deadline for bookmarked opportunity "${opportunity.title}" is in 2 days (${deadline.toLocaleDateString()}).`;
        } else if (diffDays === 1) {
          title = `Deadline Tomorrow!`;
          message = `Urgent Reminder: The deadline for bookmarked opportunity "${opportunity.title}" is tomorrow (${deadline.toLocaleDateString()}).`;
        } else if (diffDays === 0) {
          title = `Deadline is TODAY!`;
          message = `Urgent Reminder: Today is the last day to apply for bookmarked opportunity "${opportunity.title}".`;
        }

        // Check if user was already notified for this exact deadline condition (avoid duplicate alerts)
        const existing = await notifCollection.findOne({
          userId: user.uid,
          targetId: oppId,
          type: "deadline_reminder",
          title
        });

        if (existing) {
          continue;
        }

        // Create the notification document
        const notificationDoc: Notification = {
          userId: user.uid,
          type: "deadline_reminder",
          title,
          message,
          targetId: oppId,
          read: false,
          createdAt: new Date()
        };

        await notifCollection.insertOne(notificationDoc);
        console.log(`[DeadlineScheduler] Reminded user ${user.uid} of deadline for opportunity ${oppId} (${diffDays} days left)`);

        // Real-Time Socket.io push (foreground handling)
        const io = getSocketIO();
        if (io) {
          io.emit(`NOTIFICATION_RECEIVED_${user.uid}`, {
            id: oppId + "_" + diffDays,
            ...notificationDoc,
            time: "Just now"
          });
        }

        // Enqueue background email job with mobile-responsive HTML template
        if (prefs.emailEnabled && user.email) {
          const html = generateDeadlineReminderHtml(
            opportunity.title,
            opportunity.company || opportunity.organization || 'YuvaHub Partner',
            deadline.toLocaleDateString(),
            diffDays
          );

          await enqueueEmail({
            to: user.email,
            subject: `[YuvaHub] ${title}: ${opportunity.title}`,
            body: message,
            html
          });
        }

        // Enqueue background push job
        if (prefs.pushEnabled && user.fcmToken) {
          await enqueuePushNotification({
            userId: user.uid,
            message: `[YuvaHub] ${title}: ${opportunity.title}`
          });
        }
      }
    }
  } catch (err) {
    console.error("[DeadlineScheduler] Error running deadline reminders check:", err);
  }
}

/**
 * Weekly Summary Digest
 * Sends a weekly digest email to users summarizing all active bookmarks expiring in the next 7 days.
 */
export async function runWeeklyDigest(db: any): Promise<void> {
  if (!db) return;
  console.log("[DeadlineScheduler] Running weekly summary digest scan...");

  try {
    const usersCollection = db.collection("users");
    const oppsCollection = db.collection("opportunities");

    const userCursor = usersCollection.find({
      bookmarks: { $exists: true, $not: { $size: 0 } }
    });

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const { ObjectId } = await import("mongodb");

    for await (const user of userCursor) {
      if (!user.email) continue;

      const prefs = user.notificationPreferences || { emailEnabled: true };
      if (prefs.emailEnabled === false) continue;

      const bookmarks = user.bookmarks || [];
      if (bookmarks.length === 0) continue;

      const expiringOpps: Array<{ title: string; org: string; deadline: string }> = [];
      const objectIds = [];
      const stringIds = [];

      for (const oppId of bookmarks) {
        try {
          objectIds.push(new ObjectId(oppId));
        } catch {
          stringIds.push(oppId);
        }
      }

      const opportunities = await oppsCollection.find({
        $or: [
          { _id: { $in: objectIds } },
          { id: { $in: stringIds } }
        ]
      }).toArray();

      for (const oppId of bookmarks) {
        const opp = opportunities.find((o: any) => 
          (o._id && o._id.toString() === oppId.toString()) || o.id === oppId
        );

        if (!opp || !opp.deadline) continue;
        const deadline = new Date(opp.deadline);
        if (isNaN(deadline.getTime())) continue;

        if (deadline >= now && deadline <= nextWeek) {
          expiringOpps.push({
            title: opp.title,
            org: opp.company || opp.organization || '',
            deadline: deadline.toLocaleDateString()
          });
        }
      }

      if (expiringOpps.length > 0) {
        const html = generateWeeklyDigestHtml(user.name || 'Student', expiringOpps);
        await enqueueEmail({
          to: user.email,
          subject: `[YuvaHub] Your Weekly Bookmarks Summary Digest (${expiringOpps.length} Deadlines Closing Soon)`,
          body: `Hello ${user.name || 'Student'}, you have ${expiringOpps.length} bookmarked opportunities with deadlines this week.`,
          html
        });
        console.log(`[DeadlineScheduler] Sent weekly digest to ${user.email} with ${expiringOpps.length} opportunities.`);
      }
    }
  } catch (err) {
    console.error("[DeadlineScheduler] Error running weekly digest:", err);
  }
}
