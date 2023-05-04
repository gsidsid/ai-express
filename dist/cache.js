"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFromCache = exports.addToCache = void 0;
// cache limit (10 MB)
var CACHE_SIZE_LIMIT = 10 * 1024 * 1024;
var cache = {};
var cacheKeys = [];
var currentCacheSize = 0;
function getStringSizeInBytes(str) {
    return Buffer.byteLength(str, "utf8");
}
function addToCache(key, value) {
    var entrySize = getStringSizeInBytes(value.result);
    // Check if the cache has reached its size limit
    while (currentCacheSize + entrySize > CACHE_SIZE_LIMIT) {
        // Remove the oldest entry from the cache
        var oldestKey = cacheKeys.shift();
        if (oldestKey) {
            var oldestEntry = cache[oldestKey];
            currentCacheSize -= getStringSizeInBytes(oldestEntry.result);
            delete cache[oldestKey];
        }
    }
    cache[key] = value;
    cacheKeys.push(key);
    currentCacheSize += entrySize;
}
exports.addToCache = addToCache;
// Function to get an entry from the cache
function getFromCache(key, ttl) {
    var entry = cache[key];
    if (!entry) {
        return null;
    }
    var currentTime = Date.now();
    var cacheExpirationTime = entry.timestamp + ttl * 1000;
    if (currentTime >= cacheExpirationTime) {
        delete cache[key];
        var index = cacheKeys.indexOf(key);
        if (index > -1) {
            cacheKeys.splice(index, 1);
        }
        currentCacheSize -= getStringSizeInBytes(entry.result);
        return null;
    }
    return entry;
}
exports.getFromCache = getFromCache;
