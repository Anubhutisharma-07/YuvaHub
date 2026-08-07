import { Worker, Job } from "bullmq";
import { connection } from "../queues/connection";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import crypto from "crypto";
import { generateOpportunityEmbedding } from "../services/embedding.js";

import { sendAdminAlert } from "../services/adminAlertService.js";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME || "yuvahub";

// Maintain a single MongoDB client for the worker
const mongoClient = new MongoClient(uri);
mongoClient.connect().catch((err) => {
  console.error("[ScraperWorker] MongoDB connection error:", err);
});

export const scraperWorker = new Worker(
  "scraper-jobs",
  async (job: Job) => {
    const { domain, url, type } = job.data;
    console.log(`[ScraperWorker] Processing job ${job.id} for domain: ${domain}, url: ${url}`);

    // MOCK extraction logic (In a real scenario, you'd use Axios/Puppeteer here)
    // Simulating delay for network request
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulate finding a new opportunity based on the job data
    const title = `Mock Opportunity from ${domain}`;
    const organization = `Mock Org ${domain}`;
    
    const dedupeHash = crypto
      .createHash("sha256")
      .update(`${domain}:${title}:${organization}`)
      .digest("hex");

    const opportunity = {
      url,
      title,
      company: organization,
      description: "This is a mock description extracted by the worker.",
      sourceName: domain,
      tags: ["Scraped", type],
      opportunityType: type,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      location: "Online",
      dedupe_hash: dedupeHash,
      createdAt: new Date().toISOString(),
      embedding: null as number[] | null,
    };

    const embeddingText = `${title} ${organization} ${opportunity.description} ${type}`;
    opportunity.embedding = await generateOpportunityEmbedding(embeddingText);

    // Upsert into MongoDB for idempotency
    const db = mongoClient.db(dbName);
    const result = await db.collection("opportunities").updateOne(
      { dedupe_hash: opportunity.dedupe_hash },
      { $set: opportunity },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log(`[ScraperWorker] Inserted new opportunity: ${title}`);
    } else {
      console.log(`[ScraperWorker] Updated existing opportunity: ${title}`);
    }

    return { status: "success", dedupe_hash: opportunity.dedupe_hash };
  },
  {
    connection: connection as any,
    // Rate Limiting: max 5 jobs per second
    limiter: {
      max: 5,
      duration: 1000,
    },
  }
);

scraperWorker.on("completed", (job) => {
  console.log(`[ScraperWorker] Job ${job.id} completed successfully.`);
});

scraperWorker.on("failed", (job, err) => {
  const attempt = job?.attemptsMade || 1;
  const maxAttempts = job?.opts.attempts || 3;

  if (attempt < maxAttempts) {
    console.warn(`[ScraperWorker] Job ${job?.id} attempt ${attempt}/${maxAttempts} failed: ${err.message}. Retrying automatically with exponential backoff...`);
  } else {
    console.error(`[ScraperWorker] Job ${job?.id} for domain ${job?.data?.domain} failed all ${maxAttempts} retry attempts! Permanent failure.`);
    if (job) {
      sendAdminAlert("ScraperWorker", job, err);
    }
  }
});

let scraperWorkerErrorLogged = false;
scraperWorker.on("error", (err) => {
  if (!scraperWorkerErrorLogged) {
    console.warn('[ScraperWorker] Redis connection offline. Worker listening paused.');
    scraperWorkerErrorLogged = true;
  }
});
