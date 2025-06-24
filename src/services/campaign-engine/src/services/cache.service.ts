import { createCacheService } from 'collection-crm-common';
import { env } from '../config/env.config';

export const campaignCache = createCacheService({
  ttl: env.CACHE_TTL,
  clientName: 'campaign-cache',
  prefix: 'campaign:'
});

export const CacheService = {
  getInstance: () => campaignCache
};