# AGENTS.md - Coding Agent Guidelines

## Project Overview

LaTeX Code Generator is a monorepo for generating LaTeX code (Karnaugh maps, syntax trees, proof trees, FSA, etc.):

- **Frontend** (`new-frontend/`): React 19 + Vite + Tailwind CSS 4
- **Backend** (`backend/`): Node.js + Express + TypeScript + MongoDB
- **LaTeX Compiler** (`latex-compiler/`): Python FastAPI service
- **Image Preprocessor** (`python-preprocess/`): Python FastAPI + OpenCV

## Build/Lint/Test Commands

### Backend (`backend/`)
```bash
npm run dev                            # Dev server with hot reload
npm run build                          # Compile TypeScript
npm run test                           # Run all Jest tests
npm run test -- path/to/file.test.ts   # Run single test file
npm run test -- --watch                # Watch mode
```

### Frontend (`new-frontend/`)
```bash
npm run dev        # Vite dev server (port 5173)
npm run build      # Production build
npm run lint       # Run ESLint
```

### Python Services
```bash
# latex-compiler/ or python-preprocess/
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8080  # latex-compiler
uvicorn app:app --host 0.0.0.0 --port 8000  # python-preprocess
```

### Docker
```bash
docker-compose up     # Start all services
docker-compose build  # Rebuild images
```

## Code Style Guidelines

### TypeScript (Backend)

**Imports** - group in order: external packages, internal modules, types
```typescript
import { Request, Response } from "express";
import { User } from "../models/User";
```

**Types** - interfaces for models (`IModelName`), type aliases for requests
```typescript
export interface IUser extends mongoose.Document { ... }
type AuthRequest = Request<{}, {}, { email: string }>;
```

**Naming**: `kebab-case` files for routes, `PascalCase` for models, `camelCase` for variables

**Error Handling** - consistent response format:
```typescript
try {
  res.json({ status: "success", data: result });
} catch (error) {
  console.error("Error:", error);
  res.status(500).json({ status: "error", message: "User-friendly message" });
}
```

### JavaScript/JSX (Frontend)

**Imports** - order: React, third-party, components, context, styles
```jsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
```

**Components** - functional with hooks, `PascalCase` naming
```jsx
function ComponentName({ prop }) {
  const [state, setState] = useState(null);
  return <div>...</div>;
}
export default ComponentName;
```

**ESLint Rules**: no-unused-vars (except uppercase/underscore), react-hooks rules

### Python (FastAPI)

Follow PEP 8: `snake_case` functions, `PascalCase` classes, Pydantic models for requests
```python
class CompileRequest(BaseModel):
    code: str

@app.post("/compile")
async def compile_latex(request: CompileRequest):
    """Docstring."""
    if not request.code:
        raise HTTPException(status_code=400, detail="Required")
```

## Project Structure

```
backend/src/
├── controllers/    # Request handlers
├── models/         # Mongoose schemas (IModelName interface)
├── routes/         # Express routes (*.routes.ts)
├── services/       # Business logic
├── middleware/     # Auth, upload
└── config/         # Database, SSO

new-frontend/src/
├── Components/     # Reusable UI (PascalCase dirs)
├── Pages/          # Route pages
├── context/        # React contexts
└── index.css       # Tailwind imports

MDDocs/             # Documentation files (plans, explanations)
```

## Important Conventions

- **Documentation**: Place `.md` files in `MDDocs/` directory (Cursor rule)
- **Database**: MongoDB + Mongoose, use `timestamps: true` in schemas
- **Auth**: JWT in localStorage, `Authorization: Bearer <token>` header
- **Styling**: Tailwind CSS utility classes preferred
- **API Response**: `{ status: "success"|"error", data?: ..., message?: ... }`

## Adding New Features

**Backend**: model (`models/`) → controller (`controllers/`) → routes (`routes/`) → register in `app.ts`

**Frontend**: page (`Pages/`) → route in `App.jsx` → nav item in `SidebarData.jsx`

## Environment Variables (Backend)
Required: `MONGODB_URI`, `JWT_SECRET`, `PORT`
Optional: `FRONTEND_URL`, SSO config

## Build Artifacts (gitignored)
`backend/dist/`, `new-frontend/dist/`, `node_modules/`
