const redis = require('redis');
require('dotenv').config();

// 根据环境变量决定使用真实Redis还是MockRedis
const REDIS_URL = process.env.REDIS_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'production' && REDIS_URL) {
  // 生产环境使用真实Redis
  const redisClient = redis.createClient({
    url: REDIS_URL
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.connect().catch(err => {
    console.error('Failed to connect to Redis:', err);
  });

  module.exports = redisClient;
} else {
  // 开发环境使用MockRedis
  class MockRedis {
    constructor() {
      this.store = new Map();
      this.sets = new Map();
      this.isOpen = true;
      console.warn('⚠️  Using in-memory MockRedis for development.');
    }

    async connect() { this.isOpen = true; }
    async disconnect() { this.isOpen = false; }

    async get(key) { return this.store.get(key) || null; }
    async set(key, value) { this.store.set(key, value); return 'OK'; }
    async del(key) { 
      const existed = this.store.delete(key) || this.sets.delete(key);
      return existed ? 1 : 0;
    }
    
    async incr(key) {
      const val = (parseInt(this.store.get(key)) || 0) + 1;
      this.store.set(key, val.toString());
      return val;
    }

    async incrBy(key, amount) {
      const val = (parseInt(this.store.get(key)) || 0) + amount;
      this.store.set(key, val.toString());
      return val;
    }

    async decr(key) {
      const val = (parseInt(this.store.get(key)) || 0) - 1;
      this.store.set(key, val.toString());
      return val;
    }

    async sadd(key, value) {
      if (!this.sets.has(key)) this.sets.set(key, new Set());
      const set = this.sets.get(key);
      const size = set.size;
      set.add(value);
      return set.size - size;
    }

    async srem(key, value) {
      if (!this.sets.has(key)) return 0;
      const set = this.sets.get(key);
      const deleted = set.delete(value);
      if (set.size === 0) this.sets.delete(key);
      return deleted ? 1 : 0;
    }
    
    // Aliases for camelCase compatibility (node-redis v4)
    async sAdd(key, value) { return this.sadd(key, value); }
    async sRem(key, value) { return this.srem(key, value); }
    async sCard(key) { return this.scard(key); }
    async sIsMember(key, value) { return this.sismember(key, value); }
    async sMembers(key) { 
      if (!this.sets.has(key)) return [];
      return Array.from(this.sets.get(key)); 
    }

    async scard(key) {
      if (!this.sets.has(key)) return 0;
      return this.sets.get(key).size;
    }

    async sismember(key, value) {
      if (!this.sets.has(key)) return false;
      return this.sets.get(key).has(value);
    }

    async keys(pattern) {
      // Simple mock for keys, supports prefix match or *
      if (pattern === '*') return [...this.store.keys(), ...this.sets.keys()];
      const prefix = pattern.replace('*', '');
      const allKeys = [...this.store.keys(), ...this.sets.keys()];
      return allKeys.filter(k => k.startsWith(prefix));
    }

    async expire(key, seconds) {
      setTimeout(() => {
        this.del(key);
      }, seconds * 1000);
      return 1;
    }

    multi() {
      // Simple mock pipeline
      const commands = [];
      return {
        incr: (key) => commands.push(() => this.incr(key)),
        exec: async () => {
          const results = [];
          for (const cmd of commands) {
            results.push(await cmd());
          }
          return results;
        }
      };
    }
    
    on() {} // No-op for event listeners
  }

  // 创建并导出MockRedis实例
  const redisClient = new MockRedis();

  module.exports = redisClient;
}