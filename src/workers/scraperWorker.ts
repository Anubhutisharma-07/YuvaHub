import { Worker, Job } from "bullmq";
import { connection } from "../queues/connection";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import crypto from "crypto";
import { generateOpportunityEmbedding } from "../services/embedding.js";
import { scrapeOpportunity } from "../services/scrapers/realScraper.js";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB_NAME || "yuvahub";

const mongoClient = new MongoClient(uri);

mongoClient.connect().catch((err) => {
  console.error("[ScraperWorker] MongoDB connection error:", err);
});

export const scraperWorker = new Worker(
  "scraper-jobs",
  async (job: Job) => {
    const { domain, url, type } = job.data;

    console.log(
      `[ScraperWorker] Processing job ${job.id} for domain: ${domain}, url: ${url}`
    );

    const scrapedItems = await scrapeOpportunity(domain, url, type);

    if (scrapedItems.length === 0) {
      throw new Error(`No opportunities extracted from ${url}`);
    }

    const db = mongoClient.db(dbName);
    const results = [];

    for (const item of scrapedItems) {
      const dedupeHash = crypto
        .createHash("md5")
        .update(`${item.sourceName}:${item.url}:${item.title}:${item.company}`)
        .digest("hex");

      const opportunity = {
        url: item.url,
        title: item.title,
        company: item.company,
        description: item.description,
        sourceName: item.sourceName,
        tags: item.tags,
        opportunityType: item.opportunityType,
        deadline: item.deadline,
        location: item.location,
        dedupeHash,
        createdAt: new Date().toISOString(),
        embedding: null as number[] | null,
      };

      const embeddingText = [
        item.title,
        item.company,
        item.description,
        item.opportunityType,
      ].join(" ");

      opportunity.embedding =
        await generateOpportunityEmbedding(embeddingText);

      const result = await db.collection("opportunities").updateOne(
        { dedupeHash: opportunity.dedupeHash },
        { $set: opportunity },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        console.log(
          `[ScraperWorker] Inserted real opportunity: ${item.title}`
        );
      } else {
        console.log(
          `[ScraperWorker] Updated existing opportunity: ${item.title}`
        );
      }

      results.push({
        title: item.title,
        dedupeHash: opportunity.dedupeHash,
      });
    }

    return {
      status: "success",
      source: domain,
      count: results.length,
      results,
    };
  },
  {
    connection: connection as any,

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
  console.error(
    `[ScraperWorker] Job ${job?.id} failed with error: ${err.message}`
  );

  if (
    job &&
    job.opts.attempts &&
    job.attemptsMade === job.opts.attempts
  ) {
    console.error(
      `[ALERT] Scraper Job ${job.id} for domain ${job.data.domain} failed ${job.attemptsMade} times in a row!`
    );
  }
});