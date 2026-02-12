import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { PlatformHotkey } from "../../../app/src/platform/types";

export class TauriHotkey implements PlatformHotkey {
	async registerGlobalHotkey(shortcut: string): Promise<void> {
		try {
			await invoke("register_global_hotkey", { shortcut });
		} catch (error) {
			console.error("Failed to register global hotkey:", error);
			throw error;
		}
	}

	async unregisterGlobalHotkey(): Promise<void> {
		try {
			await invoke("unregister_global_hotkey");
		} catch (error) {
			console.error("Failed to unregister global hotkey:", error);
			throw error;
		}
	}

	async getCurrentHotkey(): Promise<string | null> {
		try {
			return await invoke<string | null>("get_current_hotkey");
		} catch (error) {
			console.error("Failed to get current hotkey:", error);
			return null;
		}
	}

	onHotkeyPressed(callback: () => void): () => void {
		let unlisten: (() => void) | null = null;

		listen("hotkey-pressed", () => {
			callback();
		}).then((unlistenFn) => {
			unlisten = unlistenFn;
		});

		return () => {
			if (unlisten) {
				unlisten();
			}
		};
	}

	onHotkeyReleased(callback: () => void): () => void {
		let unlisten: (() => void) | null = null;

		listen("hotkey-released", () => {
			callback();
		}).then((unlistenFn) => {
			unlisten = unlistenFn;
		});

		return () => {
			if (unlisten) {
				unlisten();
			}
		};
	}
}
