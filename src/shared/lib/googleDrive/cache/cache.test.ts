import { describe, it, expect, beforeEach } from "vitest";
import { metadataCache } from "./metadataCache";
import { fileContentCache } from "./fileContentCache";
import { requestDeduplicator } from "./requestDeduplicator";

describe("metadataCache", () => {
  beforeEach(() => {
    metadataCache.clear();
  });

  it("should store and retrieve list cache", () => {
    const key = "test-key";
    const value = {
      files: [{ id: "1", name: "test", mimeType: "text/plain" }],
      nextPageToken: "token",
    };

    metadataCache.setList(key, value);
    const result = metadataCache.getList(key);

    expect(result).toEqual(value);
  });

  it("should return undefined for non-existent key", () => {
    const result = metadataCache.getList("non-existent");
    expect(result).toBeUndefined();
  });

  it("should invalidate by folder id in key", () => {
    const key1 = JSON.stringify({ q: `'folder1' in parents` });
    const key2 = JSON.stringify({ q: `'folder2' in parents` });
    const value = { files: [], nextPageToken: undefined };

    metadataCache.setList(key1, value);
    metadataCache.setList(key2, value);

    metadataCache.invalidateByFolderId("folder1");

    expect(metadataCache.getList(key1)).toBeUndefined();
    expect(metadataCache.getList(key2)).toEqual(value);
  });

  it("should clear all entries", () => {
    const key = "test-key";
    const value = { files: [], nextPageToken: undefined };

    metadataCache.setList(key, value);
    metadataCache.clear();

    expect(metadataCache.getList(key)).toBeUndefined();
  });
});

describe("fileContentCache", () => {
  beforeEach(() => {
    fileContentCache.clear();
  });

  it("should store and retrieve file content", () => {
    const fileId = "file-123";
    const modifiedTime = "2024-01-01T00:00:00Z";
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    const result = fileContentCache.set(fileId, modifiedTime, file);
    expect(result).toBe(true);

    const cached = fileContentCache.get(fileId, modifiedTime);
    expect(cached).toEqual(file);
  });

  it("should reject files exceeding max size", () => {
    const fileId = "file-123";
    const modifiedTime = "2024-01-01T00:00:00Z";
    const largeContent = new Array(101 * 1024).join("x");
    const file = new File([largeContent], "large.txt", { type: "text/plain" });

    const result = fileContentCache.set(fileId, modifiedTime, file);
    expect(result).toBe(false);
  });

  it("should invalidate by fileId", () => {
    const fileId = "file-123";
    const modifiedTime = "2024-01-01T00:00:00Z";
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    fileContentCache.set(fileId, modifiedTime, file);
    fileContentCache.invalidate(fileId);

    const cached = fileContentCache.get(fileId, modifiedTime);
    expect(cached).toBeUndefined();
  });

  it("should evict oldest entries when cache is full", () => {
    const fileSize = 4 * 1024 * 1024;

    for (let i = 0; i < 2; i++) {
      const fileId = `file-${i}`;
      const modifiedTime = `2024-01-0${i}T00:00:00Z`;
      const content = new Array(fileSize).join("x");
      const file = new File([content], `test${i}.txt`, { type: "text/plain" });

      fileContentCache.set(fileId, modifiedTime, file);
    }

    const file3Id = "file-3";
    const file3ModifiedTime = "2024-01-03T00:00:00Z";
    const file3Content = new Array(fileSize).join("x");
    const file3 = new File([file3Content], "test3.txt", { type: "text/plain" });

    fileContentCache.set(file3Id, file3ModifiedTime, file3);

    const firstFileCached = fileContentCache.get(
      "file-0",
      "2024-01-00T00:00:00Z",
    );
    expect(firstFileCached).toBeUndefined();
  });
});

describe("requestDeduplicator", () => {
  beforeEach(() => {
    requestDeduplicator.clear();
  });

  it("should deduplicate concurrent requests", async () => {
    let callCount = 0;
    const requestFn = () => {
      callCount++;
      return Promise.resolve("result");
    };

    const [result1, result2] = await Promise.all([
      requestDeduplicator.exec(
        "GET",
        "https://api.test/data",
        "token1",
        requestFn,
      ),
      requestDeduplicator.exec(
        "GET",
        "https://api.test/data",
        "token1",
        requestFn,
      ),
    ]);

    expect(result1).toBe("result");
    expect(result2).toBe("result");
    expect(callCount).toBe(1);
  });

  it("should make separate requests for different URLs", async () => {
    let callCount = 0;
    const requestFn = () => {
      callCount++;
      return Promise.resolve("result");
    };

    await requestDeduplicator.exec(
      "GET",
      "https://api.test/data1",
      "token1",
      requestFn,
    );
    await requestDeduplicator.exec(
      "GET",
      "https://api.test/data2",
      "token1",
      requestFn,
    );

    expect(callCount).toBe(2);
  });

  it("should make separate requests for different tokens", async () => {
    let callCount = 0;
    const requestFn = () => {
      callCount++;
      return Promise.resolve("result");
    };

    await requestDeduplicator.exec(
      "GET",
      "https://api.test/data",
      "token1",
      requestFn,
    );
    await requestDeduplicator.exec(
      "GET",
      "https://api.test/data",
      "token2",
      requestFn,
    );

    expect(callCount).toBe(2);
  });

  it("should clear all pending requests", () => {
    requestDeduplicator.clear();
  });
});
