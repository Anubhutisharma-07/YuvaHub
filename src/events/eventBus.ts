import * as amqp from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";

const MAIN_EXCHANGE = "domain_events";
const RETRY_EXCHANGE = "domain_events_retry";
const DLX_EXCHANGE = "domain_events_dlx";

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // ms

class EventBus {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;

  async connect(): Promise<void> {
    if (this.connection) return;

    try {
      this.connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      // Setup exchanges
      await this.channel.assertExchange(MAIN_EXCHANGE, "topic", { durable: true });
      await this.channel.assertExchange(RETRY_EXCHANGE, "topic", { durable: true });
      await this.channel.assertExchange(DLX_EXCHANGE, "topic", { durable: true });

      console.log("[EventBus] Connected to RabbitMQ");
    } catch (error) {
      console.error("[EventBus] Connection failed:", error);
      throw error;
    }
  }

 async publish(
  routingKey: string,
  event: unknown,
): Promise<void>{
    if (!this.channel) {
      throw new Error("EventBus is not connected");
    }

    const payload = Buffer.from(JSON.stringify(event));
    this.channel.publish(MAIN_EXCHANGE, routingKey, payload, {
      persistent: true,
    });
  }

  async subscribe(
    queueName: string,
    routingKey: string,
    handler: (event: unknown) => Promise<void>,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error("EventBus is not connected");
    }

    const retryQueue = `${queueName}.retry`;
    const dlq = `${queueName}.dlq`;

    // Main queue – dead‑letter to DLX exchange
    await this.channel.assertQueue(retryQueue, {
  durable: true,
  arguments: {
    "x-dead-letter-exchange": MAIN_EXCHANGE,
    "x-dead-letter-routing-key": routingKey,
  },
});

    // Retry queue – expires after TTL and routes back to the main exchange
    await this.channel.assertQueue(retryQueue, {
  durable: true,
  arguments: {
    "x-message-ttl": RETRY_DELAY,
    "x-dead-letter-exchange": MAIN_EXCHANGE,
    "x-dead-letter-routing-key": routingKey,
  },
});

    // Dead‑letter queue – receives messages that exhausted retries
    await this.channel.assertQueue(dlq, { durable: true });

    // Bindings
// Bindings
await this.channel.bindQueue(
  queueName,
  MAIN_EXCHANGE,
  routingKey,
);

await this.channel.bindQueue(
  retryQueue,
  RETRY_EXCHANGE,
  routingKey,
);

await this.channel.bindQueue(
  dlq,
  DLX_EXCHANGE,
  routingKey,
);

    // Main consumer
    await this.channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        await handler(event);
        this.channel!.ack(msg);
      } catch (error) {
        console.error(`[EventBus] Error handling message from ${queueName}:`, error);

        const retries = Number(msg.properties.headers?.["x-retry-count"] ?? 0);

        if (retries < MAX_RETRIES) {
          // Publish to the retry exchange with exponential backoff
          this.channel!.publish(RETRY_EXCHANGE, routingKey, msg.content, {
            persistent: true,
            expiration: (RETRY_DELAY * Math.pow(2, retries)).toString(),
            headers: {
              ...msg.properties.headers,
              "x-retry-count": retries + 1,
            },
          });
          this.channel!.ack(msg);
        } else {
          // Max retries reached – send to dead‑letter exchange
          console.error(
            `[EventBus] Message moved to DLQ after ${MAX_RETRIES} retries.`,
          );
          this.channel!.publish(DLX_EXCHANGE, routingKey, msg.content, {
            persistent: true,
            headers: msg.properties.headers,
          });
          this.channel!.ack(msg);
        }
      }
    });

    // DLQ consumer – log and acknowledge
    await this.channel.consume(dlq, (msg) => {
      if (!msg) return;

      console.error(
  `[ALERT] Message reached DLQ for queue "${queueName}" after ${MAX_RETRIES} retries.`,
);

console.error(
  msg.content.toString(),
);

// TODO: Send Slack/email notification to administrators.

      this.channel!.ack(msg);
    });

    console.log(`[EventBus] Subscribed to ${routingKey} via queue ${queueName}`);
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
    console.log("[EventBus] Disconnected");
  }
}

export const eventBus = new EventBus();
