import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockAck = vi.fn();
  const mockNack = vi.fn();
  const mockPublish = vi.fn();
  const mockAssertExchange = vi.fn();
  const mockAssertQueue = vi.fn();
  const mockBindQueue = vi.fn();
  const mockConsume = vi.fn();
  const mockClose = vi.fn();

  const mockChannel = {
    publish: mockPublish,
    assertExchange: mockAssertExchange,
    assertQueue: mockAssertQueue,
    bindQueue: mockBindQueue,
    consume: mockConsume,
    ack: mockAck,
    nack: mockNack,
    close: mockClose,
  };

  const mockConnection = {
    createConfirmChannel: vi.fn().mockResolvedValue(mockChannel),
    close: mockClose,
  };

  return {
    mockAck, mockNack, mockPublish, mockAssertExchange,
    mockAssertQueue, mockBindQueue, mockConsume, mockClose,
    mockChannel, mockConnection,
  };
});

vi.mock('amqplib', () => ({
  connect: vi.fn().mockResolvedValue(mocks.mockConnection),
}));

import { eventBus } from '../src/events/eventBus';

describe('EventBus — Issue #538: Publisher Confirms & DLQ', () => {
  beforeEach(() => {
    // Only clear call counts, DON'T reset implementations
    vi.clearAllMocks();
    // Reset singleton state
    (eventBus as any).connection = null;
    (eventBus as any).channel = null;
    // Default publish: success (handles both callback and no-callback calls)
    mocks.mockPublish.mockImplementation((_ex: any, _rk: any, _payload: any, _opts: any, cb?: any) => {
      if (typeof cb === 'function') cb(null);
      return true;
    });
  });

  it('should use ConfirmChannel and setup DLX/DLQ on connect', async () => {
    await eventBus.connect();

    expect(mocks.mockConnection.createConfirmChannel).toHaveBeenCalledTimes(1);
    expect(mocks.mockAssertExchange).toHaveBeenCalledWith('domain_events', 'topic', { durable: true });
    expect(mocks.mockAssertExchange).toHaveBeenCalledWith('domain_events.dlx', 'topic', { durable: true });
    expect(mocks.mockAssertQueue).toHaveBeenCalledWith('dlq.domain_events', { durable: true });
    expect(mocks.mockBindQueue).toHaveBeenCalledWith('dlq.domain_events', 'domain_events.dlx', '#');
  });

  it('should return true on successful publish confirmation', async () => {
    await eventBus.connect();

    const result = await eventBus.publish('test.key', { data: 1 });
    expect(result).toBe(true);
    expect(mocks.mockPublish).toHaveBeenCalledWith(
      'domain_events',
      'test.key',
      expect.any(Buffer),
      { persistent: true },
      expect.any(Function)
    );
  });

  it('should return false on publish rejection', async () => {
    await eventBus.connect();

    mocks.mockPublish.mockImplementation((_ex: any, _rk: any, _payload: any, _opts: any, cb: any) => {
      cb(new Error('Channel closed'));
    });

    const result = await eventBus.publish('test.key', { data: 1 });
    expect(result).toBe(false);
  });

  it('should configure queues with dead-letter arguments', async () => {
    await eventBus.connect();

    await eventBus.subscribe('my_queue', 'my.routing.key', async () => {});

    expect(mocks.mockAssertQueue).toHaveBeenCalledWith('my_queue', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'domain_events.dlx',
        'x-dead-letter-routing-key': 'my_queue.failed'
      }
    });
  });

  it('should retry failed messages up to MAX_RETRIES before routing to DLQ', async () => {
    await eventBus.connect();

    const handler = vi.fn().mockRejectedValue(new Error('Processing failed'));
    await eventBus.subscribe('retry_queue', 'retry.key', handler);

    const consumeCallback = mocks.mockConsume.mock.calls[0][1];

    // Attempt 1: no retry header → republish with retry-count=1
    const msg1 = {
      content: Buffer.from(JSON.stringify({ id: 1 })),
      fields: { routingKey: 'retry.key' },
      properties: { headers: {} },
    };
    await consumeCallback(msg1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(mocks.mockAck).toHaveBeenCalledTimes(1);
    expect(mocks.mockPublish).toHaveBeenLastCalledWith(
      'domain_events',
      'retry.key',
      msg1.content,
      expect.objectContaining({ headers: { 'x-retry-count': 1 } })
    );

    // Attempt 2: retry-count=1 → republish with retry-count=2
    mocks.mockAck.mockClear();
    const msg2 = {
      content: Buffer.from(JSON.stringify({ id: 1 })),
      fields: { routingKey: 'retry.key' },
      properties: { headers: { 'x-retry-count': 1 } },
    };
    await consumeCallback(msg2);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(mocks.mockAck).toHaveBeenCalledTimes(1);
    expect(mocks.mockPublish).toHaveBeenLastCalledWith(
      'domain_events',
      'retry.key',
      msg2.content,
      expect.objectContaining({ headers: { 'x-retry-count': 2 } })
    );

    // Attempt 3: retry-count=2 → republish with retry-count=3
    mocks.mockAck.mockClear();
    const msg3 = {
      content: Buffer.from(JSON.stringify({ id: 1 })),
      fields: { routingKey: 'retry.key' },
      properties: { headers: { 'x-retry-count': 2 } },
    };
    await consumeCallback(msg3);
    expect(handler).toHaveBeenCalledTimes(3);
    expect(mocks.mockAck).toHaveBeenCalledTimes(1);
    expect(mocks.mockPublish).toHaveBeenLastCalledWith(
      'domain_events',
      'retry.key',
      msg3.content,
      expect.objectContaining({ headers: { 'x-retry-count': 3 } })
    );

    // Attempt 4: retry-count=3 (MAX_RETRIES) → nack to DLQ, no republish
    mocks.mockAck.mockClear();
    const msg4 = {
      content: Buffer.from(JSON.stringify({ id: 1 })),
      fields: { routingKey: 'retry.key' },
      properties: { headers: { 'x-retry-count': 3 } },
    };
    await consumeCallback(msg4);
    expect(handler).toHaveBeenCalledTimes(4);
    expect(mocks.mockNack).toHaveBeenCalledWith(msg4, false, false);
    expect(mocks.mockPublish).toHaveBeenLastCalledWith(
      'domain_events',
      'retry.key',
      msg3.content,
      expect.objectContaining({ headers: { 'x-retry-count': 3 } })
    );
  });

  it('should ack successful messages immediately without retry', async () => {
    await eventBus.connect();

    const handler = vi.fn().mockResolvedValue(undefined);
    await eventBus.subscribe('success_queue', 'success.key', handler);

    const consumeCallback = mocks.mockConsume.mock.calls[0][1];
    const msg = {
      content: Buffer.from(JSON.stringify({ id: 2 })),
      fields: { routingKey: 'success.key' },
      properties: { headers: {} },
    };

    await consumeCallback(msg);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(mocks.mockAck).toHaveBeenCalledWith(msg);
    expect(mocks.mockNack).not.toHaveBeenCalled();
  });
});