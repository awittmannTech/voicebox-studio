# External Integrations

**Analysis Date:** 2026-02-09

## APIs & External Services

**Model Hosting & Distribution:**
- Hugging Face Hub (https://huggingface.co/)
  - Service: Model repository and CDN for ML models
  - What it's used for: Download Qwen3-TTS and Whisper models on demand
  - SDK/Client: `huggingface_hub` 0.20+ (Python)
  - Auth: None required (public models)
  - Integration points:
    - `backend/main.py` - Model status checking, cache scanning
    - `backend/backends/mlx_backend.py` - MLX model downloading
    - `backend/backends/pytorch_backend.py` - PyTorch model downloading
    - `backend/utils/hf_progress.py` - Progress tracking during downloads
  - Cache behavior: Models cached locally (system-wide or app-specific), lazy-loaded on first use

## Data Storage

**Databases:**
- SQLite 3
  - File location: `backend/data/voicebox.db`
  - Purpose: Store voice profiles, generation history, stories, audio channels, hotkey recordings
  - Client: SQLAlchemy 2.0+ ORM
  - Connection: File-based, no credentials needed
  - Auto-initialization: Happens automatically on first server start
  - Models/Tables:
    - `VoiceProfile` - Voice profiles with name, description, language, avatar
    - `ProfileSample` - Reference audio samples for voice cloning
    - `Generation` - TTS generation history with metadata
    - `Story` - Multi-track story/conversation projects
    - `StoryItem` - Individual clips within stories (with trimming/timing)
    - `Project` - Audio studio projects
    - `AudioChannel` - Audio mixing buses/channels
    - `HotkeyRecording` - Quick capture recordings triggered by hotkey

**File Storage:**
- Local filesystem (no cloud storage)
  - Profile avatars: `backend/data/profiles/{profile_id}/avatar.{ext}`
  - Generated audio: `backend/data/generations/{generation_id}.wav`
  - Voice prompt cache: `backend/data/cache/{hash}.prompt` (pickled prompt objects for fast regeneration)
  - Hotkey recordings: `backend/data/hotkey_recordings/{recording_id}.wav`
  - Models: `backend/data/models/` or system HuggingFace cache

**Caching:**
- In-process memory cache (session-scoped)
  - Voice prompt caching for instant regeneration
  - Reduces TTS generation time from 5-10s (first gen) to 1-2s (cached)
- Disk cache: `backend/data/cache/` (persists across server restarts)

## Authentication & Identity

**Auth Provider:**
- None - Local-first application
- No user accounts, logins, or API tokens needed
- Data stored locally in `backend/data/`

**Platform-Specific Access:**
- Tauri plugins handle OS-level permissions:
  - File system access (read/write)
  - Global hotkey registration (desktop only)
  - Process management (server lifecycle)
  - Audio device enumeration (desktop only)

## ML Model Integration

**Voice Cloning Model:**
- Provider: Alibaba Qwen (via Hugging Face Hub)
- Model: Qwen3-TTS (12Hz variants)
- Variants:
  - 1.7B (recommended): Higher quality, ~4GB disk, slower on CPU
  - 0.6B (fast): Acceptable quality, ~2GB disk, faster on CPU
- Backends:
  - **MLX** (Apple Silicon): `backend/backends/mlx_backend.py`
    - Model ID: `mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16`
    - Acceleration: Metal GPU (4-5x faster than PyTorch)
  - **PyTorch** (Windows/Linux/Intel Mac): `backend/backends/pytorch_backend.py`
    - Model ID: `Qwen/Qwen3-TTS-12Hz-1.7B-Base`
    - Acceleration: CUDA GPU (if available) or CPU fallback
- Auto-detection: `backend/platform_detect.py` selects backend at runtime
- Caching: Models cached in HuggingFace hub cache, loaded once per session

**Speech-to-Text Model:**
- Provider: OpenAI Whisper (via transformers library)
- Usage: Transcribe audio samples for reference during voice cloning
- Auto-download: Downloaded on first transcription request
- Backends: Supports both MLX and PyTorch

## Networking & Connectivity

**HTTP Server:**
- FastAPI + Uvicorn
- Endpoint: `http://localhost:17493` (default, can vary in production 17493-17593)
- CORS: All origins allowed in development (`allow_origins=["*"]`)
- Protocol: REST over HTTP (no HTTPS in local mode)
- Auto-documentation: OpenAPI/Swagger UI at `/docs`

**Desktop App ↔ Backend Communication:**
- Tauri IPC for server lifecycle management
- HTTP REST for data operations
- WebSockets ready (StreamingResponse for SSE progress tracking)
- Flow:
  1. Tauri app spawns server binary on launch (production) or connects to existing server (development)
  2. Frontend makes HTTP requests to backend API
  3. Tauri handles process management (start/stop/health checks)

## Desktop Platform Integrations

**Tauri Plugins (JavaScript/TypeScript):**
- `@tauri-apps/plugin-dialog` 2.0 - File/directory pickers
  - Used for: Importing profiles, exporting audio, selecting voice samples
  - File: `app/src/platform/tauri/` implementations

- `@tauri-apps/plugin-fs` 2.0 - File system operations
  - Used for: Reading/writing audio files, managing user data

- `@tauri-apps/plugin-shell` 2.0 - Spawning and managing processes
  - Used for: Starting Python server binary with proper environment

- `@tauri-apps/plugin-process` 2.0+ - Process management
  - Used for: Server lifecycle (start/stop/check status)

- `@tauri-apps/plugin-updater` 2.9.0 - Auto-updater
  - Used for: Checking and installing app updates
  - Update endpoint: `https://github.com/jamiepine/voicebox/releases/latest/download/latest.json`
  - Mechanism: GitHub Releases as artifact distribution

- `@tauri-apps/plugin-global-shortcut` 2.3.1 - Global hotkey registration
  - Used for: Quick Capture feature (record voice at any time)
  - File: `tauri/src-tauri/src/global_shortcut.rs`

**Platform Audio (Rust):**
- Files: `tauri/src-tauri/src/audio_capture/` (platform-specific)
  - `audio_capture/macos.rs` - Core Audio / AVAudioEngine
  - `audio_capture/windows.rs` - WASAPI
  - `audio_capture/linux.rs` - ALSA / PulseAudio
  - `audio_output.rs` - Cross-platform audio playback
- Used for: System audio capture, device enumeration, playback

## CI/CD & Deployment

**Version Control:**
- GitHub (jamiepine/voicebox repository)
- Branch strategy: Tags trigger releases (`v*` tags)

**CI/CD Pipeline:**
- GitHub Actions (`.github/workflows/release.yml`)
  - Triggers: Manual dispatch or version tags
  - Matrix builds:
    - macOS-latest (Apple Silicon M1/M2/M3) → MLX backend → `.dmg`
    - macOS-15-intel (Intel x86_64) → PyTorch backend → `.dmg`
    - Windows-latest → PyTorch backend → `.msi`
    - Linux (commented out, not yet enabled) → PyTorch backend → `.AppImage`

**Build Process:**
1. Check out code
2. Set up Python 3.12
3. Install platform-specific ML dependencies (MLX or PyTorch)
4. Build Python server binary with PyInstaller (`backend/build_binary.py`)
5. Set up Bun
6. Build Tauri app with bundled server binary
7. Outputs to `tauri/src-tauri/target/release/bundle/`

**Distribution:**
- GitHub Releases: Artifacts uploaded automatically by Actions
- Update manifest: `latest.json` published to GitHub Releases
- Server binary naming: `voicebox-server-{rustc-triple}` (e.g., `voicebox-server-x86_64-apple-darwin`)
- Installers: Platform-specific (.dmg, .msi, .AppImage)

## Webhooks & Callbacks

**Incoming:**
- None (local-first app, no webhooks)

**Outgoing:**
- Server shutdown endpoint: `POST /shutdown` - Graceful shutdown signal
- No external webhooks or event subscriptions

## Environment Configuration

**Required Environment Variables:**
- None for basic operation
- Development backend: Automatically connects to `http://localhost:17493`
- Production backend: Auto-started by Tauri, port discovered dynamically

**Data Directory:**
- Development: `backend/data/` (relative to working directory)
- Production: Platform-specific user data directory (configurable via `backend/config.set_data_dir()`)

**HuggingFace Hub Cache:**
- Env var: `HF_HOME` (defaults to `~/.cache/huggingface/`)
- Used for: Model caching across restarts

**Secrets Storage:**
- None required (local-first, no API keys)
- `.env` files ignored (`.gitignore` configured)

## Model Download & Progress

**Progress Tracking:**
- HuggingFace Hub downloads emit progress events
- Custom progress wrapper: `backend/utils/hf_progress.py`
- Frontend receives via:
  - SSE (Server-Sent Events) for streaming progress
  - `GET /health` endpoint for model status polls

**Download Resumption:**
- HuggingFace Hub handles automatic resumption
- Incomplete downloads cleaned up via cache scanning

## Audio Format Support

**Input Formats:**
- WAV, FLAC (via soundfile library)
- Auto-detection via librosa

**Output Format:**
- WAV (16-bit PCM or float32)
- Format determined by backend model requirements

## OpenAPI / API Documentation

**Auto-Generated Client:**
- TypeScript client auto-generated from FastAPI OpenAPI schema
- Location: `app/src/lib/api/`
- Generated via: `make generate-api` or `./scripts/generate-api.sh`
- Must regenerate when backend models/routes change
- Never manually edit generated files

**Schema Exposure:**
- Swagger UI: `http://localhost:17493/docs`
- OpenAPI JSON: `http://localhost:17493/openapi.json`
- ReDoc: `http://localhost:17493/redoc`

---

*Integration audit: 2026-02-09*
