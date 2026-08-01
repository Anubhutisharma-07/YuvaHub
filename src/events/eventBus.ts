import * as amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// Dead-Letter Exchange / Queue configuration
const MAIN_EXCHANGE = 'domain_events';
const DLX_EXCHANGE = 'domain_events.dlx';
const DLQ_QUEUE = 'dlq.domain_events';
const MAX_RETRIES = 3;

class EventBus {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.ConfirmChannel | null = null;

  async connect(): Promise<void> {
    if (this.connection) return;

    try {
      this.connection = await amqp.connect(RABBITMQ_URL);
      // Use ConfirmChannel for publisher acknowledgments
      this.channel = await this.connection.createConfirmChannel();

      // Setup the main exchange for domain events
      await this.channel.assertExchange(MAIN_EXCHANGE, 'topic', { durable: true });

      // Setup Dead-Letter Exchange and Queue for failed messages
      await this.channel.assertExchange(DLX_EXCHANGE, 'topic', { durable: true });
      await this.channel.assertQueue(DLQ_QUEUE, { durable: true });
      await this.channel.bindQueue(DLQ_QUEUE, DLX_EXCHANGE, '#');

      console.log('[EventBus] Connected to RabbitMQ (ConfirmChannel + DLX enabled)');
    } catch (error) {
      console.warn('[EventBus] Offline (RabbitMQ server not running locally):', (error as Error).message);
      throw error;
    }
  }

  /**
   * Publish an event to the main exchange.
   * Returns a Promise that resolves to `true` when the broker confirms receipt,
   * or `false` if the publish was rejected.
   */
  async publish(routingKey: string, event: any): Promise<boolean> {
    if (!this.channel) {
      throw new Error('EventBus is not connected');
    }

    const payload = Buffer.from(JSON.stringify(event));

    return new Promise((resolve) => {
      this.channel!.publish(MAIN_EXCHANGE, routingKey, payload, { persistent: true }, (err) => {
        if (err) {
          console.error(`[EventBus] Publish failed for ${routingKey}:`, err);
          resolve(false);
        } else {
          // console.log(`[EventBus] Published ${routingKey}`, event.eventId);
          resolve(true);
        }
      });
    });
  }

  /**
   * Subscribe to a routing key with automatic retry and dead-letter routing.
   * Failed messages are retried up to MAX_RETRIES times, then routed to DLQ.
   */
  async subscribe(
    queueName: string,
    routingKey: string,
    handler: (event: any) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('EventBus is not connected');
    }

    // Configure queue with Dead-Letter Exchange
    await this.channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': DLX_EXCHANGE,
        'x-dead-letter-routing-key': `${queueName}.failed`
      }
    });
    await this.channel.bindQueue(queueName, MAIN_EXCHANGE, routingKey);

    await this.channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        await handler(event);
        this.channel!.ack(msg);
      } catch (error) {
        console.error(`[EventBus] Error handling message from ${queueName}:`, error);

        // Retry logic: check x-retry-count header
        const retryCount = (msg.properties.headers?.['x-retry-count'] as number) || 0;

        if (retryCount < MAX_RETRIES) {
          // Republish with incremented retry count for proper retry tracking
          const updatedHeaders = {
            ...(msg.properties.headers || {}),
            'x-retry-count': retryCount + 1
          };
          this.channel!.publish(
            MAIN_EXCHANGE,
            msg.fields.routingKey,
            msg.content,
            { ...msg.properties, headers: updatedHeaders }
          );
          this.channel!.ack(msg);
        } else {
          // Max retries exceeded — route to DLQ via nack without requeue
          console.warn(`[EventBus] Max retries (${MAX_RETRIES}) exceeded for ${queueName}. Routing to DLQ.`);
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
    console.log('[EventBus] Disconnected');
  }
}

export const eventBus = new EventBus();