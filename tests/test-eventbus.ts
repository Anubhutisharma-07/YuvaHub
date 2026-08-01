import assert from "node:assert";
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);
const amqplibMod = req("amqplib");

let connectionEstablished = false;
let connectionClosed = false;
let channelCreated = false;
let channelClosed = false;
let publishedMessages: { exchange: string; routingKey: string; content: Buffer; options?: any }[] = [];
let subscribedQueues: { queue: string; exchange: string; routingKey: string; handler: Function }[] = [];
let ackedMessages = 0;
let nackedMessages = 0;

const mockChannel = {
  assertExchange: async (exchange: string, type: string, options: any) => {},
  assertQueue: async (queueName: string, options: any) => ({ queue: queueName }),
  bindQueue: async (queue: string, exchange: string, routingKey: string) => {},
  publish: (exchange: string, routingKey: string, content: Buffer, options?: any, callback?: (err: any) => void) => {
    publishedMessages.push({ exchange, routingKey, content, options });
    if (callback) callback(null);
    return true;
  },
  consume: async (queue: string, handler: Function) => {
    subscribedQueues.push({ queue, exchange: "domain_events", routingKey: "", handler });
    return { consumerTag: "mock_tag" };
  },
  ack: (msg: any) => {
    ackedMessages++;
  },
  nack: (msg: any, allUpTo: boolean, requeue: boolean) => {
    nackedMessages++;
  },
  close: async () => {
    channelClosed = true;
  }
};

const mockConnection = {
  createConfirmChannel: async () => {
    channelCreated = true;
    return mockChannel;
  },
  close: async () => {
    connectionClosed = true;
  }
};

let shouldFailConnection = true;
amqplibMod.connect = async (url: string) => {
  if (shouldFailConnection) {
    shouldFailConnection = false;
    throw new Error("Simulated connection failure");
  }
  connectionEstablished = true;
  return mockConnection;
};

const { eventBus } = await import("../src/events/eventBus.js");

import { describe, it, expect } from 'vitest';

describe('tests/test-eventbus.ts', () => {
  it('should execute without errors', async () => {
    try {
      console.log("Starting EventBus Regression Tests...");

      // 1. Connection Failure Handling
      try {
        await eventBus.connect();
        assert.fail("Should have thrown an error on connection failure");
      } catch (err: any) {
        assert.strictEqual(err.message, "Simulated connection failure", "EventBus should throw connection errors");
      }

      // 2. Successful Connection and Channel Creation
      process.env.RABBITMQ_URL = "amqp://localhost";
      await eventBus.connect();
      assert.strictEqual(connectionEstablished, true, "EventBus should establish connection");
      assert.strictEqual(channelCreated, true, "EventBus should create a confirm channel");

      // Idempotency check
      connectionEstablished = false;
      await eventBus.connect();
      assert.strictEqual(connectionEstablished, false, "EventBus should not reconnect if already connected");

      // 3. Publish Message with confirmation
      const testEvent = { id: 123, type: "test" };
      const publishResult = await eventBus.publish("test.routing.key", testEvent);
      assert.strictEqual(publishResult, true, "Publish should return true on broker confirmation");
      assert.strictEqual(publishedMessages.length, 1, "Should have published 1 message");
      assert.strictEqual(publishedMessages[0].exchange, "domain_events", "Should publish to domain_events exchange");
      assert.strictEqual(publishedMessages[0].routingKey, "test.routing.key", "Should use correct routing key");
      assert.deepStrictEqual(JSON.parse(publishedMessages[0].content.toString()), testEvent, "Should serialize event payload correctly");

      // 4. Subscribe and Acknowledge
      let handledEvent = null;
      await eventBus.subscribe("test_queue", "test.routing.key", async (event) => {
        handledEvent = event;
      });
      assert.strictEqual(subscribedQueues.length, 1, "Should have subscribed to the queue");
      assert.strictEqual(subscribedQueues[0].queue, "test_queue");

      const mockMsg = { content: Buffer.from(JSON.stringify(testEvent)), fields: { routingKey: 'test.routing.key' }, properties: { headers: {} } };
      await subscribedQueues[0].handler(mockMsg);
      assert.deepStrictEqual(handledEvent, testEvent, "Handler should receive the parsed event");
      assert.strictEqual(ackedMessages, 1, "Message should be acknowledged after successful handling");

      // 5. Subscribe and Negative Acknowledge (Nack) on Error after max retries
      await eventBus.subscribe("fail_queue", "fail.routing.key", async (event) => {
        throw new Error("Simulated processing error");
      });

      // Simulate a message that has already exhausted all retries
      const mockFailMsg = {
        content: Buffer.from(JSON.stringify(testEvent)),
        fields: { routingKey: 'fail.routing.key' },
        properties: { headers: { 'x-retry-count': 3 } }
      };
      await subscribedQueues[1].handler(mockFailMsg);
      assert.strictEqual(nackedMessages, 1, "Message should be negatively acknowledged after max retries");

      // 6. Verify retry republishing for a fresh message
      const retryMsg = {
        content: Buffer.from(JSON.stringify(testEvent)),
        fields: { routingKey: 'fail.routing.key' },
        properties: { headers: {} }
      };
      const prevPublishCount = publishedMessages.length;
      await subscribedQueues[1].handler(retryMsg);
      assert.strictEqual(publishedMessages.length, prevPublishCount + 1, "Should republish message for retry");
      assert.strictEqual(publishedMessages[publishedMessages.length - 1].options.headers['x-retry-count'], 1, "Retry count should be incremented");

      // 7. Disconnect Cleans Resources
      await eventBus.disconnect();
      assert.strictEqual(channelClosed, true, "Channel should be closed");
      assert.strictEqual(connectionClosed, true, "Connection should be closed");

      // 8. Verify Unconnected State
      try {
        await eventBus.publish("test", {});
        assert.fail("Should not allow publishing when disconnected");
      } catch (err: any) {
        assert.strictEqual(err.message, "EventBus is not connected", "Should throw when publishing while disconnected");
      }

      console.log("✅ All EventBus regression tests passed successfully.");
    } catch (e: any) {
      console.warn("Test failed (likely due to missing env/db):", e.message);
      throw e; // Re-throw so vitest actually reports the failure
    }
  });
});