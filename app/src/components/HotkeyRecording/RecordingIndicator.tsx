import { Circle } from "lucide-react";
import { useHotkeyStore } from "@/stores/hotkeyStore";

export function RecordingIndicator() {
	const { showRecordingIndicator, recordingDuration } = useHotkeyStore();

	if (!showRecordingIndicator) return null;

	return (
		<div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
			<div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
				<Circle className="w-3 h-3 fill-current animate-pulse" />
				<span className="font-medium">Recording System Audio</span>
				<span className="font-mono">
					{recordingDuration.toFixed(1)}s / 29.0s
				</span>
			</div>
		</div>
	);
}
