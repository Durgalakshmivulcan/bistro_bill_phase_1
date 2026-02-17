/**
 * Performance Monitor for Polling Intervals
 *
 * Tracks polling latency (time between poll start and data received),
 * API response times, and dynamically adjusts polling intervals.
 * Displays metrics in dev tools console (development mode only).
 */

const isDev = process.env.NODE_ENV === 'development';

// Latency threshold in milliseconds (alert if exceeded)
const LATENCY_THRESHOLD_MS = 2000;

// Maximum number of samples to keep in rolling window
const MAX_SAMPLES = 50;

export interface PollingMetrics {
  endpoint: string;
  latencies: number[];
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
  lastLatency: number;
  totalPolls: number;
  failedPolls: number;
  thresholdExceeded: number;
  lastPollTime: number | null;
}

// Store metrics per endpoint
const metricsStore = new Map<string, PollingMetrics>();

function getOrCreateMetrics(endpoint: string): PollingMetrics {
  if (!metricsStore.has(endpoint)) {
    metricsStore.set(endpoint, {
      endpoint,
      latencies: [],
      averageLatency: 0,
      maxLatency: 0,
      minLatency: Infinity,
      lastLatency: 0,
      totalPolls: 0,
      failedPolls: 0,
      thresholdExceeded: 0,
      lastPollTime: null,
    });
  }
  return metricsStore.get(endpoint)!;
}

function recalculateStats(metrics: PollingMetrics): void {
  const { latencies } = metrics;
  if (latencies.length === 0) return;

  metrics.averageLatency = Math.round(
    latencies.reduce((sum, l) => sum + l, 0) / latencies.length
  );
  metrics.maxLatency = Math.max(...latencies);
  metrics.minLatency = Math.min(...latencies);
}

/**
 * Start timing a poll. Returns a function to call when the poll completes.
 */
export function startPollTimer(endpoint: string): (success?: boolean) => number {
  const startTime = performance.now();
  const metrics = getOrCreateMetrics(endpoint);
  metrics.totalPolls++;

  return (success = true) => {
    const latency = Math.round(performance.now() - startTime);
    metrics.lastLatency = latency;
    metrics.lastPollTime = Date.now();

    if (!success) {
      metrics.failedPolls++;
    }

    // Add to rolling latency window
    metrics.latencies.push(latency);
    if (metrics.latencies.length > MAX_SAMPLES) {
      metrics.latencies.shift();
    }

    recalculateStats(metrics);

    // Alert if latency exceeds threshold
    if (latency > LATENCY_THRESHOLD_MS) {
      metrics.thresholdExceeded++;
      if (isDev) {
        console.warn(
          `[PerfMon] ⚠️ High latency on ${endpoint}: ${latency}ms (threshold: ${LATENCY_THRESHOLD_MS}ms)`
        );
      }
    }

    // Log in development mode
    if (isDev) {
      console.debug(
        `[PerfMon] ${endpoint} | ${latency}ms | avg: ${metrics.averageLatency}ms | polls: ${metrics.totalPolls}`
      );
    }

    return latency;
  };
}

/**
 * Get current metrics for an endpoint.
 */
export function getMetrics(endpoint: string): PollingMetrics | undefined {
  return metricsStore.get(endpoint);
}

/**
 * Get metrics for all tracked endpoints.
 */
export function getAllMetrics(): PollingMetrics[] {
  return Array.from(metricsStore.values());
}

/**
 * Calculate a recommended polling interval based on recent latency.
 * If average latency is high, increases the interval to reduce server load.
 * If latency is low, can decrease towards the base interval.
 *
 * @param endpoint - The endpoint identifier
 * @param baseInterval - The default polling interval in ms
 * @param minInterval - Minimum allowed interval in ms (default: baseInterval * 0.5)
 * @param maxInterval - Maximum allowed interval in ms (default: baseInterval * 4)
 * @returns Recommended polling interval in ms
 */
export function getAdaptiveInterval(
  endpoint: string,
  baseInterval: number,
  minInterval?: number,
  maxInterval?: number
): number {
  const metrics = metricsStore.get(endpoint);
  const min = minInterval ?? Math.round(baseInterval * 0.5);
  const max = maxInterval ?? baseInterval * 4;

  if (!metrics || metrics.latencies.length < 3) {
    // Not enough data yet, use base interval
    return baseInterval;
  }

  const { averageLatency } = metrics;

  // If average latency is above threshold, increase interval
  if (averageLatency > LATENCY_THRESHOLD_MS) {
    // Scale up proportionally: 2x latency → 2x interval, capped at max
    const scale = Math.min(averageLatency / LATENCY_THRESHOLD_MS, max / baseInterval);
    return Math.min(Math.round(baseInterval * scale), max);
  }

  // If average latency is very low (<25% of threshold), can decrease slightly
  if (averageLatency < LATENCY_THRESHOLD_MS * 0.25) {
    return Math.max(min, Math.round(baseInterval * 0.75));
  }

  // Normal range - use base interval
  return baseInterval;
}

/**
 * Reset metrics for a specific endpoint.
 */
export function resetMetrics(endpoint: string): void {
  metricsStore.delete(endpoint);
}

/**
 * Reset all metrics.
 */
export function resetAllMetrics(): void {
  metricsStore.clear();
}

/**
 * Log a summary of all metrics to console (development mode only).
 */
export function logMetricsSummary(): void {
  if (!isDev) return;

  const allMetrics = getAllMetrics();
  if (allMetrics.length === 0) {
    console.debug('[PerfMon] No metrics collected yet.');
    return;
  }

  console.group('[PerfMon] Polling Performance Summary');
  allMetrics.forEach((m) => {
    console.table({
      Endpoint: m.endpoint,
      'Avg Latency (ms)': m.averageLatency,
      'Max Latency (ms)': m.maxLatency,
      'Min Latency (ms)': m.minLatency === Infinity ? 'N/A' : m.minLatency,
      'Last Latency (ms)': m.lastLatency,
      'Total Polls': m.totalPolls,
      'Failed Polls': m.failedPolls,
      'Threshold Exceeded': m.thresholdExceeded,
    });
  });
  console.groupEnd();
}
