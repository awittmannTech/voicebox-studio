import type { PlatformHotkey } from "../../../app/src/platform/types";

export class WebHotkey implements PlatformHotkey {
	async registerGlobalHotkey(_shortcut: string): Promise<void> {
		throw new Error("Global hotkeys are not supported in web mode");
	}

	async unregisterGlobalHotkey(): Promise<void> {
		// No-op in web mode
	}

	async getCurrentHotkey(): Promise<string | null> {
		return null;
	}

	onHotkeyPressed(_callback: () => void): () => void {
		// No-op in web mode
		return () => {};
	}

	onHotkeyReleased(_callback: () => void): () => void {
		// No-op in web mode
		return () => {};
	}
}
