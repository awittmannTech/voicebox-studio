# Testing Checklist: 0.6B Model Tensor Size Mismatch Fix

## Pre-Testing Setup

1. **Clear existing cache** (optional, but recommended for clean test):
   ```bash
   rm -rf backend/data/cache/*
   ```

2. **Verify backend server is running**:
   ```bash
   # Terminal 1: Start backend
   cd backend
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   uvicorn main:app --reload --port 17493

   # Terminal 2: Start frontend (if testing with UI)
   bun run dev
   ```

3. **Check server health**:
   ```bash
   curl http://localhost:17493/health
   ```

## Unit Tests

### Test 1: Cache Key Generation ✅
```bash
cd backend
python tests/test_cache_model_size.py
```

**Expected Output:**
```
Cache key for 1.7B model: e945d48a7a466d509249990b5420a23a
Cache key for 0.6B model: 6342f863679f4c2c557755e6df44aa3e
[PASS] Cache keys are different for different model sizes
[PASS] Cache keys are consistent for the same model size
[PASS] Default model size is 1.7B
[SUCCESS] All cache key tests passed!
```

## Integration Tests

### Test 2: Fresh Generation with 1.7B Model
1. Open the app (web or Tauri)
2. Go to **Server** tab
3. Set model size to **1.7B**
4. Click "Load Model"
5. Create a voice profile with reference audio
6. Generate text-to-speech

**Expected Result:**
- ✅ Model loads successfully
- ✅ Generation completes without errors
- ✅ New cache file created in `backend/data/cache/`

**Check logs for:**
```
Creating voice prompt (not cached)...
```

### Test 3: Cached Generation with Same Model (1.7B)
1. Generate the same text again with the same voice profile
2. Use 1.7B model

**Expected Result:**
- ✅ Generation is faster (using cache)
- ✅ No errors

**Check logs for:**
```
Using cached voice prompt for 1.7B model
```

### Test 4: Switch to 0.6B Model (Critical Test)
1. Go to **Server** tab
2. Change model size to **0.6B**
3. Click "Load Model"
4. Generate the same text with the same voice profile

**Expected Result:**
- ✅ Model loads successfully
- ✅ Generation completes **WITHOUT tensor size mismatch error**
- ✅ New separate cache file created for 0.6B

**Check logs for:**
```
Creating voice prompt (not cached)...
```

**On Apple Silicon (MLX backend), also check for:**
```
⚠️  WARNING: 0.6B model not available in MLX format.
    Falling back to 1.7B model for Apple Silicon.
    Voice quality will use 1.7B model characteristics.
```

### Test 5: Cached Generation with 0.6B Model
1. Generate the same text again with 0.6B model
2. Use the same voice profile

**Expected Result:**
- ✅ Generation is faster (using 0.6B cache)
- ✅ No tensor size mismatch errors

**Check logs for:**
```
Using cached voice prompt for 0.6B model
```

### Test 6: Switch Back to 1.7B Model
1. Change model size back to **1.7B**
2. Generate the same text with the same voice profile

**Expected Result:**
- ✅ Uses 1.7B cache (not 0.6B cache)
- ✅ Generation succeeds
- ✅ No errors

**Check logs for:**
```
Using cached voice prompt for 1.7B model
```

### Test 7: Rapid Model Switching
1. Generate with 1.7B → Success
2. Generate with 0.6B → Success
3. Generate with 1.7B → Success
4. Generate with 0.6B → Success

**Expected Result:**
- ✅ All generations succeed
- ✅ No tensor size mismatch errors
- ✅ Correct cache is used for each model

## Edge Cases

### Test 8: Multiple Voice Profiles
1. Create Profile A with reference audio
2. Create Profile B with different reference audio
3. Generate with Profile A using 1.7B
4. Generate with Profile B using 0.6B
5. Generate with Profile A using 0.6B
6. Generate with Profile B using 1.7B

**Expected Result:**
- ✅ All generations succeed
- ✅ Each profile+model combination has its own cache

### Test 9: Cache Directory Inspection
```bash
ls -lh backend/data/cache/
```

**Expected:**
- Multiple `.prompt` files
- Different files for different model sizes
- Files persist across server restarts

### Test 10: Clear Cache and Regenerate
```bash
rm -rf backend/data/cache/*
```

Then repeat Tests 2-7.

**Expected Result:**
- ✅ All tests still pass
- ✅ New cache files created
- ✅ No errors

## Performance Verification

### Test 11: Generation Speed Comparison
1. **First generation (no cache)**: ~5-10 seconds
2. **Cached generation**: ~1-2 seconds

Measure both 1.7B and 0.6B models.

**Expected:**
- ✅ Cached generations are significantly faster
- ✅ Both models show similar cache speedup

## Backwards Compatibility

### Test 12: Old Cache Files
If old cache files exist (created before this fix):

1. Check if old cache files are ignored
2. Verify new cache files are created
3. Confirm no errors from old cache files

**Expected Result:**
- ✅ Old cache files don't cause errors
- ✅ New cache files created with model_size in key

## Known Issues to Verify Are Fixed

### ❌ Before Fix:
```
Generation failed
Sizes of tensors must match except in dimension 1.
Expected size 1024 but got size 2048 for tensor number 1 in the list.
```

### ✅ After Fix:
- No tensor size mismatch errors
- Model switching works seamlessly
- Each model uses its own cache

## Success Criteria Summary

✅ All unit tests pass
✅ Fresh generation works for both 1.7B and 0.6B
✅ Cached generation works for both models
✅ Model switching doesn't cause tensor mismatch errors
✅ Each model size has separate cache entries
✅ Cache speedup is working (~5x faster)
✅ MLX backend shows fallback warning for 0.6B
✅ No regression in 1.7B functionality
✅ Old cache files don't cause errors

## Rollback Plan (If Needed)

If issues are found:
```bash
cd backend
git checkout HEAD -- utils/cache.py backends/mlx_backend.py backends/pytorch_backend.py
```

Then restart the server.

## Monitoring Commands

```bash
# Watch server logs
tail -f backend/logs/server.log | grep -E "cache|model|tensor"

# Check cache directory
watch -n 1 'ls -lh backend/data/cache/ | tail -10'

# Monitor server health
curl http://localhost:17493/health | jq .
```
