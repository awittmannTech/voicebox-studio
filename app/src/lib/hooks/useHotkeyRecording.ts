import { useCallback, useEffect } from "react";
import { usePlatform } from "@/platform/PlatformContext";
import { useHotkeyStore } from "@/stores/hotkeyStore";
import { useSystemAudioCapture } from "./useSystemAudioCapture";
import { useServerStore } from "@/stores/serverStore";
import { useToast } from "@/components/ui/use-toast";

export function useHotkeyRecording() {
	const platform = usePlatform();
	const { toast } = useToast();
	const serverUrl = useServerStore((state) => state.serverUrl);
	const {
		hotkeyEnabled,
		hotkeyShortcut,
		isRecording,
		setIsRecording,
		setRecordingDuration,
		setShowRecordingIndicator,
		addRecording,
	} = useHotkeyStore();

	// System audio capture hook
	const {
		startRecording,
		stopRecording,
		duration,
		error: captureError,
	} = useSystemAudioCapture({
		maxDurationSeconds: 29,
		onRecordingComplete: async (blob, audioDuration) => {
			try {
				// Upload to backend
				const formData = new FormData();
				formData.append("audio", blob, "recording.wav");
				formData.append("duration", String(audioDuration || duration));

				const response = await fetch(`${serverUrl}/hotkey-recordings`, {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					throw new Error("Failed to save recording");
				}

				const recording = await response.json();
				addRecording(recording);

				toast({
					title: "Recording saved",
					description: `Duration: ${audioDuration?.toFixed(1)}s`,
				});
			} catch (error) {
				console.error("Failed to save recording:", error);
				toast({
					title: "Failed to save recording",
					description:
						error instanceof Error ? error.message : "Unknown error",
					variant: "destructive",
				});
			}
		},
	});

	// Update recording duration in store
	useEffect(() => {
		setRecordingDuration(duration);
	}, [duration, setRecordingDuration]);

	// Show toast on capture errors
	useEffect(() => {
		if (captureError) {
			toast({
				title: "Recording failed",
				description: captureError,
				variant: "destructive",
			});
		}
	}, [captureError, toast]);

	// Handle hotkey press → start recording
	const handleHotkeyPress = useCallback(async () => {
		if (isRecording) return; // Prevent double-press

		console.log("Hotkey pressed, starting system audio recording");
		setIsRecording(true);
		setShowRecordingIndicator(true);

		try {
			await startRecording();
		} catch (error) {
			console.error("Failed to start recording:", error);
			setIsRecording(false);
			setShowRecordingIndicator(false);
		}
	}, [
		isRecording,
		startRecording,
		setIsRecording,
		setShowRecordingIndicator,
	]);

	// Handle hotkey release → stop recording
	const handleHotkeyRelease = useCallback(async () => {
		if (!isRecording) return;

		console.log("Hotkey released, stopping recording");
		setIsRecording(false);

		try {
			await stopRecording();
			setShowRecordingIndicator(false);
		} catch (error) {
			console.error("Failed to stop recording:", error);
			setShowRecordingIndicator(false);
		}
	}, [isRecording, stopRecording, setIsRecording, setShowRecordingIndicator]);

	// Register/unregister hotkey when enabled changes
	useEffect(() => {
		if (!platform.metadata.isTauri) return;

		if (hotkeyEnabled) {
			console.log(
				`Registering global hotkey: ${hotkeyShortcut}`
			);
			platform.hotkey
				.registerGlobalHotkey(hotkeyShortcut)
				.then(() => {
					console.log("Global hotkey registered successfully");
					toast({
						title: "Hotkey enabled",
						description: `Press ${hotkeyShortcut} to record`,
					});
				})
				.catch((error) => {
					console.error("Failed to register global hotkey:", error);
					toast({
						title: "Failed to register hotkey",
						description:
							error instanceof Error ? error.message : "Unknown error",
						variant: "destructive",
					});
				});
		} else {
			platform.hotkey.unregisterGlobalHotkey().catch((error) => {
				console.error("Failed to unregister global hotkey:", error);
			});
		}

		return () => {
			if (hotkeyEnabled) {
				platform.hotkey.unregisterGlobalHotkey().catch((error) => {
					console.error("Failed to unregister global hotkey:", error);
				});
			}
		};
	}, [hotkeyEnabled, hotkeyShortcut, platform]);

	// Listen for hotkey events
	useEffect(() => {
		if (!platform.metadata.isTauri || !hotkeyEnabled) return;

		const unlistenPress = platform.hotkey.onHotkeyPressed(handleHotkeyPress);
		const unlistenRelease = platform.hotkey.onHotkeyReleased(handleHotkeyRelease);

		return () => {
			unlistenPress();
			unlistenRelease();
		};
	}, [hotkeyEnabled, handleHotkeyPress, handleHotkeyRelease, platform]);

	return {
		isRecording,
		duration,
	};
}
