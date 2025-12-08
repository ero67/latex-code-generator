# Testing LaTeX Compiler Service

## Quick Test Steps

### 1. Build and Start the Service

```bash
# Build the service
docker-compose build latex-compiler

# Start the service
docker-compose up latex-compiler
```

Or start it in detached mode:
```bash
docker-compose up -d latex-compiler
```

### 2. Test Health Endpoint

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{"status": "ok", "pdflatex": "available"}
```

### 3. Test Compilation (Simple)

```bash
curl -X POST http://localhost:8080/compile \
  -H "Content-Type: application/json" \
  -d '{
    "code": "\\documentclass{article}\\begin{document}Hello, World!\\end{document}"
  }'
```

### 4. Test with Python Script

```bash
cd latex-compiler
pip install requests  # if not already installed
python3 test_service.py
```

This will:
- Test health endpoint
- Test simple LaTeX compilation
- Test proof tree compilation
- Test error handling
- Save PDFs to verify output

### 5. Manual Test with Proof Tree

```bash
curl -X POST http://localhost:8080/compile \
  -H "Content-Type: application/json" \
  -d '{
    "code": "\\documentclass{article}\\usepackage{bussproofs}\\begin{document}\\begin{prooftree}\\AxiomC{$A$}\\UnaryInfC{$A \\lor B$}\\end{prooftree}\\end{document}"
  }'
```

### 6. Check Logs

```bash
docker-compose logs latex-compiler
```

## Expected Results

### Successful Compilation
```json
{
  "success": true,
  "pdf_base64": "JVBERi0xLjQKJeLjz9MKMy...",
  "warnings": null,
  "errors": null
}
```

### Failed Compilation
```json
{
  "success": false,
  "pdf_base64": null,
  "errors": ["Line 3: Undefined control sequence"],
  "log": "..."
}
```

## Troubleshooting

### Service won't start
- Check if port 8080 is already in use
- Check Docker logs: `docker-compose logs latex-compiler`

### Compilation fails
- Check if TeXLive packages are installed correctly
- Verify LaTeX code is valid
- Check service logs for detailed error messages

### Connection refused
- Make sure service is running: `docker-compose ps`
- Check if service is on the correct port
- Verify network connectivity

## Next Steps

Once testing is successful:
1. ✅ LaTeX service works independently
2. → Implement backend integration
3. → Test end-to-end flow

