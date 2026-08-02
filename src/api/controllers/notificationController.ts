import { Request, Response } from "express";
import { dbCommand, dbQuery } from "../db.js";
import { safeObjectId, parsePagination } from "../../lib/utils.js";
import { paginate } from "../../lib/pagination.js";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { page, limit, skip } = parsePagination(req.query);
    const DEFAULT_NOTIFICATIONS = [
      {
        id: "welcome",
        title: "Welcome to YuvaHub! ✨",
        message: "Ready to find your next break? The real data pipeline is active.",
        type: "welcome",
        time: "Just now",
        read: false
      }
    ];

    if (!dbQuery) {
      const sliced = DEFAULT_NOTIFICATIONS.slice(skip, skip + limit);
      return res.json(paginate(sliced, page, limit, DEFAULT_NOTIFICATIONS.length));
    }

    const collection = dbQuery.collection("notifications");
    let items;
    let total = 0;

    if ((dbQuery as any).isMock) {
      items = (collection as any).data ? (collection as any).data.filter((n: any) => n.userId === user.uid || n.userId === "global-subscribers") : [];
      total = items.length;
      items = items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(skip, skip + limit);
    } else {
      const filter = {
        $or: [
          { userId: user.uid },
          { userId: "global-subscribers" }
        ]
      };
      [items, total] = await Promise.all([
        collection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
        collection.countDocuments(filter)
      ]);
    }

    const formatted = items.map((item: any) => {
      const copy = { ...item, id: item._id?.toString() || item.id || "welcome" };
      delete copy._id;

      const elapsedMs = Date.now() - new Date(copy.createdAt).getTime();
      const elapsedMins = Math.floor(elapsedMs / 60000);
      if (elapsedMins < 1) copy.time = "Just now";
      else if (elapsedMins < 60) copy.time = `${elapsedMins}m ago`;
      else {
        const elapsedHrs = Math.floor(elapsedMins / 60);
        if (elapsedHrs < 24) copy.time = `${elapsedHrs}h ago`;
        else copy.time = new Date(copy.createdAt).toLocaleDateString();
      }

      return copy;
    });

    res.json(paginate(formatted, page, limit, total));
  } catch (err: any) {
    console.error("GET /api/v1/notifications error:", err);
    const welcome = [{
      id: "welcome",
      title: "Welcome to YuvaHub! ✨",
      message: "Ready to find your next break? The real data pipeline is active.",
      type: "welcome",
      time: "Just now",
      read: false
    }];
    res.json(paginate(welcome, 1, 20, welcome.length));
  }
};

export const markRead = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const rawNotifId = req.params.id;
    const id = Array.isArray(rawNotifId) ? rawNotifId[0] : rawNotifId;
    if (!dbCommand) return res.json({ success: true });

    const collection = dbCommand.collection("notifications");
    const oid = safeObjectId(id);
    const queryId = oid || id;

    if ((dbCommand as any).isMock) {
      const notif = (collection as any).data ? (collection as any).data.find((n: any) => n.id === id || n._id?.toString() === id) : null;
      if (notif) notif.read = true;
    } else {
      await collection.updateOne(
        { _id: queryId, userId: user.uid },
        { $set: { read: true } }
      );
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/v1/notifications/:id/read error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const markAllRead = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!dbCommand) return res.json({ success: true });

    const collection = dbCommand.collection("notifications");

    if ((dbCommand as any).isMock) {
      if ((collection as any).data) {
        (collection as any).data.forEach((n: any) => {
          if (n.userId === user.uid) n.read = true;
        });
      }
    } else {
      await collection.updateMany(
        { userId: user.uid },
        { $set: { read: true } }
      );
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/v1/notifications/read-all error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const markBulkRead = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { notificationIds, all } = req.body;
    if (!dbCommand) return res.json({ updatedCount: 0 });

    const collection = dbCommand.collection("notifications");

    if (!Array.isArray(notificationIds) && !all) {
      return res.status(400).json({ error: "Invalid payload: notificationIds must be an array or all must be true" });
    }

    let filter: any = { userId: user.uid, read: { $ne: true } };

    if (!all && Array.isArray(notificationIds) && notificationIds.length > 0) {
      const oids = notificationIds.map((id: string) => safeObjectId(id) || id);
      filter._id = { $in: oids };
    }

    if ((dbCommand as any).isMock) {
      let updatedCount = 0;
      if ((collection as any).data) {
        (collection as any).data.forEach((n: any) => {
          if (n.userId === user.uid && n.read !== true) {
            let match = false;
            if (all || !notificationIds || notificationIds.length === 0) {
              match = true;
            } else {
              match = notificationIds.includes(n.id) || notificationIds.includes(n._id?.toString());
            }
            if (match) {
              n.read = true;
              n.isRead = true;
              updatedCount++;
            }
          }
        });
      }
      return res.json({ updatedCount });
    } else {
      const result = await collection.updateMany(
        filter,
        { $set: { read: true, isRead: true } }
      );
      res.json({ updatedCount: result.modifiedCount });
    }
  } catch (err: any) {
    console.error("PUT /api/v1/notifications/read-bulk error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
