# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Voicebox is a local-first voice cloning studio built with:
- **Desktop App**: Tauri (Rust) + React + TypeScript
- **Backend**: FastAPI (Python) with dual backend system (MLX for Apple Silicon, PyTorch for others)
- **Frontend**: React, TypeScript, Tailwind CSS, Zustand, React Query
- **Voice Model**: Qwen3-TTS for voice cloning, Whisper for transcription

This is a monorepo with workspaces: `app/` (shared React frontend), `tauri/` (desktop wrapper), `web/` (web deployment), `backend/` (Python API server), and `landing/` (marketing site).

## Development Commands

### Setup
```bash
# macOS/Linux (recommended)
make setup          # Install all dependencies (JS + Python)
make setup-python   # Setup Python venv and install dependencies
make setup-js       # Install JS dependencies only

# Windows or manual setup
bun install                              # Install JS dependencies
cd backend && python -m venv venv        # Create Python venv
source venv/bin/activate                 # Activate venv (or venv\Scripts\activate on Windows)
pip install -r requirements.txt          # Install Python deps
pip install -r requirements-mlx.txt      # Apple Silicon only (for MLX acceleration)
pip install git+https://github.com/QwenLM/Qwen3-TTS.git
```

### Development
```bash
# Run backend + desktop app (recommended with make)
make dev            # Start both backend and Tauri app in parallel

# Manual (requires 2 terminals)
# Terminal 1: Backend server
make dev-backend    # Or: cd backend && uvicorn main:app --reload --port 17493
# Terminal 2: Desktop app
make dev-frontend   # Or: bun run dev

# Web app development
make dev-web        # Start backend + web app
cd web && bun run dev  # Web app only (assumes backend running)

# Other
bun run dev:landing  # Marketing site
```

**Important**: In dev mode, you must run the backend server separately. The Tauri app connects to `http://localhost:17493`. The bundled server binary is only used in production builds.

### Building
```bash
# Build everything (server binary + desktop app)
make build          # Runs build-server then build-tauri
bun run build       # Alternative (uses package.json scripts)

# Build server binary only
make build-server   # Creates platform-specific binary in tauri/src-tauri/binaries/
./scripts/build-server.sh

# Build with local Qwen3-TTS development version
export QWEN_TTS_PATH=~/path/to/Qwen3-TTS
make build-server

# Build web app
make build-web      # Output in web/dist/
cd web && bun run build

# Build Tauri app only (requires server binary to exist first)
make build-tauri
cd tauri && bun run tauri build
```

**Build outputs**:
- Tauri installers: `tauri/src-tauri/target/release/bundle/` (.dmg, .msi, .AppImage)
- Server binary: `tauri/src-tauri/binaries/voicebox-server-{platform}-{arch}`
- Web build: `web/dist/`

### Code Quality
```bash
# Linting and formatting (uses Biome)
bun run lint        # Check for issues
bun run lint:fix    # Auto-fix issues
bun run format      # Format code
bun run check       # Lint + format + type check
bun run ci          # CI check (runs in GitHub Actions)

# Type checking
make typecheck
bun run tsc --noEmit
```

### Testing
```bash
# Backend tests (manual test scripts, not automated unit tests)
make test-backend   # Requires pytest: pip install pytest
cd backend && pytest -v

# Run specific test file
cd backend && python tests/test_progress.py
```

**Test files in `backend/tests/`** are manual debugging scripts for:
- `test_progress.py` - ProgressManager and HFProgressTracker unit tests
- `test_generation_progress.py` - SSE progress monitoring during TTS generation
- `test_real_download.py` - Real model download with progress tracking

### Database & API
```bash
# Database (SQLite at backend/data/voicebox.db)
make db-init        # Initialize database (happens automatically on server start)
make db-reset       # Delete and reinitialize database

# Generate TypeScript API client from OpenAPI schema
make generate-api   # Backend must be running first
./scripts/generate-api.sh  # Outputs to app/src/lib/api/

# API documentation (backend must be running)
make docs           # Opens http://localhost:17493/docs
open http://localhost:17493/docs
```

### Cleanup
```bash
make clean          # Clean build artifacts (Tauri/web builds)
make clean-python   # Remove venv and Python cache
make clean-build    # Clean Rust/Tauri build cache
make clean-all      # Nuclear clean (everything including node_modules)
make kill-dev       # Kill development processes (uvicorn, vite)
```

## Architecture

### Backend Architecture (Python)

The backend uses a **dual backend system** for optimal performance across platforms:

1. **Platform Detection** (`backend/platform_detect.py`):
   - Detects hardware at runtime
   - Apple Silicon (M1/M2/M3) → MLX backend
   - Windows/Linux/Intel Mac → PyTorch backend

2. **Backend Abstraction** (`backend/backends/`):
   - `backends/__init__.py` - Defines `TTSBackend` and `STTBackend` protocols
   - `backends/mlx_backend.py` - MLX implementation (native Metal acceleration, 4-5x faster)
   - `backends/pytorch_backend.py` - PyTorch implementation (CUDA GPU or CPU fallback)

3. **TTS & Transcription Entry Points**:
   - `backend/tts.py` - TTS abstraction layer, delegates to appropriate backend
   - `backend/transcribe.py` - STT abstraction layer, delegates to appropriate backend
   - Both files auto-detect platform and instantiate the correct backend

4. **API Layer** (`backend/main.py`):
   - All FastAPI routes in a single file
   - Uses Pydantic models from `backend/models.py`
   - Routes delegate to `tts.py`, `transcribe.py`, `profiles.py`, `history.py`

5. **Data Layer**:
   - `backend/database.py` - SQLAlchemy ORM with SQLite
   - `backend/profiles.py` - Voice profile CRUD operations
   - `backend/history.py` - Generation history tracking
   - Database auto-initializes on server startup

6. **Caching** (`backend/utils/cache.py`):
   - Voice prompt caching (memory + disk) for fast regeneration
   - Cache stored in `data/cache/` and persists across restarts

**Key Pattern**: When adding new ML features, implement both `mlx_backend.py` and `pytorch_backend.py` with the same interface, then expose through an abstraction layer (like `tts.py`).

### Frontend Architecture (React + TypeScript)

1. **Shared Frontend** (`app/src/`):
   - Used by both Tauri desktop app and web deployment
   - **State Management**: Zustand stores in `app/src/stores/`
     - `serverStore.ts` - Server connection, health, settings
     - `generationStore.ts` - TTS generation state
     - `storyStore.ts` - Multi-track story/conversation editor
     - `playerStore.ts` - Audio playback state
     - `audioChannelStore.ts` - Audio channel mixing
     - `uiStore.ts` - UI state (modals, tabs, etc.)
   - **API Client**: Auto-generated from OpenAPI schema in `app/src/lib/api/`
   - **Platform Abstraction**: `app/src/platform/` provides unified interface for Tauri and web

2. **Tauri Desktop Wrapper** (`tauri/`):
   - Rust backend in `tauri/src-tauri/`
   - Bundles Python server binary as sidecar
   - Server lifecycle management (start/stop/health checks)
   - Auto-updater integration
   - File system access, dialog prompts

3. **Web Deployment** (`web/`):
   - Thin wrapper around shared `app/` code
   - Assumes backend is running externally
   - No server bundling or lifecycle management

4. **Component Organization**:
   - `app/src/components/` - Feature components organized by domain
   - `app/src/components/ui/` - Radix UI-based design system
   - Tab-based navigation: `VoicesTab`, `StoriesTab`, `AudioTab`, `ModelsTab`, `ServerTab`

### Server Lifecycle Management

**Development Mode** (Tauri):
- App expects backend server to be running manually at `http://localhost:17493`
- No auto-start, no bundled sidecar
- Detected via `!import.meta.env?.PROD` in `App.tsx`

**Production Mode** (Tauri):
- App auto-starts bundled Python server binary on launch
- Server binary is platform-specific: `voicebox-server-{platform}-{arch}`
- Server runs on dynamic port (found in range 17493-17593)
- App updates `serverStore.serverUrl` with actual port
- Server stopped on window close (unless "Keep server running" setting is enabled)

**Server Binary Build** (`scripts/build-server.sh`):
- Uses PyInstaller to create standalone binary
- Bundles all Python dependencies + ML models
- Platform detection: includes MLX deps on Apple Silicon, PyTorch on others
- Output: `tauri/src-tauri/binaries/voicebox-server-{platform}-{arch}`

### Stories Editor (Multi-Track Timeline)

The Stories feature is a timeline-based editor for multi-voice conversations and narratives:

1. **Data Model** (`storyStore.ts`):
   - Story = collection of Tracks
   - Track = ordered list of Clips (each clip is a generated audio segment)
   - Each Clip has: `id`, `text`, `profileId`, `generationId`, `startTime`, `duration`

2. **UI Components**:
   - `StoriesTab.tsx` - Main container with story list + editor
   - `StoryContent.tsx` - Timeline editor with playback controls
   - `StoryTrackEditor.tsx` - Individual track with inline audio editing (trim, split)
   - `StoryChatItem.tsx` - Chat-style input for adding new clips

3. **Features**:
   - Drag-and-drop clip ordering
   - Inline trimming and splitting of audio clips
   - Multi-track composition (e.g., conversation with multiple speakers)
   - Auto-playback with synchronized playhead
   - Export combined audio (planned)

### Voice Prompt Caching

Voice prompts are cached at two levels:

1. **Memory Cache**: In-process dictionary for instant access during same session
2. **Disk Cache**: `data/cache/{hash}.prompt` files persist across server restarts

When generating speech:
- First generation: ~5-10 seconds (creates prompt from reference audio)
- Subsequent generations: ~1-2 seconds (uses cached prompt)

Cache key is based on: `profile_id` + all sample audio hashes + language

### Model Management

Models are lazy-loaded and can be manually managed:

1. **Auto-download**: Models download from HuggingFace Hub on first use
   - Qwen3-TTS (1.7B or 0.6B): ~2-4GB, downloaded on first generation
   - Whisper models: Downloaded on first transcription

2. **Manual Management** (via API):
   - `POST /models/load?model_size=1.7B` - Load specific TTS model
   - `POST /models/unload` - Unload TTS model to free VRAM
   - `GET /health` - Check model status and VRAM usage

3. **Model Variants**:
   - **1.7B** (recommended): Better quality, ~4GB
   - **0.6B** (faster): Acceptable quality, ~2GB, faster on CPU

## Important Patterns and Conventions

### API Client Generation
The TypeScript API client in `app/src/lib/api/` is **auto-generated** from the FastAPI OpenAPI schema. Never manually edit these files:
- Edit backend Pydantic models in `backend/models.py`
- Edit routes in `backend/main.py`
- Regenerate client with `make generate-api` or `./scripts/generate-api.sh`

### Adding New Backend Endpoints
1. Add Pydantic request/response models to `backend/models.py`
2. Add route to `backend/main.py`
3. Implement business logic in appropriate module (`tts.py`, `profiles.py`, etc.)
4. Regenerate TypeScript client: `make generate-api`
5. Update `backend/README.md` with endpoint documentation

### Adding ML Features Requiring Backend Support
1. Implement protocol in `backend/backends/__init__.py` (e.g., `TTSBackend`, `STTBackend`)
2. Implement in `backend/backends/mlx_backend.py` (Apple Silicon)
3. Implement in `backend/backends/pytorch_backend.py` (Windows/Linux/Intel)
4. Create abstraction layer (like `tts.py` or `transcribe.py`) that delegates to backends
5. Expose via FastAPI routes in `main.py`

### Platform Detection in Frontend
Use `usePlatform()` hook from `app/src/platform/PlatformContext.tsx`:
```typescript
const platform = usePlatform();
if (platform.metadata.isTauri) {
  // Tauri-specific code (file system, dialogs, etc.)
} else {
  // Web fallback
}
```

### Tauri Sidecar Binary in Development
During development, Tauri requires a sidecar binary to exist for compilation even though it's not used. The `bun run dev` script automatically runs `scripts/setup-dev-sidecar.js` to create a placeholder binary.

## Version Management

Use `bumpversion` to update version across all files:
```bash
pip install bumpversion

bumpversion patch  # 0.1.0 -> 0.1.1
bumpversion minor  # 0.1.0 -> 0.2.0
bumpversion major  # 0.1.0 -> 1.0.0

git push && git push --tags  # GitHub Actions builds releases automatically
```

This updates: `tauri.conf.json`, `Cargo.toml`, all `package.json` files, `backend/main.py`

## File Locations

- **Backend data**: `backend/data/` (database, profiles, generations, cache, projects)
- **Server binary**: `tauri/src-tauri/binaries/voicebox-server-{platform}-{arch}`
- **Build output**: `tauri/src-tauri/target/release/bundle/`
- **API client**: `app/src/lib/api/` (auto-generated, don't edit manually)
- **Zustand stores**: `app/src/stores/`
- **Backend tests**: `backend/tests/` (manual debugging scripts)

## Platform-Specific Notes

### Apple Silicon (M1/M2/M3)
- Uses MLX backend with native Metal acceleration (4-5x faster than PyTorch)
- Install MLX dependencies: `pip install -r backend/requirements-mlx.txt`
- Backend auto-detects and uses `mlx_backend.py`

### Windows/Linux/Intel Mac
- Uses PyTorch backend (CUDA GPU if available, CPU fallback)
- Backend auto-detects and uses `pytorch_backend.py`
- CUDA recommended for acceptable performance

### Windows Development
- Use manual setup commands (Makefile requires Unix shell)
- Activate venv: `venv\Scripts\activate`
- Consider using WSL for Makefile commands
