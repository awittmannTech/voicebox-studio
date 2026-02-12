import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api/client';
import type { TrainingJobCreate, TrainingJobResponse, TrainingProgress } from '@/lib/api/types';
import { useServerStore } from '@/stores/serverStore';
import { useTrainingStore } from '@/stores/trainingStore';

/**
 * Start a LoRA training job.
 */
export function useStartTraining() {
  const queryClient = useQueryClient();
  const setActiveJob = useTrainingStore((state) => state.setActiveJob);

  return useMutation({
    mutationFn: (data: TrainingJobCreate) => apiClient.startTraining(data),
    onSuccess: (job) => {
      setActiveJob(job.id, job.profile_id);
      queryClient.invalidateQueries({ queryKey: ['training-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['adapter-info'] });
    },
  });
}

/**
 * Cancel a running training job.
 */
export function useCancelTraining() {
  const queryClient = useQueryClient();
  const clearActiveJob = useTrainingStore((state) => state.clearActiveJob);

  return useMutation({
    mutationFn: (jobId: string) => apiClient.cancelTraining(jobId),
    onSuccess: () => {
      clearActiveJob();
      queryClient.invalidateQueries({ queryKey: ['training-jobs'] });
    },
  });
}

/**
 * Poll a training job status.
 */
export function useTrainingJob(jobId: string | null) {
  return useQuery({
    queryKey: ['training-job', jobId],
    queryFn: () => apiClient.getTrainingJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data as TrainingJobResponse | undefined;
      if (!data) return 2000;
      // Stop polling when job is done
      if (['completed', 'failed', 'cancelled'].includes(data.status)) return false;
      return 2000;
    },
  });
}

/**
 * List training jobs for a profile.
 */
export function useProfileTrainingJobs(profileId: string | null) {
  return useQuery({
    queryKey: ['training-jobs', profileId],
    queryFn: () => apiClient.getProfileTrainingJobs(profileId!),
    enabled: !!profileId,
  });
}

/**
 * Get adapter info for a profile.
 */
export function useAdapterInfo(profileId: string | null) {
  return useQuery({
    queryKey: ['adapter-info', profileId],
    queryFn: () => apiClient.getProfileAdapterInfo(profileId!),
    enabled: !!profileId,
  });
}

/**
 * Delete adapter for a profile.
 */
export function useDeleteAdapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) => apiClient.deleteProfileAdapter(profileId),
    onSuccess: (_data, profileId) => {
      queryClient.invalidateQueries({ queryKey: ['adapter-info', profileId] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

/**
 * Subscribe to training progress via SSE.
 */
export function useTrainingProgress(jobId: string | null) {
  const serverUrl = useServerStore((state) => state.serverUrl);
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!jobId || !serverUrl) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const url = `${serverUrl}/training/progress/training:${jobId}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const progress: TrainingProgress = JSON.parse(event.data);

        // Update the cached training job query with progress data
        queryClient.setQueryData<TrainingJobResponse>(['training-job', jobId], (old) => {
          if (!old) return old;
          return {
            ...old,
            progress: progress.progress,
            status:
              progress.status === 'complete'
                ? 'completed'
                : progress.status === 'error'
                  ? 'failed'
                  : progress.filename || old.status,
          };
        });

        if (progress.status === 'complete' || progress.status === 'error') {
          eventSource.close();
          eventSourceRef.current = null;
          // Refresh related queries
          queryClient.invalidateQueries({ queryKey: ['training-job', jobId] });
          queryClient.invalidateQueries({ queryKey: ['training-jobs'] });
          queryClient.invalidateQueries({ queryKey: ['adapter-info'] });
          queryClient.invalidateQueries({ queryKey: ['profiles'] });
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [jobId, serverUrl, queryClient]);
}
