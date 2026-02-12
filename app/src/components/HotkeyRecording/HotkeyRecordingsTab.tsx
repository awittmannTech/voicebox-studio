import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Mic,
	Play,
	Trash2,
	FileText,
	UserPlus,
	Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useHotkeyStore } from "@/stores/hotkeyStore";
import { useServerStore } from "@/stores/serverStore";
import { useUIStore } from "@/stores/uiStore";
import { useToast } from "@/components/ui/use-toast";
import { usePlayerStore } from "@/stores/playerStore";
import { usePlatform } from "@/platform/PlatformContext";

export function HotkeyRecordingsTab() {
	const platform = usePlatform();
	const { toast } = useToast();
	const serverUrl = useServerStore((state) => state.serverUrl);
	const queryClient = useQueryClient();
	const setAudioUrl = usePlayerStore((state) => state.setAudioUrl);

	const {
		hotkeyEnabled,
		setHotkeyEnabled,
		hotkeyShortcut,
		setHotkeyShortcut,
		removeRecording,
		updateRecording,
	} = useHotkeyStore();

	const [editingShortcut, setEditingShortcut] = useState(false);
	const [recordingShortcut, setRecordingShortcut] = useState(false);
	const [tempShortcut, setTempShortcut] = useState(hotkeyShortcut);
	const [transcribingId, setTranscribingId] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [creatingProfileId, setCreatingProfileId] = useState<string | null>(null);

	const setProfileFormDraft = useUIStore((state) => state.setProfileFormDraft);
	const setProfileDialogOpen = useUIStore((state) => state.setProfileDialogOpen);
	const profileDialogOpen = useUIStore((state) => state.profileDialogOpen);
	const setPendingHotkeyRecordingId = useUIStore((state) => state.setPendingHotkeyRecordingId);
	const pendingHotkeyRecordingId = useUIStore((state) => state.pendingHotkeyRecordingId);

	// When profile dialog closes after creating from a hotkey recording, mark it as processed
	useEffect(() => {
		if (!profileDialogOpen && pendingHotkeyRecordingId) {
			const recordingId = pendingHotkeyRecordingId;
			setPendingHotkeyRecordingId(null);

			fetch(`${serverUrl}/hotkey-recordings/${recordingId}/mark-processed`, {
				method: "POST",
			})
				.then(() => {
					queryClient.invalidateQueries({ queryKey: ["hotkey-recordings"] });
				})
				.catch((err) => {
					console.error("Failed to mark recording as processed:", err);
				});
		}
	}, [profileDialogOpen, pendingHotkeyRecordingId, serverUrl, queryClient, setPendingHotkeyRecordingId]);

	// Fetch recordings from backend
	const { data: recordingsData, isLoading } = useQuery({
		queryKey: ["hotkey-recordings"],
		queryFn: async () => {
			const response = await fetch(`${serverUrl}/hotkey-recordings`);
			if (!response.ok) throw new Error("Failed to fetch recordings");
			return response.json();
		},
		refetchInterval: 5000, // Refresh every 5 seconds
	});

	const recordings = recordingsData?.items || [];

	const handleToggleHotkey = (enabled: boolean) => {
		if (!platform.metadata.isTauri) {
			toast({
				title: "Not available",
				description: "Hotkeys are only available in desktop mode",
				variant: "destructive",
			});
			return;
		}
		setHotkeyEnabled(enabled);
	};

	const handleRecordShortcut = () => {
		setRecordingShortcut(true);
		setEditingShortcut(true);
		setTempShortcut("Press keys...");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!recordingShortcut) return;

		e.preventDefault();
		e.stopPropagation();

		const keys: string[] = [];

		// Add modifiers
		if (e.ctrlKey || e.metaKey) {
			keys.push("CommandOrControl");
		}
		if (e.shiftKey) {
			keys.push("Shift");
		}
		if (e.altKey) {
			keys.push("Alt");
		}

		// Add the main key (ignore modifier keys themselves)
		const mainKey = e.key;
		if (!["Control", "Shift", "Alt", "Meta"].includes(mainKey)) {
			if (mainKey === " ") {
				keys.push("Space");
			} else if (mainKey.length === 1) {
				// Single character key (letter, number, symbol)
				keys.push(mainKey.toUpperCase());
			} else if (
				["Enter", "Tab", "Escape", "Backspace", "Delete", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(mainKey)
			) {
				keys.push(mainKey);
			} else if (mainKey.startsWith("F") && mainKey.length <= 3) {
				// Function keys F1-F12
				keys.push(mainKey);
			}
		}

		// Accept any key combination (with or without modifiers)
		if (keys.length > 0) {
			const shortcut = keys.join("+");
			setTempShortcut(shortcut);
			setRecordingShortcut(false);
		}
	};

	const handleSaveShortcut = () => {
		if (!tempShortcut.trim() || tempShortcut === "Press keys...") {
			toast({
				title: "Invalid shortcut",
				description: "Please record a valid key combination",
				variant: "destructive",
			});
			return;
		}
		setHotkeyShortcut(tempShortcut);
		setEditingShortcut(false);
		setRecordingShortcut(false);
		toast({
			title: "Shortcut updated",
			description: "Hotkey will be re-registered automatically",
		});
	};

	const handlePlay = (recordingId: string) => {
		setAudioUrl(`${serverUrl}/hotkey-recordings/${recordingId}/audio`);
	};

	const handleTranscribe = async (recordingId: string) => {
		setTranscribingId(recordingId);
		try {
			const response = await fetch(
				`${serverUrl}/hotkey-recordings/${recordingId}/transcribe`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ language: "en" }),
				}
			);

			if (!response.ok) throw new Error("Failed to transcribe");

			const updated = await response.json();
			updateRecording(recordingId, updated);
			queryClient.invalidateQueries({ queryKey: ["hotkey-recordings"] });

			toast({
				title: "Transcription complete",
			});
		} catch (error) {
			console.error("Transcription error:", error);
			toast({
				title: "Failed to transcribe",
				description:
					error instanceof Error ? error.message : "Unknown error",
				variant: "destructive",
			});
		} finally {
			setTranscribingId(null);
		}
	};

	const handleDelete = async (recordingId: string) => {
		if (!confirm("Are you sure you want to delete this recording?")) return;

		setDeletingId(recordingId);
		try {
			const response = await fetch(
				`${serverUrl}/hotkey-recordings/${recordingId}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) throw new Error("Failed to delete");

			removeRecording(recordingId);
			queryClient.invalidateQueries({ queryKey: ["hotkey-recordings"] });

			toast({
				title: "Recording deleted",
			});
		} catch (error) {
			console.error("Delete error:", error);
			toast({
				title: "Failed to delete",
				description:
					error instanceof Error ? error.message : "Unknown error",
				variant: "destructive",
			});
		} finally {
			setDeletingId(null);
		}
	};

	const handleCreateProfile = async (recording: any) => {
		setCreatingProfileId(recording.id);
		try {
			// Fetch the recording audio as a blob
			const audioResponse = await fetch(
				`${serverUrl}/hotkey-recordings/${recording.id}/audio`
			);
			if (!audioResponse.ok) throw new Error("Failed to fetch recording audio");

			const audioBlob = await audioResponse.blob();

			// Convert blob to base64
			const base64 = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onloadend = () => {
					const result = reader.result as string;
					// Extract base64 data after the data URL prefix
					const base64Data = result.split(",")[1];
					resolve(base64Data);
				};
				reader.onerror = reject;
				reader.readAsDataURL(audioBlob);
			});

			// Set the profile form draft with the recording data
			setProfileFormDraft({
				name: "",
				description: "",
				language: "en",
				referenceText: recording.transcription || "",
				sampleMode: "upload",
				sampleFileName: `hotkey_recording_${recording.id}.wav`,
				sampleFileType: "audio/wav",
				sampleFileData: base64,
			});

			// Track which recording we're creating a profile from
			setPendingHotkeyRecordingId(recording.id);

			// Open the profile creation dialog
			setProfileDialogOpen(true);
		} catch (error) {
			console.error("Create profile error:", error);
			toast({
				title: "Failed to prepare profile",
				description:
					error instanceof Error ? error.message : "Unknown error",
				variant: "destructive",
			});
		} finally {
			setCreatingProfileId(null);
		}
	};

	return (
		<div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
			{/* Settings Card */}
			<Card>
				<CardHeader>
					<CardTitle>Hotkey Recording Settings</CardTitle>
					<CardDescription>
						Configure global hotkey for quick voice cloning from system audio
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Enable/Disable */}
					<div className="flex items-center space-x-2">
						<Checkbox
							id="hotkey-enabled"
							checked={hotkeyEnabled}
							onCheckedChange={handleToggleHotkey}
							disabled={!platform.metadata.isTauri}
						/>
						<div className="space-y-0.5">
							<Label htmlFor="hotkey-enabled" className="cursor-pointer">
								Enable Hotkey Recording
							</Label>
							<p className="text-sm text-muted-foreground">
								Press and hold the hotkey to record system audio
							</p>
						</div>
					</div>

					{/* Shortcut Configuration */}
					<div className="space-y-2">
						<Label htmlFor="hotkey-shortcut">Hotkey Shortcut</Label>
						{editingShortcut ? (
							<div className="flex gap-2">
								<Input
									id="hotkey-shortcut"
									value={tempShortcut}
									onKeyDown={handleKeyDown}
									readOnly={recordingShortcut}
									placeholder="Press Record and then your key combination"
									className={`flex-1 font-mono ${recordingShortcut ? "animate-pulse" : ""}`}
									autoFocus
								/>
								<Button onClick={handleSaveShortcut} size="sm">
									Save
								</Button>
								<Button
									onClick={() => {
										setTempShortcut(hotkeyShortcut);
										setEditingShortcut(false);
										setRecordingShortcut(false);
									}}
									size="sm"
									variant="outline"
								>
									Cancel
								</Button>
							</div>
						) : (
							<div className="flex gap-2">
								<Input
									value={hotkeyShortcut}
									disabled
									className="flex-1 font-mono"
								/>
								<Button
									onClick={handleRecordShortcut}
									size="sm"
									variant="outline"
								>
									Record
								</Button>
							</div>
						)}
						<p className="text-xs text-muted-foreground">
							{recordingShortcut
								? "Press your desired key combination now..."
								: "Click Record and press your desired key combination (e.g., Ctrl+Shift+R)"}
						</p>
					</div>

					{!platform.metadata.isTauri && (
						<div className="bg-muted p-3 rounded-md text-sm">
							Hotkey recording is only available in desktop mode
						</div>
					)}
				</CardContent>
			</Card>

			{/* Recordings List */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Mic className="w-5 h-5" />
						Recordings ({recordings.length})
					</CardTitle>
					<CardDescription>
						Manage your hotkey recordings and convert them to voice profiles
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="text-center py-8 text-muted-foreground">
							Loading recordings...
						</div>
					) : recordings.length === 0 ? (
						<div className="text-center py-12">
							<Mic className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
							<p className="text-muted-foreground">
								No recordings yet
							</p>
							<p className="text-sm text-muted-foreground mt-1">
								{hotkeyEnabled
									? `Press ${hotkeyShortcut} to record system audio`
									: "Enable the hotkey to start recording"}
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{recordings.map((recording: any) => (
								<div
									key={recording.id}
									className="border rounded-lg p-4 space-y-3"
								>
									<div className="flex items-center justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<span className="font-medium">
													{new Date(
														recording.created_at
													).toLocaleString()}
												</span>
												<span className="text-sm text-muted-foreground">
													{recording.duration.toFixed(1)}s
												</span>
											</div>
											{recording.transcription && (
												<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
													{recording.transcription}
												</p>
											)}
										</div>
										<div className="flex items-center gap-2">
											<Button
												size="sm"
												variant="ghost"
												onClick={() => handlePlay(recording.id)}
											>
												<Play className="w-4 h-4" />
											</Button>
											{!recording.transcription ? (
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														handleTranscribe(recording.id)
													}
													disabled={
														transcribingId === recording.id
													}
												>
													{transcribingId === recording.id ? (
														<>
															<Loader2 className="w-4 h-4 mr-2 animate-spin" />
															Transcribing...
														</>
													) : (
														<>
															<FileText className="w-4 h-4 mr-2" />
															Transcribe
														</>
													)}
												</Button>
											) : (
												<Button
													size="sm"
													variant="outline"
													disabled={creatingProfileId === recording.id}
													onClick={() => handleCreateProfile(recording)}
												>
													{creatingProfileId === recording.id ? (
														<>
															<Loader2 className="w-4 h-4 mr-2 animate-spin" />
															Preparing...
														</>
													) : (
														<>
															<UserPlus className="w-4 h-4 mr-2" />
															Create Profile
														</>
													)}
												</Button>
											)}
											<Button
												size="sm"
												variant="ghost"
												onClick={() => handleDelete(recording.id)}
												disabled={deletingId === recording.id}
											>
												{deletingId === recording.id ? (
													<Loader2 className="w-4 h-4 animate-spin" />
												) : (
													<Trash2 className="w-4 h-4" />
												)}
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
