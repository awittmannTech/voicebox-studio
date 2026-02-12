import { create } from 'zustand';

export type GenerationStage =
  | 'loading_model'
  | 'creating_voice_prompt'
  | 'generating_audio'
  | 'saving'
  | 'complete'
  | 'error'
  | null;

interface GenerationState {
  isGenerating: boolean;
  activeGenerationId: string | null;
  generationStartTime: number | null;
  generationStage: GenerationStage;
  generationProgress: number;
  generationError: string | null;
  setIsGenerating: (generating: boolean) => void;
  setActiveGenerationId: (id: string | null) => void;
  setGenerationStartTime: (time: number | null) => void;
  setGenerationStage: (stage: GenerationStage) => void;
  setGenerationProgress: (progress: number) => void;
  setGenerationError: (error: string | null) => void;
  resetGenerationProgress: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  isGenerating: false,
  activeGenerationId: null,
  generationStartTime: null,
  generationStage: null,
  generationProgress: 0,
  generationError: null,
  setIsGenerating: (generating) =>
    set({
      isGenerating: generating,
      generationStartTime: generating ? Date.now() : null,
      ...(generating ? {} : { generationStage: null, generationProgress: 0, generationError: null }),
    }),
  setActiveGenerationId: (id) => set({ activeGenerationId: id }),
  setGenerationStartTime: (time) => set({ generationStartTime: time }),
  setGenerationStage: (stage) => set({ generationStage: stage }),
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  setGenerationError: (error) => set({ generationError: error }),
  resetGenerationProgress: () =>
    set({ generationStage: null, generationProgress: 0, generationError: null }),
}));
