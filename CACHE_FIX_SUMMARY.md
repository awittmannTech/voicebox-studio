# Cache Fix: 0.6B Model Tensor Size Mismatch Resolution

## Problem
Every attempt to use the 0.6B model failed with:
```
Generation failed
Sizes of tensors must match except in dimension 1. Expected size 1024 but got size 2048 for tensor number 1 in the list.
```

The 1.7B model worked perfectly, but 0.6B consistently failed.

## Root Cause
1. **Missing Model Size in Cache Key**: Voice prompt cache keys were generated from audio + reference text only, without including the model size
2. **Different Hidden Dimensions**:
   - 1.7B model uses hidden_dim=2048
   - 0.6B model uses hidden_dim=1024
3. **Cache Reuse Across Models**: When switching models, cached prompts with wrong dimensions were loaded, causing tensor mismatch

## Solution Implemented

### 1. Updated Cache Key Generation (`backend/utils/cache.py`)
- Added `model_size` parameter to `get_cache_key()` function
- Cache keys now include: audio_bytes + reference_text + model_size
- Default model_size is "1.7B" for backwards compatibility

**Changes:**
```python
def get_cache_key(audio_path: str, reference_text: str, model_size: str = "1.7B") -> str:
    combined = audio_bytes + reference_text.encode("utf-8") + model_size.encode("utf-8")
    return hashlib.md5(combined).hexdigest()
```

### 2. Updated MLX Backend (`backend/backends/mlx_backend.py`)
- `create_voice_prompt()` now passes model_size to cache functions
- Added warning when 0.6B falls back to 1.7B on Apple Silicon
- Cache hits now log which model size is being used

**Changes:**
```python
# Get current model size for cache key
model_size = self._current_model_size or self.model_size or "1.7B"

# Pass model_size to cache functions
cache_key = get_cache_key(audio_path, reference_text, model_size=model_size)

# Added warning for 0.6B fallback
if model_size == "0.6B":
    print("⚠️  WARNING: 0.6B model not available in MLX format.")
    print("    Falling back to 1.7B model for Apple Silicon.")
```

### 3. Updated PyTorch Backend (`backend/backends/pytorch_backend.py`)
- `create_voice_prompt()` now passes model_size to cache functions
- Cache hits now log which model size is being used

**Changes:**
```python
# Get current model size for cache key
model_size = self._current_model_size or self.model_size or "1.7B"

# Pass model_size to cache functions
cache_key = get_cache_key(audio_path, reference_text, model_size=model_size)
```

## Files Modified
1. `backend/utils/cache.py` - Updated cache key generation
2. `backend/backends/mlx_backend.py` - Updated cache usage and added fallback warning
3. `backend/backends/pytorch_backend.py` - Updated cache usage

## Cache Migration
- **Old cache files** (without model_size) will be ignored automatically
- New cache files will be created with model_size in the key
- No manual migration needed
- Users will experience slightly slower first generation after update (cache miss)
- Old cache files can be manually deleted if desired: `rm -rf backend/data/cache/*`

## Testing
Created test script: `backend/tests/test_cache_model_size.py`

**Test Results:**
```
Cache key for 1.7B model: e945d48a7a466d509249990b5420a23a
Cache key for 0.6B model: 6342f863679f4c2c557755e6df44aa3e
[PASS] Cache keys are different for different model sizes
[PASS] Cache keys are consistent for the same model size
[PASS] Default model size is 1.7B
```

## Expected Behavior After Fix

### Scenario 1: First Generation (No Cache)
- Generate audio with 1.7B → Creates cache with key including "1.7B"
- Generate audio with 0.6B → Creates separate cache with key including "0.6B"

### Scenario 2: Model Switching
- Generate with 1.7B → Uses cache A (1.7B)
- Switch to 0.6B → Uses cache B (0.6B) - **NO TENSOR MISMATCH**
- Switch back to 1.7B → Uses cache A (1.7B)

### Scenario 3: MLX Backend (Apple Silicon)
- Request 0.6B model → Logs warning, falls back to 1.7B
- Cache key still includes "0.6B" for user's requested size
- Generation succeeds using 1.7B characteristics

## Success Criteria
✅ 0.6B model generates audio without tensor size mismatch errors
✅ Voice prompts are cached separately for 1.7B and 0.6B models
✅ Switching between models works seamlessly
✅ MLX backend fallback is clearly logged
✅ No regression in 1.7B model functionality
✅ Cache keys include model size
✅ Existing cache files are safely ignored

## Verification Commands
```bash
# Clear cache for fresh testing
rm -rf backend/data/cache/*

# Run cache key test
cd backend && python tests/test_cache_model_size.py

# Check cache contents
ls -lh backend/data/cache/

# Monitor server logs for cache hits/misses
tail -f backend/logs/server.log | grep -i "cached voice prompt"
```

## Known Limitations
1. **0.6B MLX Model**: Not yet available in MLX format, falls back to 1.7B on Apple Silicon
2. **Cache Migration**: Old cache files are not automatically converted (they're just ignored)
3. **First Generation**: Will be slower after update due to cache miss (expected behavior)

## Future Enhancements
1. Convert 0.6B model to MLX format (requires separate project)
2. Add cache management UI
3. Show active model size in UI
4. Add cache statistics endpoint
