/**
 * Aggregator Integration Service
 * Provides API functions for managing Swiggy/Zomato/UberEats integrations.
 */
export {
  getAggregators as getAggregatorConfigs,
  updateAggregator as updateAggregatorConfig,
  type Aggregator,
  type UpdateAggregatorInput,
  type AggregatorListResponse,
  type AggregatorResponse,
} from './settingsService';
