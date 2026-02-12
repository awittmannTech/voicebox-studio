import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HotkeyRecording {
	id: string;
	audio_path: string;
	duration: number;
	transcription: string | null;
	is_processed: boolean;
	created_at: string;
}

interface HotkeySettings {
	hotkeyEnabled: boolean;
	hotkeyShortcut: string;
}

interface HotkeyState {
	isRecording: boolean;
	recordingDuration: number;
	showRecordingIndicator: boolean;
	recordings: HotkeyRecording[];
}

interface HotkeyStore extends HotkeySettings, HotkeyState {
	// Settings (persisted)
	setHotkeyEnabled: (enabled: boolean) => void;
	setHotkeyShortcut: (shortcut: string) => void;

	// Recording state (not persisted)
	setIsRecording: (recording: boolean) => void;
	setRecordingDuration: (duration: number) => void;
	setShowRecordingIndicator: (show: boolean) => void;

	// Recordings list (fetched from backend)
	setRecordings: (recordings: HotkeyRecording[]) => void;
	addRecording: (recording: HotkeyRecording) => void;
	removeRecording: (recordingId: string) => void;
	updateRecording: (recordingId: string, updates: Partial<HotkeyRecording>) => void;
}

export const useHotkeyStore = create<HotkeyStore>()(
	persist(
		(set) => ({
			// Settings (persisted)
			hotkeyEnabled: false,
			hotkeyShortcut: "CommandOrControl+Shift+R",

			// Recording state (not persisted)
			isRecording: false,
			recordingDuration: 0,
			showRecordingIndicator: false,
			recordings: [],

			// Settings actions
			setHotkeyEnabled: (enabled) => set({ hotkeyEnabled: enabled }),
			setHotkeyShortcut: (shortcut) => set({ hotkeyShortcut: shortcut }),

			// Recording state actions
			setIsRecording: (recording) => set({ isRecording: recording }),
			setRecordingDuration: (duration) => set({ recordingDuration: duration }),
			setShowRecordingIndicator: (show) => set({ showRecordingIndicator: show }),

			// Recordings list actions
			setRecordings: (recordings) => set({ recordings }),
			addRecording: (recording) => set((state) => ({
				recordings: [recording, ...state.recordings],
			})),
			removeRecording: (recordingId) => set((state) => ({
				recordings: state.recordings.filter((r) => r.id !== recordingId),
			})),
			updateRecording: (recordingId, updates) => set((state) => ({
				recordings: state.recordings.map((r) =>
					r.id === recordingId ? { ...r, ...updates } : r
				),
			})),
		}),
		{
			name: "hotkey-storage",
			// Only persist settings, not recording state
			partialize: (state) => ({
				hotkeyEnabled: state.hotkeyEnabled,
				hotkeyShortcut: state.hotkeyShortcut,
			}),
		}
	)
);
