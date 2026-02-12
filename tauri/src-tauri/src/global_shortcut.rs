use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

#[derive(Default)]
pub struct GlobalShortcutState {
    current_shortcut: Mutex<Option<String>>,
}

impl GlobalShortcutState {
    pub fn new() -> Self {
        Self {
            current_shortcut: Mutex::new(None),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HotkeyError {
    message: String,
}

impl HotkeyError {
    fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

#[tauri::command]
pub async fn register_global_hotkey(
    app: AppHandle,
    state: tauri::State<'_, GlobalShortcutState>,
    shortcut: String,
) -> Result<(), HotkeyError> {
    // Unregister existing shortcut if any
    let mut current = state.current_shortcut.lock().unwrap();
    if let Some(existing) = current.as_ref() {
        if let Ok(sc) = existing.parse::<Shortcut>() {
            let _ = app.global_shortcut().on_shortcut(sc, |_, _, _| {});
            let _ = app.global_shortcut().unregister(sc);
        }
    }

    // Parse new shortcut
    let parsed_shortcut = shortcut
        .parse::<Shortcut>()
        .map_err(|e| HotkeyError::new(format!("Invalid shortcut format: {}", e)))?;

    // Register new shortcut with press and release handlers
    let app_for_handler = app.clone();

    app.global_shortcut()
        .on_shortcut(parsed_shortcut, move |_app, shortcut, event| {
            match event.state() {
                ShortcutState::Pressed => {
                    println!("Global hotkey pressed: {:?}", shortcut);
                    let _ = app_for_handler.emit("hotkey-pressed", ());
                }
                ShortcutState::Released => {
                    println!("Global hotkey released: {:?}", shortcut);
                    let _ = app_for_handler.emit("hotkey-released", ());
                }
            }
        })
        .map_err(|e| HotkeyError::new(format!("Failed to register shortcut: {}", e)))?;

    app.global_shortcut()
        .register(parsed_shortcut)
        .map_err(|e| HotkeyError::new(format!("Failed to register shortcut: {}", e)))?;

    *current = Some(shortcut);
    println!("Global hotkey registered successfully");

    Ok(())
}

#[tauri::command]
pub async fn unregister_global_hotkey(
    app: AppHandle,
    state: tauri::State<'_, GlobalShortcutState>,
) -> Result<(), HotkeyError> {
    let mut current = state.current_shortcut.lock().unwrap();

    if let Some(shortcut_str) = current.as_ref() {
        if let Ok(shortcut) = shortcut_str.parse::<Shortcut>() {
            // Remove handler
            app.global_shortcut()
                .on_shortcut(shortcut, |_, _, _| {})
                .map_err(|e| HotkeyError::new(format!("Failed to remove handler: {}", e)))?;

            // Unregister
            app.global_shortcut()
                .unregister(shortcut)
                .map_err(|e| HotkeyError::new(format!("Failed to unregister: {}", e)))?;
        }

        *current = None;
        println!("Global hotkey unregistered");
    }

    Ok(())
}

#[tauri::command]
pub async fn get_current_hotkey(
    state: tauri::State<'_, GlobalShortcutState>,
) -> Result<Option<String>, HotkeyError> {
    let current = state.current_shortcut.lock().unwrap();
    Ok(current.clone())
}
