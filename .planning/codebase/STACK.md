# Technology Stack

**Analysis Date:** 2026-02-09

## Languages

**Primary:**
- TypeScript 5.6.0 - Frontend (React components, stores, utilities)
- Python 3.12 - Backend (FastAPI server, ML models, audio processing)
- Rust - Tauri desktop app wrapper (audio capture, system integration, process management)

**Secondary:**
- JavaScript - Node.js build scripts, configuration
- HTML/CSS - Web UI composition

## Runtime

**Environment:**
- Node.js / Bun 1.3.8 (primary JavaScript runtime)
- Python 3.12 (backend runtime, supports 3.10+)
- Rust 1.70+ (for Tauri compilation)

**Package Managers:**
- Bun 1.3.8 - Primary JavaScript package manager (monorepo root)
  - Lockfile: `bun.lock` (deterministic dependency locking)
- pip - Python dependency manager
  - Requirements files: `backend/requirements.txt`, `backend/requirements-mlx.txt`
- Cargo - Rust package manager for Tauri

## Frameworks

**Core:**
- FastAPI 0.109+ - Python REST API server with OpenAPI/Swagger
- React 18.3.0 - UI framework (shared across desktop, web, landing)
- Tauri 2.0 - Desktop application framework (Rust + WebView)
- Next.js 16.1.3 - Landing page (SSR, marketing site)

**Frontend State & Routing:**
- Zustand 4.5.0 - Lightweight state management (serverStore, generationStore, storyStore, playerStore, audioChannelStore, uiStore)
- TanStack React Router 1.157.16 - Client-side routing
- TanStack React Query 5.0.0 - Server state management and data fetching
- React Hook Form 7.53.0 - Form state management

**UI & Styling:**
- Radix UI 1.1+ - Headless component primitives (@radix-ui/react-* suite: dialog, tabs, select, popover, etc.)
- Tailwind CSS 4.1.18 - Utility-first CSS framework
- class-variance-authority 0.7.0 - Component variant management
- Tailwind Merge 2.5.4 - Merge Tailwind class names
- Tailwindcss-animate 1.0.7 - Animation utilities
- lucide-react 0.454.0 - Icon library
- framer-motion 12.29.0 - Animation library

**Audio & Visualization:**
- WaveSurfer.js 7.0.0 - Audio waveform visualization and playback
- react-sound-visualizer 1.4.0 - Real-time audio visualization

**Drag & Drop:**
- @dnd-kit/core 6.3.1 - Drag and drop library
- @dnd-kit/sortable 10.0.0 - Sortable addon for dnd-kit
- @dnd-kit/utilities 3.2.2 - Utility functions

**Data Validation:**
- Zod 3.23.8 - TypeScript-first schema validation
- Pydantic 2.5+ - Python data validation and settings management

**Forms & Utilities:**
- date-fns 3.6.0 - Date utility library
- clsx 2.1.1 - Conditional CSS class names
- motion 12.29.0 - Animation utilities

## Build & Development Tools

**Bundler & Dev Server:**
- Vite 5.4.0 - Frontend build tool and dev server
- @vitejs/plugin-react 4.3.0 - React JSX support for Vite

**Backend API:**
- Uvicorn 0.27+ - ASGI server for FastAPI with uvicorn[standard] extras
- python-multipart 0.0.6+ - Form data parsing for file uploads

## Key Dependencies

**Critical ML/Audio:**
- qwen-tts 0.0.5 - Qwen3-TTS voice cloning model
- transformers 4.36.0 - Hugging Face transformers for model inference
- torch 2.1.0+ - PyTorch ML framework (CPU/CUDA fallback)
- librosa 0.10.0 - Audio processing (spectrograms, feature extraction)
- soundfile 0.12.0 - WAV/FLAC audio I/O
- numpy 1.24.0 - Numerical computing

**MLX (Apple Silicon acceleration):**
- mlx 0.30.0+ - Apple MLX framework (Metal acceleration)
- mlx-audio 0.3.1+ - Audio utilities for MLX

**Database & ORM:**
- SQLAlchemy 2.0+ - Python ORM with SQLite support
- alembic 1.13+ - Database migration tool

**Desktop & Platform Integration:**
- @tauri-apps/api 2.0.0 - Tauri JS bindings
- @tauri-apps/plugin-dialog 2.0.0 - Native file/directory dialogs
- @tauri-apps/plugin-fs 2.0.0 - File system access
- @tauri-apps/plugin-process 2.0+ - Process spawning and management
- @tauri-apps/plugin-shell 2.0.0 - Shell command execution
- @tauri-apps/plugin-updater 2.9.0 - Auto-updater mechanism
- @tauri-apps/plugin-global-shortcut 2.3.1 - Global hotkey registration

**Model Loading & Caching:**
- huggingface_hub 0.20+ - Download models from Hugging Face Hub with progress tracking and caching
- accelerate 0.26.0 - Distributed training utilities for multi-GPU/multi-node support

**Utilities:**
- Pillow 10.0.0 - Image processing (avatar handling)
- requests 2.28+ - HTTP client (test utilities)
- h11 - HTTP library for websocket support
- base64 (Rust) - Base64 encoding/decoding for Tauri integration
- reqwest 0.12 (Rust) - HTTP client for Tauri API calls

## Database

**Type:** SQLite (file-based, no server required)
- File location: `backend/data/voicebox.db`
- Auto-initializes on first server start
- Schema: Profiles, Samples, Generations, Stories, StoryItems, Projects, AudioChannels, HotkeyRecordings

**Access Pattern:** SQLAlchemy ORM with session-based dependency injection in FastAPI

## Code Quality & Linting

**JavaScript/TypeScript:**
- Biomejs 2.3.12 - Unified linter, formatter, and bundler
  - Config: `biome.json`
  - Rules: ESLint-compatible + custom Biome rules
  - Formatting: 2-space indent, 100 char line width, single quotes (JS), double quotes (JSX)

**Type Checking:**
- TypeScript 5.6.0 - Strict type checking (no-emit mode)

**Build System:**
- Makefiles (`Makefile`) - Development and build commands
- Shell scripts (`scripts/`) - Cross-platform build automation

## Configuration Files

**Frontend:**
- `tsconfig.json` - TypeScript configuration (per workspace)
- `vite.config.ts` - Vite build configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `.npmrc` - Bun configuration

**Backend:**
- `backend/config.py` - Data directory and path configuration
- `backend/main.py` - FastAPI app initialization and all route definitions

**Desktop:**
- `tauri.conf.json` - Tauri app configuration, versioning, bundle settings
- `Cargo.toml` - Rust dependencies and Tauri project metadata

**Monorepo:**
- `package.json` - Root workspace configuration with `workspaces: ["app", "tauri", "web", "landing"]`
- `.bumpversion.cfg` - Version management across all packages

## Platform Requirements

**Development:**
- Bun >= 1.0.0 (JavaScript package manager and runtime)
- Python 3.10+ (3.12 recommended)
- Rust 1.70+ (for Tauri desktop builds)
- Node.js 18+ (for some compatibility, Bun is preferred)

**Platform-Specific:**

**macOS (Apple Silicon M1/M2/M3):**
- LLVM 20 (for compilation)
- MLX framework (installed via `backend/requirements-mlx.txt`)
- Metal GPU support (automatic via MLX)
- Deployment: `.dmg` bundle

**macOS (Intel x86):**
- LLVM 20
- PyTorch with CUDA or CPU fallback
- Deployment: `.dmg` bundle

**Windows:**
- MSVC build tools (C++ compiler)
- PyTorch (CPU or CUDA if GPU available)
- Deployment: `.msi` installer

**Linux:**
- GCC/Clang toolchain
- libwebkit2gtk-4.1-dev, libappindicator3-dev, librsvg2-dev (Ubuntu)
- PyTorch
- Deployment: `.AppImage` (currently disabled in CI)

**Production (Server Binary):**
- Platform-specific binary: `tauri/src-tauri/binaries/voicebox-server-{platform}-{arch}`
- Created via PyInstaller during build
- Bundles: Python runtime, all dependencies, ML models (optional)
- Auto-started by Tauri desktop app on launch

## Environment Configuration

**No hardcoded API keys or auth tokens**
- Uses local-first architecture
- Backend at `http://localhost:17493` (development) or dynamic port 17493-17593 (production)
- No external authentication required

**Directory Structure:**
- Development: `backend/data/` for database, profiles, generations, cache, models
- Production (Tauri): Configurable data directory (platform-specific user data location)

**Model Downloads:**
- Automatic from Hugging Face Hub on first use
- Cached in `~/.cache/huggingface/hub/` (system-wide) or `backend/data/models/`
- Qwen3-TTS: 1.7B (~4GB) or 0.6B (~2GB) variants
- Whisper: Auto-selected variant based on hardware

---

*Stack analysis: 2026-02-09*
