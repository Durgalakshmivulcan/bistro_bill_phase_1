import { createClient, RedisClientType } from 'redis';

/**
 * Redis Cache Service for Dashboard APIs
 * Provides caching layer for expensive dashboard calculations
 */
class CacheService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  /**
   * Initialize Redis client and connect
   */
  async connect(): Promise<void> {
    try {
      // Use environment variable or default to localhost
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            // Exponential backoff: 50ms, 100ms, 200ms, etc., max 3000ms
            const delay = Math.min(50 * Math.pow(2, retries), 3000);
            console.log(`Redis reconnection attempt ${retries + 1}, waiting ${delay}ms`);
            return delay;
          },
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
      console.log('Redis Cache Service initialized successfully');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      // Don't throw - allow app to continue without cache
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL (time to live) in seconds
   */
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serialized);
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Cache DEL error for key ${key}:`, error);
    }
  }

  /**
   * Delete all keys matching a pattern (e.g., "dashboard:businessOwner123:*")
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      // Use SCAN to find matching keys (safer than KEYS for production)
      let deletedCount = 0;
      for await (const key of this.client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        await this.client.del(key);
        deletedCount++;
      }

      if (deletedCount > 0) {
        console.log(`Deleted ${deletedCount} cache keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      console.error(`Cache DEL_PATTERN error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Build cache key for dashboard revenue summary
   */
  buildRevenueSummaryKey(businessOwnerId: string, startDate: string, endDate: string, branchId?: string): string {
    const branch = branchId || 'all';
    return `dashboard:${businessOwnerId}:revenue-summary:${startDate}:${endDate}:${branch}`;
  }

  /**
   * Build cache key for dashboard revenue by type
   */
  buildRevenueByTypeKey(businessOwnerId: string, startDate: string, endDate: string, branchId?: string): string {
    const branch = branchId || 'all';
    return `dashboard:${businessOwnerId}:revenue-by-type:${startDate}:${endDate}:${branch}`;
  }

  /**
   * Build cache key for top products
   */
  buildTopProductsKey(businessOwnerId: string, startDate: string, endDate: string, branchId?: string, limit?: number): string {
    const branch = branchId || 'all';
    const lim = limit || 5;
    return `dashboard:${businessOwnerId}:top-products:${startDate}:${endDate}:${branch}:${lim}`;
  }

  /**
   * Build cache key for top brands
   */
  buildTopBrandsKey(businessOwnerId: string, startDate: string, endDate: string, branchId?: string, limit?: number): string {
    const branch = branchId || 'all';
    const lim = limit || 5;
    return `dashboard:${businessOwnerId}:top-brands:${startDate}:${endDate}:${branch}:${lim}`;
  }

  /**
   * Build cache key for branch performance
   */
  buildBranchPerformanceKey(businessOwnerId: string, startDate: string, endDate: string, limit?: number): string {
    const lim = limit || 5;
    return `dashboard:${businessOwnerId}:branch-performance:${startDate}:${endDate}:${lim}`;
  }

  /**
   * Build cache key for revenue by payment
   */
  buildRevenueByPaymentKey(businessOwnerId: string, startDate: string, endDate: string, branchId?: string): string {
    const branch = branchId || 'all';
    return `dashboard:${businessOwnerId}:revenue-by-payment:${startDate}:${endDate}:${branch}`;
  }

  /**
   * Build cache key for average values
   */
  buildAverageValuesKey(businessOwnerId: string, startDate: string, endDate: string, branchId?: string): string {
    const branch = branchId || 'all';
    return `dashboard:${businessOwnerId}:average-values:${startDate}:${endDate}:${branch}`;
  }

  /**
   * Invalidate all dashboard caches for a business owner
   * Call this when a new order is created/updated
   */
  async invalidateDashboardCache(businessOwnerId: string): Promise<void> {
    const pattern = `dashboard:${businessOwnerId}:*`;
    await this.delPattern(pattern);
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('Redis Cache Service disconnected');
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
