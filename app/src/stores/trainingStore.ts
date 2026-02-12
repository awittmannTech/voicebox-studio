import { create } from 'zustand';

interface TrainingState {
  activeJobId: string | null;
  activeProfileId: string | null;
  setActiveJob: (jobId: string, profileId: string) => void;
  clearActiveJob: () => void;
}

export const useTrainingStore = create<TrainingState>((set) => ({
  activeJobId: null,
  activeProfileId: null,
  setActiveJob: (jobId, profileId) => set({ activeJobId: jobId, activeProfileId: profileId }),
  clearActiveJob: () => set({ activeJobId: null, activeProfileId: null }),
}));
