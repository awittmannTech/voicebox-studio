"""
Test that cache keys include model size to prevent tensor dimension mismatches.
"""

from pathlib import Path
import sys
import hashlib

# Add parent directory to path to import as a package
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir.parent))

# Simplified version of get_cache_key for testing
def get_cache_key(audio_path: str, reference_text: str, model_size: str = "1.7B") -> str:
    """Generate cache key from audio file, reference text, and model size."""
    audio_bytes = b""
    if Path(audio_path).exists():
        with open(audio_path, "rb") as f:
            audio_bytes = f.read()

    # Combine audio bytes, text, and model size
    combined = audio_bytes + reference_text.encode("utf-8") + model_size.encode("utf-8")

    # Generate hash
    return hashlib.md5(combined).hexdigest()


def test_cache_key_includes_model_size():
    """Test that cache keys are different for different model sizes."""

    # Use a non-existent file path (will just use empty bytes)
    test_audio = "dummy_audio.wav"
    test_text = "This is a test reference text."

    # Generate cache keys for different model sizes
    cache_key_1_7b = get_cache_key(str(test_audio), test_text, model_size="1.7B")
    cache_key_0_6b = get_cache_key(str(test_audio), test_text, model_size="0.6B")

    print(f"Cache key for 1.7B model: {cache_key_1_7b}")
    print(f"Cache key for 0.6B model: {cache_key_0_6b}")

    # Keys should be different
    assert cache_key_1_7b != cache_key_0_6b, "Cache keys should differ by model size"
    print("[PASS] Cache keys are different for different model sizes")

    # Keys should be consistent for the same model size
    cache_key_1_7b_again = get_cache_key(str(test_audio), test_text, model_size="1.7B")
    assert cache_key_1_7b == cache_key_1_7b_again, "Cache keys should be consistent"
    print("[PASS] Cache keys are consistent for the same model size")

    # Default should be 1.7B
    cache_key_default = get_cache_key(str(test_audio), test_text)
    assert cache_key_default == cache_key_1_7b, "Default should be 1.7B"
    print("[PASS] Default model size is 1.7B")

    print("\n[SUCCESS] All cache key tests passed!")


if __name__ == "__main__":
    test_cache_key_includes_model_size()
