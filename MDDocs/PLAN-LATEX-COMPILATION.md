# LaTeX Compilation & Editing Implementation Plan

## Overview
Implement LaTeX code editing and compilation directly in the app, allowing users to:
1. Edit LaTeX code for Karnaugh Maps, Proof Trees, and Abstract Syntax Trees
2. Compile LaTeX on the backend to generate PDFs
3. View the compiled PDF in the browser
4. Edit the code and recompile to see updated results

## Current State Analysis

### What We Have:
- ✅ LaTeX code generation for:
  - Karnaugh Maps (karnaugh-map package)
  - Abstract Syntax Trees (forest package)
  - Proof Trees (bussproofs package)
- ✅ LaTeX code display (syntax highlighted)
- ✅ LaTeX code import/parsing
- ❌ No LaTeX compilation
- ❌ No PDF generation
- ❌ No visual output display
- ❌ No code editing interface

### What We Need:
- 📝 Code editor for LaTeX (Monaco Editor or CodeMirror)
- 🖼️ Server-side LaTeX compilation (PDF generation)
- 📄 PDF viewer in browser
- 🔄 Edit → Compile → View → Edit workflow
- ⚠️ Error handling and display

---

## Architecture: Server-Side LaTeX Compilation

### Approach: Backend PDF Generation + Browser Display

**Flow:**
1. User edits LaTeX code in editor
2. User clicks "Compile" button
3. Frontend sends LaTeX code to backend API
4. Backend compiles LaTeX → generates PDF
5. Backend returns PDF (as base64 or file URL)
6. Frontend displays PDF in browser using PDF viewer
7. User can edit code again and recompile

**Key Components:**
- **Backend:** LaTeX compilation service (Docker container with TeXLive)
- **Backend API:** `/api/latex/compile` endpoint
- **Frontend:** Code editor + PDF viewer component
- **PDF Display:** Browser-native or PDF.js library

---

## Implementation Plan

### Phase 1: Backend LaTeX Compilation Service 🚀

**Goal:** Set up server-side LaTeX compilation with PDF generation

**Steps:**

1. **Backend: LaTeX Compilation Docker Service**
   - Add LaTeX service to docker-compose.yml
   - Use TeXLive Docker image
   - Install required packages: bussproofs, forest, karnaugh-map

2. **Backend: LaTeX Compilation Service**
   - Create service to compile LaTeX code
   - Generate PDF from LaTeX
   - Handle compilation errors
   - Return PDF as base64 or file URL

3. **Backend: API Endpoint**
   - `POST /api/latex/compile`
   - Accept LaTeX code in request body
   - Return PDF data and compilation status

4. **Error Handling**
   - Parse LaTeX compilation errors
   - Return structured error messages
   - Include line numbers and error descriptions

**Files to Create:**
- `backend/src/routes/latex.routes.ts`
- `backend/src/controllers/latex.controller.ts`
- `backend/src/services/latex.service.ts`
- Update `docker-compose.yml` with LaTeX service

---

### Phase 2: Frontend Code Editor & PDF Viewer 📝

**Goal:** Create LaTeX editor with PDF preview

**Steps:**

1. **Install Dependencies**
   ```bash
   cd new-frontend
   npm install @monaco-editor/react
   # OR
   npm install @uiw/react-codemirror @codemirror/lang-latex
   npm install react-pdf  # For PDF viewing
   ```

2. **Create LaTeX Editor Component**
   - Code editor (Monaco Editor or CodeMirror)
   - Split view: Editor | PDF Preview
   - "Compile" button
   - Loading/error states

3. **Create PDF Viewer Component**
   - Display PDF in browser
   - Handle PDF loading states
   - Zoom controls
   - Download button

4. **Integration**
   - Add to Proof Trees page
   - Add to Karnaugh Map page
   - Add to AST page
   - Replace or enhance existing "Generate LaTeX" sections

**Files to Create:**
- `src/Components/LaTeXEditor/LaTeXEditor.jsx`
- `src/Components/LaTeXEditor/PDFViewer.jsx`
- `src/Components/LaTeXEditor/LaTeXToolbar.jsx`
- `src/services/latex.service.js`

---

### Phase 3: Enhanced Features 🎨

**Goal:** Advanced editing and compilation features

**Features:**
1. **Auto-save** LaTeX code to localStorage
2. **Compilation history** (last N compilations)
3. **PDF download** button
4. **Syntax highlighting** for LaTeX (in editor)
5. **Auto-completion** for LaTeX commands
6. **Error highlighting** in editor (line numbers)
7. **Compilation status** indicator
8. **Keyboard shortcuts** (Ctrl+S to compile)

---

## Detailed Implementation

### Phase 1: Backend LaTeX Compilation

#### 1.1 Update Docker Compose

**File:** `docker-compose.yml`

Add LaTeX compilation service:

```yaml
latex-compiler:
  image: texlive/texlive:latest
  container_name: latex-compiler
  volumes:
    - latex-temp:/tmp/latex
  networks:
    - app-network
  # This service will be used by the backend via exec
```

Or integrate LaTeX into the backend service:

```yaml
backend:
  # ... existing config ...
  volumes:
    - latex-temp:/tmp/latex
  # Install LaTeX in backend container
```

#### 1.2 Backend LaTeX Service

**File:** `backend/src/services/latex.service.ts`

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export interface CompilationResult {
  success: boolean;
  pdf?: Buffer;
  pdfBase64?: string;
  errors?: string[];
  warnings?: string[];
  log?: string;
}

export class LaTeXService {
  private static readonly TEMP_DIR = '/tmp/latex';
  private static readonly TIMEOUT_MS = 30000; // 30 seconds

  /**
   * Compile LaTeX code to PDF
   */
  static async compileToPDF(latexCode: string): Promise<CompilationResult> {
    const workDir = path.join(this.TEMP_DIR, uuidv4());
    
    try {
      // Create working directory
      await fs.mkdir(workDir, { recursive: true });
      
      // Write LaTeX file
      const texFile = path.join(workDir, 'document.tex');
      await fs.writeFile(texFile, latexCode, 'utf-8');
      
      // Compile LaTeX to PDF
      const compileCommand = `cd ${workDir} && pdflatex -interaction=nonstopmode -halt-on-error document.tex`;
      
      try {
        const { stdout, stderr } = await execAsync(compileCommand, {
          timeout: this.TIMEOUT_MS,
          maxBuffer: 10 * 1024 * 1024, // 10MB
        });
        
        // Check if PDF was created
        const pdfPath = path.join(workDir, 'document.pdf');
        const pdfExists = await fs.access(pdfPath).then(() => true).catch(() => false);
        
        if (!pdfExists) {
          // Parse errors from log
          const logPath = path.join(workDir, 'document.log');
          const logContent = await fs.readFile(logPath, 'utf-8').catch(() => '');
          const errors = this.parseLaTeXErrors(logContent);
          
          return {
            success: false,
            errors,
            log: logContent,
          };
        }
        
        // Read PDF
        const pdfBuffer = await fs.readFile(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        return {
          success: true,
          pdf: pdfBuffer,
          pdfBase64,
          warnings: this.parseLaTeXWarnings(stdout),
        };
        
      } catch (error: any) {
        // Compilation failed
        const logPath = path.join(workDir, 'document.log');
        const logContent = await fs.readFile(logPath, 'utf-8').catch(() => '');
        const errors = this.parseLaTeXErrors(logContent || error.message);
        
        return {
          success: false,
          errors,
          log: logContent || error.message,
        };
      }
      
    } finally {
      // Cleanup: remove temp directory
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  /**
   * Parse LaTeX compilation errors from log file
   */
  private static parseLaTeXErrors(logContent: string): string[] {
    const errors: string[] = [];
    const errorRegex = /! (.*?)\n.*?l\.(\d+)/g;
    let match;
    
    while ((match = errorRegex.exec(logContent)) !== null) {
      const errorMsg = match[1].trim();
      const lineNum = match[2];
      errors.push(`Line ${lineNum}: ${errorMsg}`);
    }
    
    return errors.length > 0 ? errors : ['Unknown compilation error'];
  }

  /**
   * Parse LaTeX warnings from output
   */
  private static parseLaTeXWarnings(output: string): string[] {
    const warnings: string[] = [];
    const warningRegex = /Warning: (.*?)\n/g;
    let match;
    
    while ((match = warningRegex.exec(output)) !== null) {
      warnings.push(match[1].trim());
    }
    
    return warnings;
  }
}
```

#### 1.3 Backend Controller

**File:** `backend/src/controllers/latex.controller.ts`

```typescript
import { Request, Response } from 'express';
import { LaTeXService } from '../services/latex.service';

export const compileLaTeX = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'LaTeX code is required',
      });
    }

    const result = await LaTeXService.compileToPDF(code);

    if (result.success) {
      return res.status(200).json({
        status: 'success',
        pdf: result.pdfBase64,
        warnings: result.warnings,
      });
    } else {
      return res.status(400).json({
        status: 'error',
        errors: result.errors,
        log: result.log,
      });
    }
  } catch (error: any) {
    console.error('LaTeX compilation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during compilation',
      error: error.message,
    });
  }
};
```

#### 1.4 Backend Routes

**File:** `backend/src/routes/latex.routes.ts`

```typescript
import { Router } from 'express';
import { compileLaTeX } from '../controllers/latex.controller';

const router = Router();

router.post('/compile', compileLaTeX);

export default router;
```

**Update:** `backend/src/app.ts`

```typescript
import latexRoutes from './routes/latex.routes';
// ...
app.use('/api/latex', latexRoutes);
```

---

### Phase 2: Frontend Implementation

#### 2.1 Install Frontend Dependencies

```bash
cd new-frontend
npm install @monaco-editor/react
npm install react-pdf pdfjs-dist
# OR for CodeMirror:
# npm install @uiw/react-codemirror @codemirror/lang-latex
```

#### 2.2 Frontend LaTeX Service

**File:** `new-frontend/src/services/latex.service.js`

```javascript
import axios from 'axios';

export const compileLaTeX = async (latexCode) => {
  try {
    const response = await axios.post('/api/latex/compile', {
      code: latexCode,
    });
    return {
      success: true,
      pdfBase64: response.data.pdf,
      warnings: response.data.warnings || [],
    };
  } catch (error) {
    if (error.response?.data) {
      return {
        success: false,
        errors: error.response.data.errors || [error.response.data.message],
        log: error.response.data.log,
      };
    }
    return {
      success: false,
      errors: ['Network error. Please try again.'],
    };
  }
};
```

#### 2.3 LaTeX Editor Component

**File:** `new-frontend/src/Components/LaTeXEditor/LaTeXEditor.jsx`

```jsx
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import PDFViewer from './PDFViewer';
import { compileLaTeX } from '../../services/latex.service';
import { toast } from 'react-toastify';

const LaTeXEditor = ({ initialCode, onCodeChange }) => {
  const [code, setCode] = useState(initialCode || '');
  const [pdfBase64, setPdfBase64] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showPreview, setShowPreview] = useState(true);

  const handleEditorChange = (value) => {
    setCode(value || '');
    onCodeChange?.(value);
    // Clear previous compilation when code changes
    if (pdfBase64) {
      setPdfBase64(null);
      setErrors([]);
    }
  };

  const handleCompile = async () => {
    if (!code.trim()) {
      toast.error('LaTeX code is empty');
      return;
    }

    setIsCompiling(true);
    setErrors([]);
    setPdfBase64(null);

    try {
      const result = await compileLaTeX(code);

      if (result.success) {
        setPdfBase64(result.pdfBase64);
        if (result.warnings?.length > 0) {
          toast.warning(`Compiled with ${result.warnings.length} warning(s)`);
        } else {
          toast.success('LaTeX compiled successfully!');
        }
      } else {
        setErrors(result.errors || ['Compilation failed']);
        toast.error('LaTeX compilation failed');
      }
    } catch (error) {
      setErrors(['Failed to compile LaTeX. Please try again.']);
      toast.error('Compilation error');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfBase64) return;
    
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${pdfBase64}`;
    link.download = 'document.pdf';
    link.click();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCompile}
            disabled={isCompiling || !code.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isCompiling ? 'Compiling...' : 'Compile'}
          </button>
          {pdfBase64 && (
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Download PDF
            </button>
          )}
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <h4 className="font-semibold text-red-800 mb-2">Compilation Errors:</h4>
          <ul className="list-disc list-inside text-sm text-red-700">
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Editor and Preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} border-r`}>
          <Editor
            height="100%"
            defaultLanguage="latex"
            value={code}
            onChange={handleEditorChange}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              lineNumbers: 'on',
            }}
          />
        </div>

        {/* PDF Preview */}
        {showPreview && (
          <div className="w-1/2 overflow-auto bg-gray-100">
            {isCompiling ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Compiling LaTeX...</p>
                </div>
              </div>
            ) : pdfBase64 ? (
              <PDFViewer pdfBase64={pdfBase64} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Click "Compile" to generate PDF preview</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LaTeXEditor;
```

#### 2.4 PDF Viewer Component

**File:** `new-frontend/src/Components/LaTeXEditor/PDFViewer.jsx`

```jsx
import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ pdfBase64 }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  };

  const pdfData = `data:application/pdf;base64,${pdfBase64}`;

  return (
    <div className="flex flex-col h-full">
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-2 bg-white border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {pageNumber} of {numPages || '--'}
          </span>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="px-2 py-1 text-sm border rounded"
          >
            -
          </button>
          <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(2, s + 0.25))}
            className="px-2 py-1 text-sm border rounded"
          >
            +
          </button>
        </div>
      </div>

      {/* PDF Display */}
      <div className="flex-1 overflow-auto p-4 flex justify-center">
        <Document
          file={pdfData}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-full">
              <p>Loading PDF...</p>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-full text-red-600">
              <p>Failed to load PDF</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;
```

---

## Architecture Decisions

### Code Editor Choice

**Option A: Monaco Editor** (VS Code editor) ⭐ **RECOMMENDED**
- ✅ Excellent LaTeX syntax highlighting
- ✅ Large bundle size (~2MB) - can lazy load
- ✅ Feature-rich (autocomplete, error highlighting)
- ✅ Familiar VS Code experience

**Option B: CodeMirror 6**
- ✅ Smaller bundle (~500KB)
- ✅ Good LaTeX support
- ✅ More customizable
- ❌ Less feature-rich out of the box

**Recommendation:** Monaco Editor for better UX, with lazy loading to reduce initial bundle

---

### PDF Viewer Choice

**Option A: react-pdf (PDF.js)** ⭐ **RECOMMENDED**
- ✅ Full PDF.js features
- ✅ Text selection, zoom, navigation
- ✅ Good browser compatibility
- ✅ Active maintenance

**Option B: Browser Native (iframe/embed)**
- ✅ Zero dependencies
- ✅ Simple implementation
- ❌ Less control over display
- ❌ Browser-dependent behavior

**Recommendation:** react-pdf for better control and features

---

## File Structure

```
new-frontend/src/
├── Components/
│   └── LaTeXEditor/
│       ├── LaTeXEditor.jsx      # Main editor component
│       ├── PDFViewer.jsx        # PDF display component
│       ├── LaTeXToolbar.jsx     # Toolbar with compile/download buttons
│       └── index.js
├── services/
│   └── latex.service.js         # API calls for compilation

backend/src/
├── routes/
│   └── latex.routes.ts          # LaTeX API routes
├── controllers/
│   └── latex.controller.ts      # Request handlers
├── services/
│   └── latex.service.ts         # LaTeX compilation logic
└── docker-compose.yml            # Updated with LaTeX service
```

---

## Implementation Timeline

### Week 1: Backend Setup
- [ ] Set up LaTeX Docker service (or install in backend container)
- [ ] Create LaTeX compilation service
- [ ] Create API endpoint `/api/latex/compile`
- [ ] Test compilation with sample LaTeX code
- [ ] Add error parsing and handling

### Week 2: Frontend Editor
- [ ] Install dependencies (Monaco Editor, react-pdf)
- [ ] Create LaTeX Editor component
- [ ] Create PDF Viewer component
- [ ] Integrate compilation API calls
- [ ] Test editor and PDF display

### Week 3: Integration
- [ ] Integrate into Proof Trees page
- [ ] Integrate into Karnaugh Map page
- [ ] Integrate into AST page
- [ ] Add error display in editor
- [ ] Add loading states

### Week 4: Polish & Testing
- [ ] Add PDF download functionality
- [ ] Improve error messages
- [ ] Add keyboard shortcuts (Ctrl+S to compile)
- [ ] Testing with various LaTeX packages
- [ ] Performance optimization

### Week 5+: Enhanced Features
- [ ] Auto-save LaTeX code
- [ ] Compilation history
- [ ] Syntax error highlighting
- [ ] Auto-completion for LaTeX commands

---

## Success Metrics

- ✅ Users can edit LaTeX code in-app
- ✅ LaTeX compiles successfully on backend
- ✅ PDF displays correctly in browser
- ✅ Users can edit code and recompile
- ✅ Error messages are helpful and actionable
- ✅ Compilation performance is acceptable (<5s for typical documents)
- ✅ PDF download works
- ✅ All three structure types work (Karnaugh Maps, Proof Trees, ASTs)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LaTeX compilation slow | High | Use caching, show progress |
| Server resource usage | Medium | Use Docker limits, queue system |
| Complex LaTeX packages | Medium | Start with supported packages |
| Bundle size increase | Low | Code splitting, lazy loading |

---

## Integration Points

### Where to Add LaTeX Editor

1. **Proof Trees Page** (`src/Pages/ProofTrees/ProofTree.jsx`)
   - Replace or enhance "Generate LaTeX Code" section
   - Add "Edit & Compile" button
   - Show editor with generated LaTeX code

2. **Karnaugh Map Page** (`src/Pages/KarnaughMap/KarnaughMap.jsx`)
   - Add "Edit & Compile" tab next to existing LaTeX display
   - Allow editing of generated LaTeX

3. **AST Page** (`src/Pages/AbstractSyntaxTrees/AST.jsx`)
   - Add "Edit & Compile" functionality
   - Show PDF preview of compiled tree

4. **Image-to-LaTeX Page** (`src/Pages/ImageToLatex/ImageToLatex.jsx`)
   - Add "Edit & Compile" button after LaTeX generation
   - Allow editing of AI-generated LaTeX

### Example Integration

```jsx
// In ProofTree.jsx
import LaTeXEditor from '../../Components/LaTeXEditor/LaTeXEditor';

// Add state
const [showEditor, setShowEditor] = useState(false);

// Add button
<button onClick={() => setShowEditor(true)}>
  Edit & Compile LaTeX
</button>

// Show editor modal
{showEditor && (
  <Modal onClose={() => setShowEditor(false)}>
    <LaTeXEditor 
      initialCode={generatedCode}
      onCodeChange={(newCode) => setGeneratedCode(newCode)}
    />
  </Modal>
)}
```

---

## Next Steps

1. **Set up LaTeX environment:** Install TeXLive in Docker or backend container
2. **Create backend service:** Implement LaTeX compilation service
3. **Create API endpoint:** Set up `/api/latex/compile` route
4. **Build frontend components:** LaTeX Editor and PDF Viewer
5. **Test with one page:** Start with Proof Trees page
6. **Integrate to all pages:** Add to Karnaugh Maps and ASTs

---

## Dependencies Summary

### Backend
- `uuid` - For generating unique temp directories
- TeXLive (via Docker or system installation)
- Required LaTeX packages: `bussproofs`, `forest`, `karnaugh-map`

### Frontend
- `@monaco-editor/react` - Code editor
- `react-pdf` - PDF viewer
- `pdfjs-dist` - PDF.js worker (for react-pdf)
- `axios` - Already installed, for API calls

---

## Workflow Example

1. User generates LaTeX code (e.g., from Proof Tree)
2. User clicks "Edit & Compile" button
3. LaTeX Editor opens with generated code
4. User edits code if needed
5. User clicks "Compile" button
6. Frontend sends code to `/api/latex/compile`
7. Backend compiles LaTeX → generates PDF
8. Backend returns PDF as base64
9. Frontend displays PDF in PDF Viewer
10. User can edit code again and recompile
11. User can download PDF

This workflow allows iterative editing and compilation until the desired output is achieved.

