import { useState, useEffect, useRef } from 'react';
import { useGenerationStore } from '@/stores/generationStore';
import type { GenerationStage } from '@/stores/generationStore';
import { useServerHealth } from './useServer';

interface GenerationActivity {
  vramUsedMB: number | null;
  vramDelta: number;
  stage: string;
  stageKey: GenerationStage;
  progress: number;
  isActive: boolean;
  gpuType: string | null;
  gpuAvailable: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  loading_model: 'Loading model...',
  creating_voice_prompt: 'Creating voice prompt...',
  generating_audio: 'Generating audio...',
  saving: 'Saving audio...',
  complete: 'Complete',
  error: 'Error',
};

function estimateStage(elapsed: number, modelLoaded?: boolean): string {
  if (!modelLoaded && elapsed < 3) return 'Loading model...';
  if (elapsed < 5) return 'Creating voice prompt...';
  if (elapsed >= 5) return 'Generating audio...';
  return 'Processing...';
}

export function useGenerationActivity(): GenerationActivity {
  const isGenerating = useGenerationStore((state) => state.isGenerating);
  const startTime = useGenerationStore((state) => state.generationStartTime);
  const generationStage = useGenerationStore((state) => state.generationStage);
  const generationProgress = useGenerationStore((state) => state.generationProgress);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [vramDelta, setVramDelta] = useState(0);
  const previousVramRef = useRef<number | null>(null);

  // Poll /health every 2s when generating, 30s when idle
  const { data: health } = useServerHealth({
    refetchInterval: isGenerating ? 2000 : 30000,
    enabled: true,
  });

  // Update elapsed time every second during generation
  useEffect(() => {
    if (!isGenerating || !startTime) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((Date.now() - startTime) / 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating, startTime]);

  // Track VRAM delta for activity indicator
  useEffect(() => {
    if (health?.vram_used_mb !== undefined && health.vram_used_mb !== null) {
      if (previousVramRef.current !== null) {
        const delta = health.vram_used_mb - previousVramRef.current;
        setVramDelta(delta);
      }
      previousVramRef.current = health.vram_used_mb;
    } else {
      setVramDelta(0);
      previousVramRef.current = null;
    }
  }, [health?.vram_used_mb]);

  // Reset VRAM delta when generation stops
  useEffect(() => {
    if (!isGenerating) {
      setVramDelta(0);
      previousVramRef.current = null;
    }
  }, [isGenerating]);

  // Use real stage from SSE if available, fall back to time-based estimation
  const hasRealStage = generationStage !== null;
  const stage = hasRealStage
    ? (STAGE_LABELS[generationStage] || generationStage)
    : estimateStage(elapsedSeconds, health?.model_loaded);

  return {
    vramUsedMB: health?.vram_used_mb ?? null,
    vramDelta,
    stage,
    stageKey: generationStage,
    progress: hasRealStage ? generationProgress : 0,
    isActive: isGenerating,
    gpuType: health?.gpu_type ?? null,
    gpuAvailable: health?.gpu_available ?? false,
  };
}
