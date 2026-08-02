import * as amqp from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";

const MAIN_EXCHANGE = "domain_events";
const RETRY_EXCHANGE = "domain_events_retry";
const DLX_EXCHANGE = "domain_events_dlx";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

class EventBus {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.ConfirmChannel | null = null;

  async connect(): Promise<void> {
    if (this.connection) return;

    try {
      this.connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await this.connection.createConfirmChannel();

      await this.channel.assertExchange(MAIN_EXCHANGE, "topic", { durable: true });
      await this.channel.assertExchange(RETRY_EXCHANGE, "topic", { durable: true });
      await this.channel.assertExchange(DLX_EXCHANGE, "topic", { durable: true });

      console.log("[EventBus] Connected to RabbitMQ (ConfirmChannel + DLX enabled)");
    } catch (error) {
      // Clean up on topology failure so reconnect is possible
      if (this.channel) {
        try { await this.channel.close(); } catch {}
        this.channel = null;
      }
      if (this.connection) {
        try { await this.connection.close(); } catch {}
        this.connection = null;
      }
      console.warn("[EventBus] Offline (RabbitMQ server not running locally):", (error as Error).message);
      throw error;
    }
  }

  async publish(routingKey: string, event: unknown): Promise<boolean> {
    if (!this.channel) {
      throw new Error("EventBus is not connected");
    }

    const payload = Buffer.from(JSON.stringify(event));

    return new Promise((resolve) => {
      this.channel!.publish(MAIN_EXCHANGE, routingKey, payload, { persistent: true }, (err) => {
        if (err) {
          console.error(`[EventBus] Publish failed for ${routingKey}:`, err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
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

    // Main queue – dead-letters to DLX on nack
    await this.channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": DLX_EXCHANGE,
        "x-dead-letter-routing-key": `${queueName}.failed`,
      },
    });
    await this.channel.bindQueue(queueName, MAIN_EXCHANGE, routingKey);

    // Retry queue – per-message expiration handles backoff; no queue-level TTL
    await this.channel.assertQueue(retryQueue, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": MAIN_EXCHANGE,
        "x-dead-letter-routing-key": routingKey,
      },
    });
    await this.channel.bindQueue(retryQueue, RETRY_EXCHANGE, routingKey);

    // Dead-letter queue – receives messages that exhausted retries
    await this.channel.assertQueue(dlq, { durable: true });
    await this.channel.bindQueue(dlq, DLX_EXCHANGE, `${queueName}.failed`);

    // Main consumer only (DLQ is for manual inspection, not auto-consumed)
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
          // Publish to retry exchange with exponential backoff
          this.channel!.publish(RETRY_EXCHANGE, routingKey, msg.content, {
            persistent: true,
            expiration: (RETRY_DELAY_MS * Math.pow(2, retries)).toString(),
            headers: {
              ...msg.properties.headers,
              "x-retry-count": retries + 1,
            },
          });
          this.channel!.ack(msg);
        } else {
          console.error(
            `[EventBus] Max retries (${MAX_RETRIES}) exceeded for ${queueName}. Routing to DLQ.`,
          );
          this.channel!.nack(msg, false, false);
        }
      }
    });

    console.log(`[EventBus] Subscribed to ${routingKey} via queue ${queueName} (DLX: ${DLX_EXCHANGE})`);
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
