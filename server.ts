import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";

import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { ScholarshipSchema, AIEvaluationResponseSchema } from "./src/models/scholarshipSchema.js";
import { isToxic, createToxicityMiddleware } from "./src/services/toxicity.js";
import { authenticateUser, deleteFirebaseUser } from "./src/middleware/auth.js";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";
import { v2 as cloudinary } from "cloudinary";
import { meiliClient, initializeSearchSync } from "./src/services/searchSync.js";
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { scraperQueue } from './src/queues/scraperQueue.js';
import { generateOpportunityEmbedding } from "./src/services/embedding.js";
import {
  createApplication,
  confirmApplication,
  updateApplicationStatus,
  retryApplication,
  getApplicationHistory,
} from "./src/services/applicationService.js";

import http from "http";
import path from "path";
import * as Sentry from "@sentry/node";
import { Server as SocketIOServer } from "socket.io";
import swaggerUi from "swagger-ui-express";


import { initializeDatabase, dbCommand, dbQuery, closeDatabaseConnections } from "./src/api/db.js";
import { setSocketIO } from "./src/api/socketInstance.js";
import { setupSocketEvents } from "./src/socket/index.js";
import { runDeadlineChecks, runWeeklyDigest } from "./src/services/deadlineScheduler.js";
import { analyticsBuffer } from "./src/api/analytics.js";
import { stopSearchSync } from "./src/services/searchSync.js";

// Import Main API Router
import apiRoutes from "./src/api/routes/index.js";

import { eventBus } from "./src/events/eventBus.js";
import { createNotificationConsumer } from "./src/consumers/notificationConsumer.js";
import { createOpportunityScrapedConsumer } from "./src/consumers/opportunityScrapedConsumer.js";
import swaggerSpec from "./src/config/swagger.js";

import { validateStartupEnv } from "./src/config/envValidation.js";

dotenv.config();

// Validate required environment variables during startup (Issue #588)
validateStartupEnv();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
// --- Application Tracker API ---


app.get("/api/v1/applications", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);

    const applications = await getApplicationHistory(user.uid);

    res.json({
      status: "success",
      applications,
    });
  } catch (err: any) {
    console.error("GET /api/v1/applications error:", err);

    res.status(
      err.message?.startsWith("Unauthorized") ? 401 : 500
    ).json({
      error: err.message || "Internal Server Error",
    });
  }
});

app.post("/api/v1/applications", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);

    const application = await createApplication({
      ...req.body,
      userId: user.uid,
    });

    res.status(201).json({
      status: "success",
      ...application,
    });
  } catch (err: any) {
    console.error("POST /api/v1/applications error:", err);

    res.status(
      err.message?.startsWith("Unauthorized") ? 401 : 500
    ).json({
      error: err.message || "Internal Server Error",
    });
  }
});

app.post("/api/v1/applications/:id/confirm", async (req, res) => {
  try {
    await getAuthenticatedUser(req);

    const application = await confirmApplication(
      req.params.id
    );

    res.json({
      status: "success",
      application,
    });
  } catch (err: any) {
    console.error(
      "POST /api/v1/applications/:id/confirm error:",
      err
    );

    res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
});

app.patch("/api/v1/applications/:id/status", async (req, res) => {
  try {
    await getAuthenticatedUser(req);

    const { status, message } = req.body;

    if (!status) {
      return res.status(400).json({
        error: "Missing application status",
      });
    }

    await updateApplicationStatus(
      req.params.id,
      status,
      message
    );

    res.json({
      status: "success",
    });
  } catch (err: any) {
    console.error(
      "PATCH /api/v1/applications/:id/status error:",
      err
    );

    res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
});

app.post("/api/v1/applications/:id/retry", async (req, res) => {
  try {
    await getAuthenticatedUser(req);

    await retryApplication(req.params.id);

    res.json({
      status: "success",
    });
  } catch (err: any) {
    console.error(
      "POST /api/v1/applications/:id/retry error:",
      err
    );

    res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
});
// --- Application Tracker API ---

// Get authenticated user's applications
app.get("/api/v1/applications", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);

    const status = req.query.status as string | undefined;
    const opportunityId = req.query.opportunityId as string | undefined;

    const applications = await getApplicationHistory(user.uid, {
      status: status as any,
      opportunityId,
    });

    res.json({
      status: "success",
      applications,
    });
  } catch (err: any) {
    console.error("GET /api/v1/applications error:", err);

    res
      .status(err.message?.startsWith("Unauthorized") ? 401 : 500)
      .json({
        error: err.message || "Internal Server Error",
      });
  }
});


// Create an application tracker entry
app.post("/api/v1/applications", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);

    if (!dbQuery) {
      return res.status(503).json({
        error: "Database not available",
      });
    }

    const {
      opportunityId,
      status,
      notes,
    } = req.body;

    if (!opportunityId) {
      return res.status(400).json({
        error: "Missing opportunityId",
      });
    }

    // Validate the opportunity exists
    const { ObjectId } = await import("mongodb");

    let opportunityQuery: any;

    try {
      opportunityQuery = {
        _id: new ObjectId(opportunityId),
      };
    } catch {
      opportunityQuery = {
        id: opportunityId,
      };
    }

    const opportunity = await dbQuery
      .collection("opportunities")
      .findOne(opportunityQuery);

    if (!opportunity) {
      return res.status(404).json({
        error: "Opportunity not found",
      });
    }

    const application = await createApplication({
      userId: user.uid,
      opportunityId,
      opportunity: {
        title: opportunity.title || "Untitled Opportunity",
        organization:
          opportunity.company ||
          opportunity.organization,
        platform:
          opportunity.sourceName ||
          opportunity.source_name,
        applyUrl:
          opportunity.apply_link ||
          opportunity.url,
      },
      platform:
        opportunity.sourceName ||
        opportunity.source_name ||
        "unknown",
      status: status || "interested",
      notes: notes || "",
      deadline:
        opportunity.deadlineDate ||
        opportunity.deadline,
      userConfirmed: false,
    });

    res.status(201).json({
      status: "success",
      application,
    });
  } catch (err: any) {
    console.error("POST /api/v1/applications error:", err);

    res
      .status(err.message?.startsWith("Unauthorized") ? 401 : 500)
      .json({
        error: err.message || "Internal Server Error",
      });
  }
});


// Update application tracker details
app.patch("/api/v1/applications/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);

    const { id } = req.params;

    const {
      status,
      notes,
      deadline,
    } = req.body;

    if (
      status === undefined &&
      notes === undefined &&
      deadline === undefined
    ) {
      return res.status(400).json({
        error: "No fields to update",
      });
    }

    await updateApplicationTracker(
      id,
      user.uid,
      {
        status,
        notes,
        deadline,
      }
    );

    res.json({
      status: "success",
      message: "Application updated successfully",
    });
  } catch (err: any) {
    console.error(
      "PATCH /api/v1/applications/:id error:",
      err
    );

    const statusCode =
      err.message === "Application not found"
        ? 404
        : err.message?.startsWith("Unauthorized")
          ? 401
          : 500;

    res.status(statusCode).json({
      error:
        err.message || "Internal Server Error",
    });
  }
});


// Delete application tracker entry
app.delete("/api/v1/applications/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);

    if (!dbQuery) {
      return res.status(503).json({
        error: "Database not available",
      });
    }

    const { id } = req.params;

    const result = await dbQuery
      .collection("applications")
      .deleteOne({
        _id: id as any,
        userId: user.uid,
      });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: "Application not found",
      });
    }

    res.json({
      status: "success",
      message: "Application removed successfully",
    });
  } catch (err: any) {
    console.error(
      "DELETE /api/v1/applications/:id error:",
      err
    );

    res
      .status(err.message?.startsWith("Unauthorized") ? 401 : 500)
      .json({
        error: err.message || "Internal Server Error",
      });
  }
});
const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: true,
  validate: false,
  store: createFailOpenStore('rate-limit:ai-chat:'),
  keyGenerator: (req) => {
    return req.body?.userId || req.ip || "unknown";

const app = express();
const server = http.createServer(app);

// Socket.IO Configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],

  },
});
setSocketIO(io);

// Swagger API Documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "YuvaHub API Docs",
}));

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// Setup API Routes
app.use("/api", apiRoutes);

// SEO Routes (root-level for crawler discovery)
app.get("/robots.txt", (req: Request, res: Response) => {
  const baseUrl = process.env.APP_URL || "https://yuvahub.xyz";
  const robotsTxt = [
    "User-agent: *",
    "Allow: /",
    "Allow: /opportunities",
    "Allow: /about",
    "Allow: /privacy",
    "Allow: /terms",
    "Allow: /cookies",
    "Allow: /guidelines",
    "Allow: /security",
    "Allow: /support",
    "Allow: /legal",
    "Allow: /opportunity/",
    "Disallow: /admin/",
    "Disallow: /dashboard/",
    "Disallow: /bookmarks/",
    "Disallow: /submit/",
    "Disallow: /settings/",
    "Disallow: /profile/",
    "Disallow: /mentorship/",
    "Disallow: /community/",
    "Disallow: /ai_assistant/",
    "Disallow: /api/",
    "",
    "Content-Signal: ai-train=no, search=yes, ai-input=no",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    "",
  ].join("\n");
  res.header("Content-Type", "text/plain");
  res.send(robotsTxt);
});

// XML escaping helper for safe sitemap generation
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "<";
      case ">": return ">";
      case "&": return "&";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}

app.get("/sitemap.xml", async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.APP_URL || "https://yuvahub.xyz";
    const staticPaths = [
      "",
      "/opportunities",
      "/about",
      "/privacy",
      "/terms",
      "/cookies",
      "/guidelines",
      "/security",
      "/support",
      "/legal",
    ];

    const escapedBaseUrl = escapeXml(baseUrl);
    let urls = staticPaths.map((p) => {
      return `  <url>
    <loc>${escapedBaseUrl}${p}</loc>
    <changefreq>daily</changefreq>
    <priority>${p === "" ? "1.0" : "0.8"}</priority>
  </url>`;
    });

    // 3. Sort by our dynamic scores
    scoredItems.sort((a: any, b: any) => b.metrics.totalScore - a.metrics.totalScore);

    const paginatedItems = scoredItems.slice(0, limit);

    return {
      items: paginatedItems,
      next_page: searchRes.estimatedTotalHits && (skip + searchLimit < searchRes.estimatedTotalHits) ? page + 1 : null
    };
  } catch (scoreErr) {
    console.error("Scoring failure:", scoreErr);
    return { items: [], next_page: null };
  }
}

const __filename = typeof import.meta !== "undefined" && import.meta.url
  ? fileURLToPath(import.meta.url)
  : "";
const __dirname = __filename ? path.dirname(__filename) : "";

// MongoDB setup
const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB_NAME || "yuvahub";
import { CURATED_FALLBACKS } from "./src/services/staticFallbacks.js";
import fs from "fs";
import { initializeDNLDatabase } from "./src/services/dnl/metrics.js";
import { DNLDispatcher } from "./src/services/dnl/scheduler.js";
import { DevpostAdapter } from "./src/services/dnl/adapters/DevpostAdapter.js";
import { InternshalaAdapter } from "./src/services/dnl/adapters/InternshalaAdapter.js";

let dbCommand: any = null;
let dbQuery: any = null;
    // Fetch opportunities if DB is ready
    if (dbQuery) {
      try {
        const items = await dbQuery
          .collection("opportunities")
          .find({})
          .project({ _id: 1, title: 1, created_at: 1 })
          .toArray();

        const oppUrls = items.map((item: Record<string, any>) => {
          const id = escapeXml(item._id ? item._id.toString() : item.id);
          const title = item.title || "opportunity";
          const cleanTitle = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
          const lastmod = escapeXml(item.created_at
            ? new Date(item.created_at).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0]);
          return `  <url>
    <loc>${escapedBaseUrl}/opportunity/${id}/${cleanTitle}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
        });
        urls = urls.concat(oppUrls);
      } catch (dbErr) {
        console.error("[Sitemap] Error fetching opportunities:", dbErr);
      }
    }
    return { modifiedCount: 0 };
  }
  async insertOne(doc: any) { this.data.push(doc); return { insertedId: "mock_id" }; }
  async deleteOne(query: any) {
    const initialLen = this.data.length;
    const item = await this.findOne(query);
    if (item) {
      this.data = this.data.filter(r => r !== item);
    }
    return { deletedCount: this.data.length < initialLen ? 1 : 0 };
  }
  async countDocuments() { return this.data.length; }
  async createIndex(keys: any, options: any) { return "mock_index"; }
  aggregate() { return { toArray: async () => [] }; }
  initializeUnorderedBulkOp() {
    const ops: any[] = [];
    return {
      insert: (doc: any) => {
        ops.push(doc);
      },
      execute: async () => {
        this.data.push(...ops);
        return { ok: 1, nInserted: ops.length };
      }
    };
  }
}

class MockDB {
  isMock = true;
  collections: Record<string, MemoryCollection> = {
    opportunities: new MemoryCollection(CURATED_FALLBACKS.map(f => ({...f, created_at: new Date()}))),
    interactions: new MemoryCollection(),
    scraper_metrics: new MemoryCollection()
  };
  collection(name: string) { return this.collections[name] || (this.collections[name] = new MemoryCollection()); }
}

function setupDNL(database: any) {
  initializeDNLDatabase(database).then(() => {
    const dispatcher = new DNLDispatcher(database);
    dispatcher.registerAdapter(new DevpostAdapter());
    dispatcher.registerAdapter(new InternshalaAdapter());
    dispatcher.start(3600000); // 1 hour
    console.log("[DNL] Scheduler initialized and started.");
  }).catch(err => {
    console.error("[DNL] Setup failed:", err);
  });
}

if (commandUri && queryUri) {
  const commandClient = new MongoClient(commandUri);
  const queryClient = new MongoClient(queryUri);
if (uri) {
  const commandClient = new MongoClient(uri);
  const queryClient = new MongoClient(uri);
  
  Promise.all([commandClient.connect(), queryClient.connect()]).then(() => {
    dbCommand = commandClient.db(process.env.MONGODB_COMMAND_DB || dbName);
    dbQuery = queryClient.db(process.env.MONGODB_QUERY_DB || dbName);
    console.log(`[Database] Connected to Command and Query MongoDB pools`);
    setupDNL(dbCommand);
    initializeSearchSync(dbQuery);
    
    dbCommand.collection("opportunities").createIndex({ created_at: -1, source_quality_score: -1 })
      .then(() => console.log(`[Database] Created compound index on opportunities`))
      .catch((err: any) => console.error(`[Database] Failed to create index:`, err));

    dbCommand.collection("opportunities").createIndex(
      { dedupe_hash: 1 },
      { unique: true, partialFilterExpression: { dedupe_hash: { $exists: true } } }
    )
      .then(() => console.log(`[Database] Created unique index on opportunities.dedupe_hash`))
      .catch((err: any) => console.error(`[Database] Failed to create unique index on opportunities.dedupe_hash:`, err));

    dbQuery.collection("users").createIndex({ uid: 1 }, { unique: true })
      .then(() => console.log(`[Database] Created unique index on users.uid`))
      .catch((err: any) => console.error(`[Database] Failed to create index on users.uid:`, err));
    dbCommand.collection("users").createIndex({ firebaseUid: 1 }, { unique: true, sparse: true })
      .then(() => console.log(`[Database] Created unique sparse index on users.firebaseUid`))
      .catch((err: any) => console.error(`[Database] Failed to create unique index:`, err));
  }).catch(err => {
    console.error("[Database] Connection failed, falling back to Mock Data:", err);
    dbCommand = new MockDB();
    dbQuery = new MockDB();
    setupDNL(dbCommand);
    initializeSearchSync(dbQuery);
  });
} else {
  console.log("[Database] No MONGODB_URI provided. Running in Offline Mock mode.");
  dbCommand = new MockDB();
  dbQuery = new MockDB();
  setupDNL(dbCommand);
  initializeSearchSync(dbQuery);
}

    const sitemapXml = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...urls,
      `</urlset>`,
    ].join("\n");

    res.header("Content-Type", "application/xml");
    res.send(sitemapXml);
  } catch (err) {
    console.error("[Sitemap] Generation error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Serve the static frontend files generated by Vite in production
const frontendPath = path.join(process.cwd(), "dist");
app.use(express.static(frontendPath));

// SPA Fallback: Catch non-API GET requests cleanly without path-to-regexp issues
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === "GET" && !req.path.startsWith("/api/")) {
    return res.sendFile(path.join(frontendPath, "index.html"));
  }
  next();
});

// Fallback Route for API endpoints
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});

const PORT = process.env.PORT || 5000;

// ── Graceful Shutdown ─────────────────────────────────────────────────
let isShuttingDown = false;
const shutdownTimers: ReturnType<typeof setInterval>[] = [];

/** Safety net: force-exit if graceful shutdown takes too long. */
function setShutdownTimeout(ms = 10_000): void {
  setTimeout(() => {
    console.error("[Core] Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, ms).unref();
}

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[Core] Received ${signal}. Starting graceful shutdown...`);
  setShutdownTimeout();

  // 1. Stop accepting new HTTP connections
  await new Promise<void>((resolve) => {
    server.close(() => {
      console.log("[Core] HTTP server closed.");
      resolve();
    });
    // Socket.IO holds the server open; close its connections too.
    try {
      io.close(() => {
        console.log("[Core] Socket.IO closed.");
        resolve();
      });
    } catch (err) {
      resolve();
    }
  });

  // 2. Clear background scheduler intervals
  shutdownTimers.forEach((t) => clearInterval(t));

  // 3. Drain analytics buffer (safe — drainAndStop sets isShuttingDown flag,
  //    rejects new pushes, flushes remaining, then stops the interval)
  try {
    await analyticsBuffer.drainAndStop();
    console.log("[Core] Analytics buffer drained successfully.");
  } catch (err) {
    console.error("[Core] Error draining analytics buffer:", err);
  }

  // 4. Close search change stream, MongoDB clients, and Redis
  try {
    await stopSearchSync();
  } catch (err) {
    console.error("[Core] Error stopping search sync:", err);
  }
  try {
    await closeDatabaseConnections();
  } catch (err) {
    console.error("[Core] Error closing database connections:", err);
  }
  try {
    const { redisClient } = await import("./src/api/redis.js");
    if (redisClient?.status === "ready" || redisClient?.status === "connecting") {
      redisClient.disconnect();
      console.log("[Core] Redis disconnected.");
    }
  } catch (err) {
    console.error("[Core] Error closing Redis:", err);
  }

  // 5. Exit
  process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  console.error("[Core] Uncaught exception:", err);
  gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  console.error("[Core] Unhandled rejection:", reason);
  gracefulShutdown("unhandledRejection");
});

async function bootstrap() {
  try {
    // 1. Initialize databases and caches
    await initializeDatabase();
    
    // 2. Start the HTTP server
    server.listen(PORT, () => {
      console.log(`[Core] Express Server is listening on port ${PORT}`);
    });

    // 2. Setup Socket.IO Event Handlers
    setupSocketEvents();

    // 3. Initialize MongoDB Database Connections asynchronously
    initializeDatabase().catch((err: Error) => {
      console.warn("[Core] Database initialization fallback mode:", err.message);
    });

    // 4. Wire Event Bus Consumers (RabbitMQ) asynchronously
    eventBus
      .connect()
      .then(async () => {
        const notifHandler = await createNotificationConsumer(dbCommand);
        const scrapedHandler = await createOpportunityScrapedConsumer(dbCommand);
        await eventBus.subscribe("notifications", "opportunity.scraped", notifHandler);
        await eventBus.subscribe("opportunity-scraped", "opportunity.scraped", scrapedHandler);
        console.log("[Core] Event Bus consumers wired successfully");
      })
      .catch((err: Error) => {
        console.warn("[Core] Event Bus unavailable:", err.message);
      });

    // 5. Start Background Services
    if (process.env.NODE_ENV !== "test") {
      shutdownTimers.push(setInterval(() => runDeadlineChecks(dbCommand), 24 * 60 * 60 * 1000));
      shutdownTimers.push(setInterval(() => runWeeklyDigest(dbCommand), 7 * 24 * 60 * 60 * 1000));
      
      // Node.js Central Ingestion
      if (process.env.START_NODE_SCRAPER === "true") {
        console.log("[Scraper] Central Ingestion daemon enabled");
        import("child_process").then(({ spawn }) => {
          spawn("npx", ["tsx", "scrape-cli.ts"], {
            cwd: process.cwd(),
            detached: true,
            stdio: "ignore"
          }).unref();
        });
      }
    }
  } catch (error) {
    console.error("[Core] Failed to start server:", error);
    process.exit(1);
  }
}

// Only auto-start the server when not running in test mode
if (process.env.NODE_ENV !== "test") {
  bootstrap();
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  console.error("[Core] Uncaught exception:", err);
  gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  console.error("[Core] Unhandled rejection:", reason);
  gracefulShutdown("unhandledRejection");
});

export { app, server, bootstrap };