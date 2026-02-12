# Testing Patterns

**Analysis Date:** 2026-02-09

## Test Framework

**Frontend:**
- No automated frontend test framework configured
- No Jest, Vitest, or similar setup in codebase
- Testing done manually or through component exploration

**Backend:**
- Framework: pytest (manual test scripts, not automated CI)
- Test configuration: None in pytest.ini or setup.cfg
- Run command: `pytest -v` (from `backend/` directory with pytest installed)

**Test Files Location:**
```
backend/
├── tests/
│   ├── __init__.py
│   ├── README.md
│   ├── test_progress.py           # ProgressManager unit tests
│   ├── test_generation_download.py # Real model download with progress
│   ├── test_qwen_download.py      # Qwen model download testing
│   ├── test_whisper_download.py   # Whisper model download testing
│   └── test_cache_model_size.py   # Cache and model size testing
```

## Test File Organization

**Location Pattern:**
- Backend tests: `backend/tests/test_*.py` (all tests grouped in tests directory)
- Frontend tests: None implemented (no test framework configured)
- Test execution: Manual - tests run when explicitly invoked, not in CI pipeline

**File Naming:**
- Pattern: `test_*.py` for all backend test modules
- Descriptive names matching what's tested
- No subdirectories within tests/

**Directory Structure:**
```
backend/tests/
├── __init__.py           # Allows import of tests as package
├── README.md             # Usage instructions for each test
├── test_progress.py      # Import: from utils.progress import ProgressManager
├── test_generation_download.py
├── test_qwen_download.py
├── test_whisper_download.py
└── test_cache_model_size.py
```

## Test Structure

**Suite Organization:**
```python
# test_progress.py pattern
def test_progress_manager_basic():
    """Test 1: Basic ProgressManager functionality."""
    print("\n" + "=" * 60)
    print("Test 1: ProgressManager Basic Operations")
    print("=" * 60)

    pm = ProgressManager()

    # Test update_progress
    pm.update_progress(
        model_name="test-model",
        current=50,
        total=100,
        filename="test.bin",
        status="downloading"
    )

    # Assert
    progress = pm.get_progress("test-model")
    assert progress is not None
    assert progress["progress"] == 50.0
    assert progress["filename"] == "test.bin"
    assert progress["status"] == "downloading"

    # Test mark_complete
    pm.mark_complete("test-model")
    progress = pm.get_progress("test-model")
    assert progress["status"] == "complete"
    assert progress["progress"] == 100.0

    print("✓ Test 1 PASSED\n")
    return True
```

**Test Patterns:**
- Print-based output for manual verification
- Line separators (60 chars) for visual clarity
- Checkmark (✓) for passed tests
- Simple assertions with descriptive messages
- Return `True` at end for explicit completion signal

**Async Test Pattern:**
```python
async def test_progress_manager_sse():
    """Test 2: ProgressManager SSE streaming."""
    print("\n" + "=" * 60)
    print("Test 2: ProgressManager SSE Streaming")
    print("=" * 60)

    pm = ProgressManager()
    collected_events: List[Dict] = []

    async def sse_client():
        """Simulates a frontend SSE connection."""
        async for event in pm.subscribe("test-model-sse"):
            if event.startswith("data: "):
                data = json.loads(event[6:])
                collected_events.append(data)
                if data.get("status") in ("complete", "error"):
                    break

    # Run test
    await asyncio.gather(
        sse_client(),
        run_simulation(pm)
    )

    print("✓ Test 2 PASSED\n")
    return True
```

## Setup and Teardown

**Implicit Setup:**
- No pytest fixtures used
- Manual object instantiation in each test
- State created fresh in each function

**Implicit Teardown:**
- No explicit cleanup
- Files created during tests remain in cache directories
- Database state persists across tests (manual only, no CI)

**Prerequisites Documented:**
Each test in README.md specifies what's needed:
```
### `test_generation_progress.py`
**Prerequisites:**
- Server must be running (`python main.py`)
- At least one voice profile must exist
```

## Assertion Library

**Backend:**
- Framework: Python `assert` statements (built-in)
- Pattern: Direct value comparison
  ```python
  assert progress is not None
  assert progress["progress"] == 50.0
  assert progress["status"] == "complete"
  ```
- No external assertion library (unittest, pytest assertions)
- Assertions used minimally - tests focus on logging output

**Frontend:**
- No assertions library (no test framework)

## Mocking

**Backend:**
- Limited mocking in current test suite
- Mock usage: Simulated HuggingFace downloads
- Pattern: Create mock download tasks and monitor progress
  ```python
  # test_generation_download.py - simulate download
  from utils.progress import ProgressManager
  from utils.hf_progress import create_hf_progress_callback

  # Create callback that updates progress
  callback = create_hf_progress_callback(pm, "test-model")
  ```

**What to Mock:**
- HuggingFace Hub downloads (use real models for testing)
- External API calls (not applicable in current codebase)

**What NOT to Mock:**
- Database operations (SQLite in-memory for tests)
- Model loading/inference (tests use real models)
- Audio processing (tests use real audio files)

**Test Data:**
- Tests create temporary models and progress objects
- Sample audio files referenced from test setup
- Cache directories auto-created during tests

## Fixtures and Factories

**Test Data:**
- No factory pattern used
- Manual object creation in each test
- Pattern: Directly instantiate objects with test parameters
  ```python
  pm = ProgressManager()
  pm.update_progress(
      model_name="test-model",
      current=50,
      total=100,
      filename="test.bin",
      status="downloading"
  )
  ```

**Location:**
- Test data created inline within test functions
- No separate fixtures directory
- Prerequisites documented in `backend/tests/README.md`

## Coverage

**Requirements:**
- None enforced in CI/CD
- Coverage not measured or reported
- Tests are manual validation scripts, not comprehensive coverage

**View Coverage:**
- No coverage tool configured
- Manual tests verify specific functionality as needed

## Test Types

**Manual Unit Tests:**
```python
# backend/tests/test_progress.py
def test_progress_manager_basic():
    """Test 1: Basic ProgressManager functionality."""
    pm = ProgressManager()
    # ... assertions ...
```
- **Scope**: Individual function/class behavior
- **Approach**: Direct instantiation, manual verification
- **When used**: Debugging progress tracking during development

**Integration Tests:**
```python
# backend/tests/test_generation_download.py
async def test_generation_with_download():
    """Test generation with real model download."""
    # Requires: Server running at localhost:17493
    # Tests: Full generation pipeline with progress monitoring
```
- **Scope**: Full feature flow (download → generation → progress)
- **Approach**: API requests to running backend server
- **When used**: Validating end-to-end flows with real components

**Manual Debugging Scripts:**
```python
# backend/tests/test_check_progress_state.py
# Not a test, but a debugging script to inspect internal state
```
- **Scope**: Inspect runtime state during development
- **Approach**: Print internal structures, no assertions
- **When used**: Troubleshooting progress tracking issues

**E2E Tests:**
- Not implemented
- Manual testing done via UI in Tauri app
- No automated browser-based E2E framework

## Common Patterns

**Async Testing:**
```python
# Run async test with asyncio
import asyncio

async def test_sse_streaming():
    """Test SSE with async operations."""
    pm = ProgressManager()

    async def sse_client():
        async for event in pm.subscribe("model"):
            # Process event
            pass

    async def data_producer():
        # Generate events
        pm.update_progress(...)

    # Run both concurrently
    await asyncio.gather(sse_client(), data_producer())

# Execute from synchronous context
if __name__ == "__main__":
    asyncio.run(test_sse_streaming())
```

**Error Testing:**
```python
# Tests don't explicitly test error cases
# Error paths tested indirectly through integration tests
# Pattern: Run generation with edge cases (empty text, invalid profile)
# Verify error responses via API

# Example: Invalid input handling is tested via HTTP requests
# to endpoints, verifying 400/404 responses are correct
```

**Logging in Tests:**
```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Tests log progress and status for manual verification
logger = logging.getLogger(__name__)
logger.debug("Starting test...")
print("✓ Test PASSED")
```

## Test Execution

**Run All Backend Tests:**
```bash
cd backend
pytest -v
```

**Run Specific Test:**
```bash
cd backend
python tests/test_progress.py
# or
pytest -v tests/test_progress.py
```

**Run with Requirements:**
```bash
cd backend
# Install pytest first
pip install pytest

# Run tests
pytest -v
```

**Manual Test Prerequisites:**
- For server-dependent tests: `make dev-backend` or `uvicorn main:app --reload --port 17493`
- For model download tests: Clear cache first if forcing fresh download
  ```bash
  rm -rf ~/.cache/huggingface/hub/models--openai--whisper-base
  python tests/test_whisper_download.py
  ```

## Test Scenarios by Feature

**Voice Profile Management:**
- Creation, updates, deletion not explicitly tested
- Implicitly tested in generation flow
- Manual verification via UI

**Generation with Progress Tracking:**
- `test_generation_download.py` - Full flow with SSE monitoring
- `test_progress.py` - ProgressManager unit tests
- `test_cache_model_size.py` - Cache behavior validation

**Model Downloads:**
- `test_qwen_download.py` - Qwen3-TTS model acquisition
- `test_whisper_download.py` - Whisper model acquisition
- Tests monitor progress callbacks and completion

**API Validation:**
- Request/response format validated implicitly in integration tests
- Error responses (400, 404, 500) tested via manual requests

---

*Testing analysis: 2026-02-09*
