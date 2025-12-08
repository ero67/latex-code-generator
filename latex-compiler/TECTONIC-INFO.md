# Tectonic LaTeX Engine

## Why Tectonic?

We're using **Tectonic** instead of the full TeXLive distribution for several key benefits:

### Benefits ✅

1. **Much Smaller Image Size**
   - TeXLive full: ~4GB+ Docker image
   - Tectonic: ~200-300MB Docker image (with Python)
   - **~95% reduction in image size!**

2. **On-Demand Package Download**
   - Tectonic downloads LaTeX packages as needed during compilation
   - Packages are cached for subsequent compilations
   - No need to pre-install all packages

3. **Single Binary**
   - Tectonic is a single, self-contained binary
   - No complex dependencies
   - Easy to update

4. **Faster Builds**
   - Smaller base image = faster Docker builds
   - Faster container startup

5. **Modern Engine**
   - Based on XeTeX engine
   - Actively maintained
   - Good compatibility with standard LaTeX

### How It Works

1. **First Compilation**: Tectonic downloads required packages from CTAN
2. **Caching**: Packages are cached in `/root/.cache/Tectonic`
3. **Subsequent Compilations**: Uses cached packages (much faster)

### Supported Packages

Tectonic supports most standard LaTeX packages including:
- ✅ `bussproofs` (for proof trees)
- ✅ `forest` (for abstract syntax trees)
- ✅ `karnaugh-map` (for Karnaugh maps)
- ✅ Most other standard LaTeX packages

### Package Caching

Packages are automatically cached. The cache persists in the container, so:
- First compilation of a document type: Downloads packages (~10-30s)
- Subsequent compilations: Uses cache (~1-3s)

### Image Size Comparison

| Solution | Image Size | Notes |
|----------|-----------|-------|
| TeXLive Full | ~4GB | Everything pre-installed |
| TeXLive Minimal | ~1-2GB | Still large, limited packages |
| **Tectonic** | **~200-300MB** | Downloads on-demand |

### Performance

- **First compilation**: Slightly slower (downloads packages)
- **Subsequent compilations**: Faster (uses cache)
- **Overall**: Better for most use cases

### Compatibility

Tectonic is compatible with:
- Standard LaTeX documents
- Most LaTeX packages
- XeTeX features (Unicode, modern fonts)

### References

- [Tectonic GitHub](https://github.com/tectonic-typesetting/tectonic)
- [Tectonic Documentation](https://tectonic-typesetting.github.io/)

