import { Router } from 'express';
import { MonitoringController } from '@/controllers/MonitoringController';

export function createMonitoringRoutes(monitoringController: MonitoringController): Router {
  const router = Router();

  // Health and readiness checks
  router.get('/health', monitoringController.healthCheck);
  router.get('/ready', monitoringController.readinessCheck);
  router.get('/metrics', monitoringController.getMetrics);

  // Service statistics and monitoring
  router.get('/stats', monitoringController.getStats);
  router.get('/jobs/status', monitoringController.getJobsStatus);
  router.get('/partitions', monitoringController.getPartitionInfo);

  // Manual job execution
  router.post('/jobs/staging-ingestion/run', monitoringController.runStagingIngestion);
  router.post('/jobs/partition-maintenance/run', monitoringController.runPartitionMaintenance);
  router.post('/jobs/cache-cleanup/run', monitoringController.runCacheCleanup);

  // Cache management
  router.post(
    '/cache/warm',
    MonitoringController.validateCacheWarm,
    monitoringController.warmCache
  );
  router.post('/cache/clear', monitoringController.clearCache);

  return router;
}