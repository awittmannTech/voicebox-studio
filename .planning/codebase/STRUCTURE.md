# Codebase Structure

**Analysis Date:** 2026-02-09

## Directory Layout

```
voicebox/
├── app/                          # Shared React frontend (used by desktop + web)
│   ├── src/
│   │   ├── components/           # Feature components organized by domain
│   │   ├── stores/               # Zustand state management
│   │   ├── lib/
│   │   │   ├── api/              # Auto-generated OpenAPI TypeScript client
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── utils/            # Helper functions (cn, formatting, etc.)
│   │   │   └── constants/        # UI constants, model names, etc.
│   │   ├── platform/             # Platform abstraction interfaces
│   │   ├── assets/               # Images, logos, static files
│   │   ├── main.tsx              # React entry point
│   │   ├── App.tsx               # Root component (server check, loading)
│   │   ├── router.tsx            # TanStack Router configuration
│   │   └── index.css             # Tailwind CSS
│   ├── package.json
│   └── tsconfig.json
│
├── tauri/                        # Tauri desktop app wrapper
│   ├── src/
│   │   ├── main.tsx              # Tauri entry point (PlatformProvider setup)
│   │   └── platform/             # Tauri-specific platform implementation
│   ├── src-tauri/
│   │   ├── src/                  # Rust backend code (window mgmt, server sidecar)
│   │   ├── tauri.conf.json       # Tauri configuration
│   │   ├── Cargo.toml            # Rust dependencies
│   │   └── binaries/             # Server binary sidecar location (production)
│   └── package.json
│
├── web/                          # Web deployment (thin wrapper)
│   ├── src/main.tsx              # Web entry point (minimal setup)
│   └── package.json
│
├── backend/                      # FastAPI Python server
│   ├── main.py                   # FastAPI routes (all endpoints)
│   ├── models.py                 # Pydantic request/response models
│   ├── database.py               # SQLAlchemy ORM models
│   ├── profiles.py               # Voice profile CRUD operations
│   ├── history.py                # Generation history management
│   ├── stories.py                # Story composition and editing
│   ├── channels.py               # Audio channel management
│   ├── hotkey_recordings.py      # Hotkey recording storage
│   ├── tts.py                    # TTS abstraction wrapper
│   ├── transcribe.py             # STT abstraction wrapper
│   ├── platform_detect.py        # Runtime platform detection
│   ├── export_import.py          # Profile export/import ZIP handling
│   ├── server.py                 # Server startup utility
│   ├── config.py                 # Configuration (data dir paths)
│   ├── __init__.py               # Package init (version)
│   ├── backends/                 # ML backend implementations
│   │   ├── __init__.py           # Backend protocols + factory functions
│   │   ├── mlx_backend.py        # Apple Silicon MLX implementation
│   │   └── pytorch_backend.py    # PyTorch implementation (CUDA/CPU)
│   ├── utils/                    # Utility modules
│   │   ├── cache.py              # Voice prompt caching (memory + disk)
│   │   ├── progress.py           # Progress tracking for downloads/generation
│   │   ├── tasks.py              # Active task management
│   │   ├── audio.py              # Audio validation, loading, saving
│   │   ├── images.py             # Avatar image processing
│   │   ├── validation.py         # Input validation helpers
│   │   └── hf_progress.py        # HuggingFace Hub progress tracking
│   ├── data/                     # Runtime data directory (created on startup)
│   │   ├── voicebox.db           # SQLite database
│   │   ├── profiles/             # Voice profile samples and avatars
│   │   ├── generations/          # Generated audio files
│   │   └── cache/                # Voice prompt cache files
│   ├── tests/                    # Manual test scripts (not automated)
│   ├── requirements.txt          # Python dependencies (all platforms)
│   ├── requirements-mlx.txt      # Apple Silicon additional deps
│   └── venv/                     # Python virtual environment
│
├── landing/                      # Marketing website (separate React app)
├── scripts/                      # Build and development scripts
│   ├── build-server.sh           # Build Python server binary with PyInstaller
│   ├── generate-api.sh           # Generate TypeScript client from OpenAPI
│   └── setup-dev-sidecar.js      # Create placeholder binary for Tauri dev
│
├── .github/                      # GitHub Actions workflows
├── .planning/codebase/           # GSD planning documents
├── docs/                         # Documentation site
├── .vscode/                      # VSCode settings
├── Makefile                      # Development commands
├── package.json                  # Root workspace configuration
└── CLAUDE.md                     # This project's Claude instructions

```

## Directory Purposes

**`app/src/`:**
- Purpose: Shared React frontend code (used by both Tauri and web)
- Contains: Components, state management, API client, platform abstraction
- Key files: `App.tsx`, `router.tsx`, `main.tsx`

**`app/src/components/`:**
- Purpose: Feature-based component organization
- Subdirectories:
  - `MainEditor/` - Main generation interface (text input, profile selection, playback)
  - `VoicesTab/` - Voice profile management (create, edit, delete, sample upload)
  - `StoriesTab/` - Multi-track timeline editor
  - `AudioTab/` - Audio channel management and device selection
  - `ModelsTab/` - Model download and management
  - `ServerTab/` - Server connection and settings
  - `HotkeyRecording/` - Global hotkey recording interface
  - `Generation/` - Generation controls (FloatingGenerateBox)
  - `History/` - Generation history table and search
  - `VoiceProfiles/` - Profile list, creation, deletion
  - `AudioPlayer/` - Playback controls and waveform visualization
  - `ui/` - Radix UI-based design system components

**`app/src/stores/`:**
- Purpose: Zustand state management stores
- Files:
  - `serverStore.ts` - Server URL, connection status, mode (local/remote)
  - `generationStore.ts` - Current generation request and selected profile
  - `playerStore.ts` - Audio playback state (URL, playing, time, duration)
  - `storyStore.ts` - Stories, tracks, clips with timings and edits
  - `uiStore.ts` - Active tab, modal visibility
  - `audioChannelStore.ts` - Audio channel state
  - `hotkeyStore.ts` - Global hotkey registration state

**`app/src/lib/api/`:**
- Purpose: Auto-generated TypeScript API client (never manually edit)
- Structure: `core/`, `models/`, `schemas/`, `services/`
- Regenerate via: `make generate-api` (reads OpenAPI schema from running backend)

**`app/src/platform/`:**
- Purpose: Platform abstraction interfaces and context
- Files:
  - `PlatformContext.tsx` - React context provider
  - `types.ts` - Interface definitions (`Platform`, `PlatformFilesystem`, etc.)

**`tauri/src/platform/`:**
- Purpose: Tauri-specific implementation of platform interfaces
- Contains: Filesystem access, auto-update, system audio, hotkey registration

**`backend/`:**
- Purpose: FastAPI server (Python)
- Entry point: `main.py` (all routes in single file)
- Data directory: `data/` (created automatically, contains DB + generated files)

**`backend/backends/`:**
- Purpose: ML backend abstraction layer
- Pattern: Protocol-based with runtime platform detection
- Files:
  - `__init__.py` - Protocol definitions + factory functions
  - `mlx_backend.py` - Apple Silicon with MLX (4-5x faster)
  - `pytorch_backend.py` - PyTorch for Windows/Linux/Intel (CUDA or CPU)

**`backend/utils/`:**
- Purpose: Utility and helper modules
- `cache.py` - Voice prompt caching (2-level: memory + disk)
- `progress.py` - Track download/generation progress
- `tasks.py` - Manage active downloads and generations
- `audio.py` - Load, validate, save audio files
- `validation.py` - Input validation helpers

**`backend/data/`:**
- Purpose: Runtime data storage (created on first server start)
- Structure:
  - `voicebox.db` - SQLite database
  - `profiles/{profile_id}/` - Voice samples and avatars
  - `generations/{profile_id}/` - Generated WAV files
  - `cache/` - Binary voice prompt files
- Gitignored: Not committed to repository

## Key File Locations

**Frontend Entry Points:**
- `app/src/main.tsx` - React entry (used by web)
- `tauri/src/main.tsx` - Tauri entry (wraps React in PlatformProvider)

**Configuration:**
- `tauri/tauri.conf.json` - Tauri app config (window, updater, sidecar)
- `app/tsconfig.json` - TypeScript config with `@/*` path alias
- `backend/config.py` - Backend paths (profiles, generations, cache directories)

**API Routes:**
- `backend/main.py` - Single file containing all FastAPI endpoints

**Core Logic:**
- `backend/tts.py` - TTS wrapper (delegates to MLX or PyTorch)
- `backend/transcribe.py` - STT wrapper (delegates to MLX or PyTorch)
- `backend/profiles.py` - Profile CRUD and sample management
- `backend/history.py` - Generation history queries
- `backend/stories.py` - Story composition and timeline editing
- `backend/database.py` - SQLAlchemy ORM models

**Testing:**
- `backend/tests/` - Manual test scripts (not automated test suite)
  - `test_progress.py` - ProgressManager unit tests
  - `test_generation_progress.py` - SSE progress monitoring
  - `test_real_download.py` - Real model download with tracking

## Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `MainEditor.tsx`, `ProfileList.tsx`)
- Modules: `snake_case.py` (backend) or `camelCase.ts` (frontend, except components)
- Stores: `camelCase.ts` with `Store` suffix (e.g., `serverStore.ts`)
- Hooks: `camelCase.ts` or in component subdirectories
- Utils: `snake_case.py` (backend) or `camelCase.ts` (frontend)

**Directories:**
- Feature components: `PascalCase/` (e.g., `VoicesTab/`, `StoriesTab/`)
- Backend modules: `snake_case/` (e.g., `backends/`, `utils/`)
- Data directories: `snake_case/` (e.g., `profiles/`, `generations/`)

**Functions/Methods:**
- Async functions: `async function nameAsync()` or `async def name_async()` (Python convention)
- Hooks: `use{Name}` (e.g., `useTTS()`, `useProfiles()`)
- Handlers: `handle{Event}` (e.g., `handleGenerate()`)
- Getters/setters: `get{Name}()`, `set{Name}()`

**Variables:**
- Constants: `SCREAMING_SNAKE_CASE` (backend) or `PascalCase` (frontend)
- Boolean flags: `is{Name}`, `has{Name}`, `can{Name}` (e.g., `isLoading`, `hasError`)
- Store instances: `use{Name}` prefix in hooks (e.g., `useServerStore()`)

**Types:**
- Interfaces: `{Name}` (e.g., `Platform`, `VoiceProfile`)
- Enums: `{Name}` or `{Name}Enum`
- Response models: `{Name}Response` (Pydantic in backend)
- Request models: `{Name}Request` or `{Name}Create` (Pydantic in backend)

## Where to Add New Code

**New Frontend Feature:**
- Primary code: `app/src/components/{FeatureName}/`
- State: `app/src/stores/` if global, or component-local if only used locally
- Hooks: `app/src/lib/hooks/` for reusable logic
- Tests: Co-locate with components or in `app/src/components/{FeatureName}/`

**New Backend Endpoint:**
1. Add Pydantic models to `backend/models.py`
2. Add route to `backend/main.py`
3. Implement business logic in appropriate module (`profiles.py`, `history.py`, etc.)
4. Regenerate TypeScript client: `make generate-api`

**New ML Feature (Backend + Frontend):**
1. Define backend protocol in `backend/backends/__init__.py`
2. Implement in `backend/backends/mlx_backend.py` (Apple Silicon)
3. Implement in `backend/backends/pytorch_backend.py` (other platforms)
4. Create abstraction wrapper (like `tts.py` or `transcribe.py`)
5. Add FastAPI routes to `backend/main.py`
6. Regenerate TypeScript client
7. Add frontend component to call API

**New Utility/Helper:**
- Frontend: `app/src/lib/utils/` or `app/src/lib/hooks/`
- Backend: `backend/utils/` (if reusable) or inline in module

**New Component Library:**
- UI components: `app/src/components/ui/` (Radix UI-based)
- Layout components: `app/src/components/AppFrame/`, `app/src/components/Sidebar`

## Special Directories

**`backend/data/`:**
- Purpose: Runtime data storage created on server startup
- Generated: Yes (auto-created if missing)
- Committed: No (in `.gitignore`)
- Structure:
  - `voicebox.db` - SQLite database (persistent)
  - `profiles/{uuid}/` - Voice samples and metadata
  - `generations/{uuid}/` - Generated audio files
  - `cache/` - Voice prompt binary cache for fast regeneration

**`app/src/lib/api/`:**
- Purpose: Auto-generated TypeScript client from OpenAPI schema
- Generated: Yes (via `make generate-api`)
- Committed: Yes (committed so it's available offline)
- Edit policy: Never manually edit—changes made via backend routes

**`tauri/src-tauri/binaries/`:**
- Purpose: Platform-specific server binary sidecar
- Generated: Yes (via `make build-server`)
- Committed: No (ignored in git, too large)
- Naming: `voicebox-server-{platform}-{arch}` (e.g., `voicebox-server-macos-aarch64`)

**`node_modules/`:**
- Purpose: JavaScript dependencies
- Generated: Yes (via `bun install`)
- Committed: No (in `.gitignore`)

**`backend/venv/`:**
- Purpose: Python virtual environment
- Generated: Yes (via `python -m venv venv`)
- Committed: No (in `.gitignore`)

---

*Structure analysis: 2026-02-09*
