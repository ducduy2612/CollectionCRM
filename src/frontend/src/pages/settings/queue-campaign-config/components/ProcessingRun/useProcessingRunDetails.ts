import { useState, useEffect } from 'react';
import { processingApi } from '../../../../../services/api/campaign';
import type { 
  ProcessingStatistics, 
  CampaignResult, 
  ProcessingError,
  CustomerAssignment 
} from '../../../../../services/api/campaign/types';

interface UseProcessingRunDetailsState {
  summary: any;
  statistics: ProcessingStatistics[];
  campaignResults: CampaignResult[];
  errors: ProcessingError[];
  assignments: CustomerAssignment[];
  isLoading: boolean;
}

interface UseProcessingRunDetailsActions {
  loadRunDetails: () => Promise<void>;
  searchCustomerAssignments: (cif: string, runId: string) => Promise<void>;
  loadCampaignAssignments: (campaignResultId: string) => Promise<void>;
}

export const useProcessingRunDetails = (runId: string): UseProcessingRunDetailsState & UseProcessingRunDetailsActions => {
  const [summary, setSummary] = useState<any>(null);
  const [statistics, setStatistics] = useState<ProcessingStatistics[]>([]);
  const [campaignResults, setCampaignResults] = useState<CampaignResult[]>([]);
  const [errors, setErrors] = useState<ProcessingError[]>([]);
  const [assignments, setAssignments] = useState<CustomerAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRunDetails = async () => {
    setIsLoading(true);
    try {
      const [summaryResponse, statisticsResponse, resultsResponse, errorsResponse] = await Promise.all([
        processingApi.getProcessingSummary(runId).catch(() => ({ success: false, data: null })),
        processingApi.getProcessingStatistics(runId).catch(() => ({ success: false, data: [] })),
        processingApi.getCampaignResults(runId).catch(() => ({ success: false, data: [] })),
        processingApi.getProcessingErrors(runId).catch(() => ({ success: false, data: [] }))
      ]);

      if (summaryResponse.success) {
        setSummary(summaryResponse.data);
      }
      
      if (statisticsResponse.success) {
        setStatistics(statisticsResponse.data);
      }
      
      if (resultsResponse.success) {
        setCampaignResults(resultsResponse.data);
      }
      
      if (errorsResponse.success) {
        setErrors(errorsResponse.data);
      }
    } catch (err) {
      console.error('Failed to load run details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchCustomerAssignments = async (cif: string, runId: string) => {
    if (!cif.trim()) return;

    setIsLoading(true);
    try {
      const response = await processingApi.searchCustomerAssignments({
        cif: cif.trim(),
        processing_run_id: runId
      });

      if (response.success) {
        setAssignments(response.data);
      }
    } catch (err) {
      console.error('Failed to search assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCampaignAssignments = async (campaignResultId: string) => {
    setIsLoading(true);
    try {
      const response = await processingApi.getCustomerAssignments(campaignResultId, { limit: 100 });
      
      if (response.success) {
        setAssignments(response.data);
      }
    } catch (err) {
      console.error('Failed to load campaign assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (runId) {
      loadRunDetails();
    }
  }, [runId]);

  return {
    summary,
    statistics,
    campaignResults,
    errors,
    assignments,
    isLoading,
    loadRunDetails,
    searchCustomerAssignments,
    loadCampaignAssignments
  };
};