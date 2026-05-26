# Testing Backend LaTeX Compilation Endpoint

## Starting Services

### Option 1: Start All Services
```bash
docker-compose up
```

### Option 2: Start Only Required Services (Faster)
```bash
# Start LaTeX compiler and backend
docker-compose up latex-compiler backend
```

### Option 3: Start in Background (Detached Mode)
```bash
docker-compose up -d latex-compiler backend
```

## Check Services Are Running

```bash
# Check running containers
docker-compose ps

# Check logs
docker-compose logs backend
docker-compose logs latex-compiler
```

## Test the Endpoint

### 1. Test Health Check (LaTeX Compiler)
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{"status": "ok", "pdflatex": "available"}
```

### 2. Test Simple LaTeX Compilation
```bash
curl -X POST http://localhost:3001/api/latex/compile \
  -H "Content-Type: application/json" \
  -d '{
    "code": "\\documentclass{article}\\begin{document}Hello, World!\\end{document}"
  }'
```

### 3. Test with Proof Tree LaTeX
```bash
curl -X POST http://localhost:3001/api/latex/compile \
  -H "Content-Type: application/json" \
  -d '{
    "code": "\\documentclass{article}\\usepackage{bussproofs}\\begin{document}\\begin{prooftree}\\AxiomC{$A$}\\UnaryInfC{$A \\lor B$}\\end{prooftree}\\end{document}"
  }'
```

### 4. Test Error Handling (Invalid LaTeX)
```bash
curl -X POST http://localhost:3001/api/latex/compile \
  -H "Content-Type: application/json" \
  -d '{
    "code": "\\documentclass{article}\\begin{document}\\undefinedcommand{test}\\end{document}"
  }'
```

## Expected Responses

### Success Response
```json
{
  "status": "success",
  "pdf": "JVBERi0xLjQKJeLjz9MKMy...",
  "warnings": null,
  "message": "LaTeX compiled successfully"
}
```

### Error Response
```json
{
  "status": "error",
  "errors": ["Line 3: Undefined control sequence"],
  "log": "...",
  "message": "LaTeX compilation failed"
}
```

## Troubleshooting

### Backend can't connect to LaTeX compiler
- Check if latex-compiler is running: `docker-compose ps latex-compiler`
- Check logs: `docker-compose logs latex-compiler`
- Verify network: Both services should be on `app-network`

### Backend not starting
- Check if MongoDB is running (if backend depends on it)
- Check logs: `docker-compose logs backend`
- Verify environment variables are set

### LaTeX compilation fails
- Check LaTeX compiler logs: `docker-compose logs latex-compiler`
- Verify TeXLive is installed correctly
- Check if required packages are available

## View Logs in Real-Time

```bash
# Backend logs
docker-compose logs -f backend

# LaTeX compiler logs
docker-compose logs -f latex-compiler

# Both services
docker-compose logs -f backend latex-compiler
```

## Stop Services

```bash
# Stop all services
docker-compose down

# Stop specific services
docker-compose stop backend latex-compiler
```

