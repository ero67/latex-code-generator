# LaTeX Service Architecture Comparison

## Option 1: LaTeX in Backend Container (Current Approach)

### Pros ✅
- **Simpler setup**: Everything in one container
- **Direct execution**: Can call `pdflatex` directly via `exec`
- **No network overhead**: No inter-service communication
- **Easier debugging**: All logs in one place
- **Faster execution**: No network latency
- **Single container to manage**: Less complexity

### Cons ❌
- **Larger backend image**: TeXLive adds ~500MB-1GB to image size
- **Slower builds**: Backend Docker build takes longer
- **Resource coupling**: LaTeX compilation competes with Node.js for resources
- **Harder to scale**: Can't scale LaTeX compilation independently
- **Update complexity**: Need to rebuild entire backend to update LaTeX packages
- **Mixed concerns**: Backend container handles both API and LaTeX compilation

### Implementation
```typescript
// Direct exec in backend
exec('pdflatex document.tex', { cwd: '/tmp/latex' })
```

---

## Option 2: Separate LaTeX Service (Recommended) ⭐

### Pros ✅
- **Separation of concerns**: LaTeX isolated from API
- **Smaller backend image**: Backend stays lightweight
- **Independent scaling**: Can scale LaTeX service separately
- **Better resource isolation**: LaTeX compilation doesn't affect API performance
- **Easier updates**: Update LaTeX packages without rebuilding backend
- **Pre-built images**: Can use official TeXLive Docker images
- **Better monitoring**: Separate metrics for LaTeX compilation
- **Consistent pattern**: Matches your python-preprocess service architecture

### Cons ❌
- **More complex setup**: Additional service to manage
- **Network communication**: Need to communicate between services
- **Slightly more overhead**: Network call vs direct exec
- **Service dependencies**: Backend depends on LaTeX service

### Implementation Options

#### Option 2A: HTTP API Service (Like python-preprocess)
```typescript
// Backend calls LaTeX service via HTTP
const response = await axios.post('http://latex-compiler:8080/compile', {
  code: latexCode
});
```

**Pros:**
- Consistent with python-preprocess pattern
- Can add authentication, rate limiting
- Better error handling
- Can add queue system later

**Cons:**
- Need to build HTTP API wrapper
- More code to maintain

#### Option 2B: Docker Exec (Shared Volume)
```typescript
// Backend executes commands in LaTeX container
const { exec } = require('child_process');
exec('docker exec latex-compiler pdflatex document.tex', ...)
```

**Pros:**
- Simple implementation
- Direct command execution
- No HTTP overhead

**Cons:**
- Backend needs Docker socket access (security concern)
- Less flexible
- Harder to scale

---

## Recommendation: Separate HTTP Service (Option 2A) ⭐

**Why?**
1. **Matches your existing pattern**: You already have python-preprocess as a separate HTTP service
2. **Better architecture**: Separation of concerns
3. **Scalability**: Can add queue system, multiple workers later
4. **Resource isolation**: LaTeX compilation won't slow down your API
5. **Easier maintenance**: Update LaTeX without touching backend

### Architecture

```
Frontend → Backend API → LaTeX Service (HTTP) → pdflatex → PDF
```

Similar to:
```
Frontend → Backend API → Python Preprocess (HTTP) → OpenCV → Image
```

---

## Implementation: Separate LaTeX Service

### Docker Compose Setup

```yaml
latex-compiler:
  image: texlive/texlive:latest
  container_name: latex-compiler
  volumes:
    - latex-temp:/tmp/latex
  networks:
    - app-network
  # Runs a simple HTTP server for compilation requests
```

### LaTeX Service (Simple HTTP API)

**Option A: Node.js wrapper** (matches your stack)
- Small Express server
- Executes pdflatex
- Returns PDF

**Option B: Python wrapper** (matches python-preprocess)
- FastAPI server
- Executes pdflatex
- Returns PDF

**Option C: Use existing TeXLive image with custom entrypoint**
- Minimal setup
- Need to add HTTP server

---

## Comparison Table

| Aspect | In Backend | Separate Service |
|--------|-----------|------------------|
| **Setup Complexity** | ⭐⭐ Simple | ⭐⭐⭐ Moderate |
| **Image Size** | ❌ Large (~1GB+) | ✅ Small backend |
| **Build Time** | ❌ Slow | ✅ Fast backend builds |
| **Resource Isolation** | ❌ Shared | ✅ Isolated |
| **Scalability** | ❌ Coupled | ✅ Independent |
| **Maintenance** | ❌ Rebuild all | ✅ Update separately |
| **Pattern Consistency** | ❌ Different | ✅ Matches python-preprocess |
| **Performance** | ✅ Slightly faster | ⭐ Good (minimal overhead) |
| **Error Isolation** | ❌ Can crash backend | ✅ Isolated failures |

---

## My Recommendation

**Go with Separate HTTP Service (Option 2A)** because:

1. ✅ **Consistency**: Matches your python-preprocess pattern
2. ✅ **Better architecture**: Separation of concerns
3. ✅ **Future-proof**: Can add features like:
   - Compilation queue
   - Multiple workers
   - Caching
   - Rate limiting
4. ✅ **Resource management**: LaTeX won't affect API performance
5. ✅ **Easier debugging**: Isolated logs and metrics

The small overhead of HTTP communication is worth the architectural benefits.

---

## Next Steps

If you choose **Separate Service**:
1. Create LaTeX service (Node.js or Python)
2. Add to docker-compose.yml
3. Update backend to call LaTeX service via HTTP
4. Test compilation

If you choose **In Backend**:
1. Keep current Dockerfile changes
2. Implement LaTeX service directly in backend
3. Use exec to run pdflatex

**Which approach would you prefer?**

