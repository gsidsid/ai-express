type CacheEntry = {
  result: string;
  timestamp: number;
};

// cache limit (10 MB)
const CACHE_SIZE_LIMIT = 10 * 1024 * 1024;
const cache: Record<string, CacheEntry> = {};
const cacheKeys: string[] = [];
let currentCacheSize = 0;

function getStringSizeInBytes(str: string): number {
  return Buffer.byteLength(str, "utf8");
}

function addToCache(key: string, value: CacheEntry) {
  const entrySize = getStringSizeInBytes(value.result);
  // Check if the cache has reached its size limit
  while (currentCacheSize + entrySize > CACHE_SIZE_LIMIT) {
    // Remove the oldest entry from the cache
    const oldestKey = cacheKeys.shift();
    if (oldestKey) {
      const oldestEntry = cache[oldestKey];
      currentCacheSize -= getStringSizeInBytes(oldestEntry.result);
      delete cache[oldestKey];
    }
  }
  cache[key] = value;
  cacheKeys.push(key);
  currentCacheSize += entrySize;
}

// Function to get an entry from the cache
function getFromCache(key: string, ttl: number): CacheEntry | null {
  const entry = cache[key];
  if (!entry) {
    return null;
  }
  const currentTime = Date.now();
  const cacheExpirationTime = entry.timestamp + ttl * 1000;
  if (currentTime >= cacheExpirationTime) {
    delete cache[key];
    const index = cacheKeys.indexOf(key);
    if (index > -1) {
      cacheKeys.splice(index, 1);
    }
    currentCacheSize -= getStringSizeInBytes(entry.result);
    return null;
  }
  return entry;
}

export { addToCache, getFromCache };
