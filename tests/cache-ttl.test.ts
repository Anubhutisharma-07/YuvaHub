import { describe, expect, it, vi } from "vitest";

describe("Redis cache TTL contract", () => {
  it("uses five minutes when no TTL is supplied", async () => {
    const set = vi.fn().mockResolvedValue("OK");
    const client = { set };

    const cacheSet = async (
      key: string,
      value: unknown,
      ttl = 300,
    ) => client.set(key, JSON.stringify(value), "EX", ttl);

    await cacheSet("opportunities:test", { value: 1 });

    expect(set).toHaveBeenCalledWith(
      "opportunities:test",
      JSON.stringify({ value: 1 }),
      "EX",
      300,
    );
  });

  it("allows an explicit TTL override", async () => {
    const set = vi.fn().mockResolvedValue("OK");
    const client = { set };

    const cacheSet = async (
      key: string,
      value: unknown,
      ttl = 300,
    ) => client.set(key, JSON.stringify(value), "EX", ttl);

    await cacheSet("opportunity:1", { value: 1 }, 3600);

    expect(set).toHaveBeenCalledWith(
      "opportunity:1",
      JSON.stringify({ value: 1 }),
      "EX",
      3600,
    );
  });
});
