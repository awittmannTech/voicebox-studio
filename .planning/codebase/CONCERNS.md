# Codebase Concerns

**Analysis Date:** 2026-02-09

## Tech Debt

**Incomplete Studio Module:**
- Issue: `backend/studio.py` contains three stub methods with `NotImplementedError`: `get_word_timestamps()`, `mix_audio()`, `trim_audio()`
- Files: `backend/studio.py` (lines 27, 45, 65)
- Impact: Story timeline features (word-level sync, multi-track mixing, clip trimming) are advertised but not functional
- Fix approach: Implement using librosa for word alignment, pydub for audio mixing, or defer these features and remove from UI until ready

**Debug Print Statements in Production Code:**
- Issue: PyTorch backend contains multiple `print()` debug statements instead of proper logging
- Files: `backend/backends/pytorch_backend.py` (lines 82, 93, 98, 422, 426, 428, 431, 434, 441, 457, 460, 466, 500, 503)
- Impact: Clutters logs in production, bypasses logging configuration, hard to toggle off
- Fix approach: Replace all `print()` statements with `logging.debug()` or `logging.info()` calls

**Large Monolithic Components:**
- Issue: `StoryTrackEditor.tsx` is 988 lines; `StoryContent.tsx` is 376 lines; both handle complex timeline logic
- Files: `app/src/components/StoriesTab/StoryTrackEditor.tsx`, `app/src/components/StoriesTab/StoryContent.tsx`
- Impact: Difficult to test, maintain, and debug; risk of hidden state bugs in drag-drop and audio sync logic
- Fix approach: Break into smaller composable components; extract drag-drop logic and timeline rendering into separate modules

**Overly Broad Exception Handling:**
- Issue: 11 instances of bare `except Exception:` without specific error handling or logging
- Files: `backend/main.py` (lines 110, 146, 173)
- Impact: Masks real errors, makes debugging difficult, swallows important context
- Fix approach: Catch specific exceptions (ValueError, IOError, etc.); log with context; re-raise or provide meaningful error responses

## Security Concerns

**CORS Configured for Production Wildcard:**
- Risk: `allow_origins=["*"]` with `allow_credentials=True` is overly permissive for a production API
- Files: `backend/main.py` (lines 40-46)
- Current mitigation: Code comment says "Configure appropriately for production" but no actual restriction in place
- Recommendations: Restrict origins to known Tauri app domains or localhost for production; environment-based configuration

**No Input Sanitization on Audio File Downloads:**
- Risk: While filenames are sanitized (line 780), the `audio_path` from database is trusted without validation that it's within expected directory
- Files: `backend/main.py` (line 775-791)
- Current mitigation: File existence check only; no path traversal validation
- Recommendations: Validate audio_path is within `config.get_generations_dir()`; use `Path.resolve().is_relative_to()` to prevent directory escape

**No Authentication or Rate Limiting:**
- Risk: API endpoints have no authentication; anyone with network access can generate unlimited speech, consuming compute and disk
- Files: `backend/main.py` (all endpoints)
- Impact: Resource exhaustion attacks; unlimited generation attempts; no user isolation
- Recommendations: Add rate limiting (fastapi-limiter); consider adding optional API key or auth token support; scope rate limits by IP or user

**File Write Without Atomic Operations:**
- Risk: Audio files written directly without atomic rename; interrupted writes could leave corrupted files in data directory
- Files: `backend/hotkey_recordings.py` (line 23-24), `backend/main.py` (line 598-601), multiple other locations
- Impact: Corrupted audio files; inconsistent state if write fails mid-operation
- Recommendations: Write to temp file, then atomic `rename()`; or use context managers with proper cleanup

## Performance Bottlenecks

**Model Loading on Every Generation (Potential):**
- Problem: PyTorch backend checks `is_model_cached()` by scanning filesystem (glob operations on lines 81, 89-91, 403-405)
- Files: `backend/backends/pytorch_backend.py` (lines 61-99, 383-413)
- Cause: Expensive directory traversal on HuggingFace cache; called during every model load
- Improvement path: Cache the result in-process; invalidate only on explicit unload; reduce glob queries with targeted checks

**SSE Progress Streaming Without Backpressure:**
- Problem: Progress updates are sent as SSE but no backpressure handling if client disconnects
- Files: `backend/main.py` (SSE progress endpoint)
- Impact: Orphaned async tasks if client disconnects during generation
- Fix approach: Add client disconnect detection; gracefully clean up progress tasks

**Voice Profile Sample Loading N+1:**
- Problem: Each profile query may load samples in a loop without join optimization
- Files: `backend/profiles.py` (likely)
- Impact: Slow profile list rendering with many samples per profile
- Fix approach: Use SQLAlchemy `joinedload()` or explicit eager loading

## Fragile Areas

**Server Lifecycle Management (Development/Production Boundary):**
- Files: `app/src/App.tsx` (lines 72-129), `tauri/src-tauri/` (Rust lifecycle code)
- Why fragile: Complex logic with multiple conditions (dev mode, prod mode, Tauri vs web, server started by app vs external)
- Safe modification: Add comprehensive integration tests for server start/stop sequences; test all combinations (dev+Tauri, dev+web, prod+Tauri, prod+web)
- Test coverage: No automated tests visible for lifecycle; manual testing only

**State Synchronization Between Frontend and Backend:**
- Files: `app/src/stores/` (Zustand stores), `backend/main.py` (API routes)
- Why fragile: Generation state, story state, and server connection state can drift; no optimistic updates or reconciliation
- Safe modification: Add defensive checks before operations; implement request/response validation; add telemetry
- Example risk: User sees "generating" but backend crashes silently; frontend never learns

**Audio Timeline Rendering with Large Clips:**
- Files: `app/src/components/StoriesTab/StoryTrackEditor.tsx` (988 lines)
- Why fragile: Complex canvas/SVG rendering with pointer events, drag-drop, and audio sync; large number of event listeners
- Safe modification: Benchmark with >50 clips before making changes; test drag-drop on slower devices; add scroll virtualization if needed
- Test coverage: Gaps in timeline interaction testing

**Story Item Trim/Split Operations:**
- Files: `app/src/components/StoriesTab/StoryTrackEditor.tsx` (inline editing)
- Why fragile: Trim/split logic modifies clip start/end times; risk of overlapping clips or duration calculation errors
- Safe modification: Add strict validation of trim boundaries; ensure `start < end`; test edge cases (0-duration clips, overlaps)
- Test coverage: No visible tests for trim/split logic

## Known Issues

**Hotkey Recording Text Alignment:**
- Symptoms: Quick capture recordings may have audio misalignment with subsequent text-to-speech if timing assumptions fail
- Files: `app/src/components/HotkeyRecording/HotkeyRecordingsTab.tsx`, `backend/hotkey_recordings.py`
- Trigger: Recording captured via hotkey, then transcribed, then converted back to speech
- Workaround: None currently; feature is new and may need refinement

**MLX Backend Not Fully Equivalent to PyTorch:**
- Symptoms: Generation results may differ slightly between Apple Silicon (MLX) and PyTorch backends
- Files: `backend/backends/mlx_backend.py` vs `backend/backends/pytorch_backend.py`
- Trigger: Running on Apple Silicon vs other platforms
- Workaround: Use PyTorch backend on Apple Silicon by setting `VOICEBOX_FORCE_PYTORCH=1` (if implemented)

**Web App Server Connection Assumptions:**
- Symptoms: Web deployment assumes external backend; no auto-retry on connection loss
- Files: `web/`, `app/src/stores/serverStore.ts`
- Impact: If backend goes down, web app shows no clear error; user experience unclear
- Workaround: Manual refresh required; server must be restarted manually

## Missing Critical Features

**No Export Audio Mixing:**
- Problem: Stories UI shows "export" functionality but `mix_audio()` is not implemented
- Blocks: Users cannot export multi-track stories as single mixed audio file
- Workaround: None; users must use external audio editor

**No Word-Level Synchronization:**
- Problem: Timeline cannot snap clips to word boundaries; manually timing clips is tedious
- Blocks: Professional use cases requiring precise timing
- Workaround: Manual clip positioning; external tools like Audacity

**No Batch Generation:**
- Problem: Each generation is sequential; no bulk text-to-speech for multiple lines
- Blocks: Efficiency improvements for script-based workflows
- Workaround: Generate one at a time; UI does not batch requests

## Test Coverage Gaps

**Server Lifecycle in Tauri (Dev vs Prod):**
- What's not tested: Automated validation that server starts/stops correctly in all configurations
- Files: `tauri/src-tauri/`, `app/src/App.tsx`
- Risk: Regression on server startup/shutdown; users stuck with zombie processes
- Priority: High

**API Error Responses:**
- What's not tested: Validation that all error paths return proper HTTP status codes and response models
- Files: `backend/main.py`
- Risk: Frontend cannot reliably distinguish error types; may show wrong UI messages
- Priority: Medium

**Profile Crud Operations with Concurrent Requests:**
- What's not tested: Race conditions when creating/deleting profiles simultaneously
- Files: `backend/profiles.py`, `backend/main.py` (profile endpoints)
- Risk: Database corruption; duplicate profiles; orphaned sample files
- Priority: Medium

**Timeline Drag-Drop and Audio Sync:**
- What's not tested: Automated tests for clip reordering, trimming, and playhead sync
- Files: `app/src/components/StoriesTab/StoryTrackEditor.tsx`
- Risk: Silent failures in clip positioning; audio desync on playback
- Priority: High

**Generation Progress SSE Stream:**
- What's not tested: Automated validation that progress updates match actual generation state
- Files: `backend/main.py` (progress endpoint)
- Risk: Frontend shows misleading progress; disconnects not handled gracefully
- Priority: Medium

**MLX Backend Feature Parity:**
- What's not tested: Automated comparison of output between MLX and PyTorch backends
- Files: `backend/backends/mlx_backend.py`, `backend/backends/pytorch_backend.py`
- Risk: Silent quality degradation on Apple Silicon
- Priority: Medium

## Scaling Limits

**Disk Space for Audio Generations:**
- Current capacity: Unlimited (all generations written to `backend/data/generations/`)
- Limit: Storage fills up; no pruning or archive strategy
- Scaling path: Implement age-based cleanup; add configurable retention policy; migrate to cloud storage

**Memory Usage with Large Models:**
- Current capacity: 1.7B TTS model uses ~4GB VRAM; 0.6B uses ~2GB
- Limit: Out-of-memory on machines with <8GB; cannot load both TTS and Whisper
- Scaling path: Add model quantization support; implement streaming inference; or offload to separate GPU server

**Database Growth (SQLite Limitations):**
- Current capacity: SQLite can handle millions of rows but locks on concurrent writes
- Limit: Performance degrades with large history; concurrent generation requests may block
- Scaling path: Migrate to PostgreSQL for production; add proper connection pooling

**File Descriptor Limits:**
- Current capacity: Each audio file kept open during streaming; multiple SSE connections
- Limit: ulimit on typical systems is ~1024; high concurrency could exhaust
- Scaling path: Use streaming/chunked responses; add per-connection limits

## Dependencies at Risk

**Qwen3-TTS (pip install from Git):**
- Risk: Installed directly from GitHub; no pinned version; subject to breaking changes
- Impact: Builds may fail if repo changes; unpredictable behavior
- Migration plan: Pin to specific commit hash; or wait for PyPI release; monitor GitHub for deprecation

**HuggingFace Hub API:**
- Risk: Model downloads depend on HuggingFace infrastructure; no offline fallback
- Impact: First-time generation fails if HuggingFace is unavailable or models removed
- Migration plan: Support local model paths; implement fallback CDN for critical models

**PyTorch vs MLX Consistency:**
- Risk: MLX and PyTorch may diverge in API or output quality
- Impact: Platform-specific bugs; maintenance burden
- Migration plan: Add test suite comparing outputs; monitor MLX updates; plan for unified backend if possible

---

*Concerns audit: 2026-02-09*
