# Architecture

**Analysis Date:** 2026-02-09

## Pattern Overview

**Overall:** Monorepo with dual backend abstraction (MLX/PyTorch) and platform-agnostic React frontend.

**Key Characteristics:**
- Backend abstraction layer that auto-detects platform and selects optimal ML runtime
- Shared React frontend used by both Tauri desktop and web deployments
- Zustand-based client-side state management
- FastAPI single-file routing layer delegating to specialized modules
- Server sidecar bundling pattern for production Tauri builds

## Layers

**Frontend (React/TypeScript):**
- Purpose: User interface for voice generation, profile management, stories editor, and server control
- Location: `app/src/`
- Contains: Components, Zustand stores, hooks, platform abstraction, API client
- Depends on: Auto-generated OpenAPI client, Zustand, React Router, Radix UI, TanStack Query
- Used by: Tauri desktop app (`tauri/src/main.tsx`) and web deployment (`web/`)

**Platform Abstraction:**
- Purpose: Unified interface for Tauri-specific features (file dialogs, system audio, auto-update, hotkey recording) while providing web fallbacks
- Location: `app/src/platform/PlatformContext.tsx` (shared), `tauri/src/platform/` (Tauri implementation)
- Contains: Filesystem, updater, audio, lifecycle, metadata, hotkey interfaces and implementations
- Depends on: `@tauri-apps/api`, `@tauri-apps/plugin-*`
- Used by: App.tsx, components requiring native features

**State Management (Zustand):**
- Purpose: Client-side state for server connection, generation progress, playback, UI state, voice profiles
- Location: `app/src/stores/`
- Contains: `serverStore.ts`, `generationStore.ts`, `playerStore.ts`, `storyStore.ts`, `uiStore.ts`, `audioChannelStore.ts`, `hotkeyStore.ts`
- Depends on: Zustand persistence middleware
- Used by: React components, hooks

**Backend API (FastAPI):**
- Purpose: REST API server for TTS generation, voice profile management, transcription, story management
- Location: `backend/main.py`
- Contains: All route handlers organized by domain (profiles, history, tts, transcription, etc.)
- Depends on: SQLAlchemy ORM, platform-specific ML backends, Pydantic models
- Used by: Frontend via auto-generated TypeScript client

**ML Backend Abstraction:**
- Purpose: Runtime-optimized speech synthesis and transcription with automatic platform detection
- Location: `backend/backends/`
- Contains: Protocol definitions (`__init__.py`), MLX implementation (`mlx_backend.py`), PyTorch implementation (`pytorch_backend.py`)
- Depends on: Qwen3-TTS, Whisper, MLX (Apple Silicon) or PyTorch (other platforms)
- Used by: `tts.py`, `transcribe.py` wrapper modules

**TTS/Transcription Wrappers:**
- Purpose: Platform-agnostic entry points that delegate to correct backend
- Location: `backend/tts.py`, `backend/transcribe.py`
- Contains: `get_tts_model()`, `get_whisper_model()`, model loading/unloading functions
- Depends on: Backend abstraction layer, platform detection
- Used by: `main.py` API routes

**Data Layer (SQLAlchemy ORM):**
- Purpose: Database abstraction and model definitions
- Location: `backend/database.py`
- Contains: ORM models for profiles, generations, stories, story items, hotkey recordings
- Depends on: SQLAlchemy, SQLite
- Used by: `profiles.py`, `history.py`, `stories.py`, API routes

**Business Logic Modules:**
- `backend/profiles.py`: Voice profile CRUD with sample audio management
- `backend/history.py`: Generation history queries and management
- `backend/stories.py`: Multi-track story timeline management
- `backend/hotkey_recordings.py`: Hotkey recording storage and transcription
- `backend/channels.py`: Audio channel management for multi-device playback
- `backend/export_import.py`: Profile export/import with ZIP packaging

**Utilities:**
- `backend/utils/cache.py`: Voice prompt caching (memory + disk) for fast regeneration
- `backend/utils/progress.py`: Progress tracking for long-running operations (downloads, generation)
- `backend/utils/tasks.py`: Active task management for downloads and generations
- `backend/utils/audio.py`: Audio validation, loading, and saving utilities
- `backend/utils/validation.py`: Input validation helpers
- `backend/utils/hf_progress.py`: HuggingFace Hub download progress tracking

**Server Lifecycle:**
- `backend/server.py`: Server startup utility
- `backend/main.py`: Graceful shutdown endpoint (`POST /shutdown`)

## Data Flow

**Voice Generation Flow:**

1. Frontend: User enters text + selects voice profile in `MainEditor` or `StoriesTab`
2. Frontend: `useGenerationStore` captures generation request
3. Frontend: `useTTS()` hook calls `POST /generate` API
4. Backend: `main.py` validates request via Pydantic `GenerationRequest`
5. Backend: Route handler calls `tts.py` which gets platform-optimized backend
6. Backend: Backend loads voice prompt (from cache if available, else creates from profile samples)
7. Backend: Backend calls Qwen3-TTS to generate audio with optional seed/instruct
8. Backend: Audio saved to `backend/data/generations/{profile_id}/{uuid}.wav`
9. Backend: Metadata saved to SQLite via `history.create_generation()`
10. Backend: Response streamed with progress events via SSE
11. Frontend: Audio URL stored in `playerStore`, playback available immediately

**Profile Creation Flow:**

1. Frontend: User uploads audio sample + metadata in `VoicesTab`
2. Frontend: Calls `POST /profiles/{id}/samples` with audio file
3. Backend: `profiles.py` validates audio via `validate_reference_audio()`
4. Backend: Audio sample saved to `backend/data/profiles/{profile_id}/samples/`
5. Backend: Profile metadata saved to database
6. Backend: Voice prompt created from sample on first generation (cached thereafter)

**Story Composition Flow:**

1. Frontend: User creates story in `StoriesTab`
2. Frontend: User adds generated clips via `StoryChatItem` (drag-drop or inline generation)
3. Frontend: `storyStore` tracks clips with track number, start time, trim points
4. Frontend: `PUT /stories/{id}/items/{item_id}` sends reorder/trim updates
5. Backend: `stories.py` updates story item positions and trim metadata
6. Frontend: Playback synchronizes across tracks using start_time_ms and duration

**Progress Tracking (Downloads/Generation):**

1. Backend: `utils/progress.py` maintains global `ProgressManager`
2. Backend: HuggingFace downloads emit progress to `utils/hf_progress.py`
3. Frontend: `useRestoreActiveTasks()` polls `GET /tasks/active` periodically
4. Frontend: `useModelDownloadToast()` subscribes to download progress via polling
5. Frontend: Progress updates trigger toast notifications showing download %

## State Management

**Server Connection:**
- Store: `useServerStore` (persisted to localStorage)
- State: `serverUrl`, `isConnected`, `mode` ('local'|'remote'), `keepServerRunningOnClose`
- Updated by: Server startup (Tauri), API health checks, user settings

**Generation State:**
- Store: `useGenerationStore` (ephemeral)
- State: Current generation request, selected profile, text, language, seed
- Updated by: Form inputs, profile selection, generation completion

**Playback State:**
- Store: `usePlayerStore` (ephemeral)
- State: `audioUrl`, `isPlaying`, `currentTime`, `duration`
- Updated by: Audio player controls, completion

**Story State:**
- Store: `useStoryStore` (ephemeral)
- State: Stories list, active story, clips with timings and trim points
- Updated by: API responses, user edits (reorder, trim, split)

**UI State:**
- Store: `useUIStore` (ephemeral)
- State: Active tab, modal visibility, dialog state
- Updated by: Navigation, user interactions

## Key Abstractions

**Backend Protocol (TTSBackend, STTBackend):**
- Purpose: Abstract over MLX and PyTorch implementations
- Examples: `backend/backends/mlx_backend.py`, `backend/backends/pytorch_backend.py`
- Pattern: Protocol-based polymorphism with runtime platform detection

**Platform Interface:**
- Purpose: Abstract Tauri APIs from React frontend
- Examples: `PlatformFilesystem`, `PlatformAudio`, `PlatformLifecycle`
- Pattern: Dependency injection via `PlatformProvider` context

**API Client (auto-generated):**
- Purpose: Type-safe TypeScript client from OpenAPI schema
- Location: `app/src/lib/api/` (never manually edited)
- Regenerated via: `make generate-api` after backend route changes

**Voice Prompt Caching:**
- Purpose: Cache voice prompts from profile samples for 5-10x generation speedup
- Strategy: Memory cache (fast) + disk cache at `backend/data/cache/{hash}.prompt`
- Key: Hash of profile_id + sample audio hashes + language

## Entry Points

**Tauri Desktop App:**
- Location: `tauri/src/main.tsx`
- Triggers: User runs desktop app installer
- Responsibilities:
  - Wraps shared React frontend in Tauri context
  - Provides `tauriPlatform` implementation of platform interfaces
  - In production: Auto-starts Python server sidecar binary
  - Manages window lifecycle and server shutdown

**Web App:**
- Location: `web/` (thin wrapper around `app/src/`)
- Triggers: User navigates to hosted URL
- Responsibilities:
  - Loads shared React frontend
  - Assumes backend running externally (no server bundling)
  - Uses web fallbacks for platform APIs

**Shared Frontend:**
- Location: `app/src/main.tsx` or `tauri/src/main.tsx`
- Initialization: `App.tsx` checks server connectivity before rendering main UI
- Loading state: Shows loading spinner until server responds to health check

**Backend Server (FastAPI):**
- Location: `backend/main.py`
- Run command: `uvicorn main:app --reload --port 17493`
- Initialization: Auto-creates SQLite database on first run via `database.init_db()`
- Health check: `GET /health` returns model status, VRAM, backend type

## Error Handling

**Strategy:** API returns HTTP status codes with error details; frontend shows toast notifications.

**Patterns:**
- Validation: Pydantic validates input on routes, returns 422 with field errors
- Not found: Returns 404 for missing profiles/generations
- Server error: Returns 500 with error message logged to stdout
- Connection error: Frontend retries with exponential backoff, shows connection status in UI

**Frontend Error Recovery:**
- Model loading failures: Shows "model not found" dialog with download option
- Generation failure: Shows error toast with retry button
- Server disconnect: Shows "server offline" banner, auto-reconnects on recovery

## Cross-Cutting Concerns

**Logging:** Backend uses Python logging to stdout; frontend uses console.log

**Validation:**
- Backend: Pydantic models enforce schema + custom validators
- Frontend: React Hook Form + Zod for client-side validation

**Authentication:** Not implemented (local-first, assumes localhost/trusted network)

**CORS:** Allows all origins (`*`) in development; should be restricted in production

**File Storage:**
- Profiles: `backend/data/profiles/{profile_id}/` contains samples and avatar
- Generations: `backend/data/generations/{profile_id}/` contains WAV files
- Cache: `backend/data/cache/` contains `.prompt` files (binary voice prompts)
- Database: `backend/data/voicebox.db` (SQLite)

---

*Architecture analysis: 2026-02-09*
