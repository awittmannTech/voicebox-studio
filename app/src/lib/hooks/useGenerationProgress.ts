import { useEffect, useRef } from 'react';
import { useGenerationStore } from '@/stores/generationStore';
import { useServerStore } from '@/stores/serverStore';
import type { GenerationStage } from '@/stores/generationStore';

/**
 * Hook that subscribes to generation progress via SSE.
 * Polls /tasks/active to discover the generation ID, then opens
 * an EventSource to /generate/progress/{id} for real-time stage updates.
 */
export function useGenerationProgress() {
  const isGenerating = useGenerationStore((state) => state.isGenerating);
  const setGenerationStage = useGenerationStore((state) => state.setGenerationStage);
  const setGenerationProgress = useGenerationStore((state) => state.setGenerationProgress);
  const setGenerationError = useGenerationStore((state) => state.setGenerationError);
  const serverUrl = useServerStore((state) => state.serverUrl);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectedGenIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isGenerating || !serverUrl) {
      // Clean up when generation stops
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      connectedGenIdRef.current = null;
      return;
    }

    // Poll /tasks/active to discover the generation task ID
    const pollForGenerationId = async () => {
      try {
        const response = await fetch(`${serverUrl}/tasks/active`);
        if (!response.ok) return;
        const data = await response.json();
        const activeGen = data.generations?.[0];
        if (activeGen?.task_id && activeGen.task_id !== connectedGenIdRef.current) {
          connectedGenIdRef.current = activeGen.task_id;
          connectSSE(activeGen.task_id);
        }
      } catch {
        // Ignore polling errors
      }
    };

    const connectSSE = (generationId: string) => {
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const url = `${serverUrl}/generate/progress/generation:${generationId}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const progress = JSON.parse(event.data);
          const stage = progress.status as GenerationStage;
          setGenerationStage(stage);
          setGenerationProgress(progress.progress ?? 0);

          if (progress.error) {
            setGenerationError(progress.error);
          }

          // Close SSE when done
          if (stage === 'complete' || stage === 'error') {
            eventSource.close();
            eventSourceRef.current = null;
          }
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        // SSE connection failed - will fall back to time-based estimation
        eventSource.close();
        eventSourceRef.current = null;
      };

      // Stop polling once connected
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    // Start polling immediately, then every 500ms
    pollForGenerationId();
    pollingRef.current = setInterval(pollForGenerationId, 500);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      connectedGenIdRef.current = null;
    };
  }, [isGenerating, serverUrl, setGenerationStage, setGenerationProgress, setGenerationError]);
}
