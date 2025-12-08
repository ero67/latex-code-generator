from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import subprocess
import os
import uuid
import base64
import shutil
from pathlib import Path
from typing import Optional, List

app = FastAPI()

# LaTeX working directory
LATEX_WORK_DIR = "/tmp/latex"
COMPILATION_TIMEOUT = 30  # seconds


class CompileRequest(BaseModel):
    code: str


class CompileResponse(BaseModel):
    success: bool
    pdf_base64: Optional[str] = None
    errors: Optional[List[str]] = None
    warnings: Optional[List[str]] = None
    log: Optional[str] = None


def parse_latex_errors(log_content: str) -> List[str]:
    """Parse LaTeX compilation errors from log file."""
    errors = []
    error_patterns = [
        r"! (.*?)\n.*?l\.(\d+)",  # Standard LaTeX errors
        r"Error: (.*?)\n",  # Generic errors
    ]
    
    import re
    for pattern in error_patterns:
        matches = re.finditer(pattern, log_content, re.MULTILINE)
        for match in matches:
            error_msg = match.group(1).strip() if match.groups() else match.group(0)
            if len(match.groups()) > 1:
                line_num = match.group(2)
                errors.append(f"Line {line_num}: {error_msg}")
            else:
                errors.append(error_msg)
    
    return errors if errors else ["Unknown compilation error"]


def parse_latex_warnings(log_content: str) -> List[str]:
    """Parse LaTeX warnings from log file."""
    warnings = []
    import re
    warning_pattern = r"Warning: (.*?)\n"
    matches = re.finditer(warning_pattern, log_content, re.MULTILINE)
    for match in matches:
        warnings.append(match.group(1).strip())
    return warnings


@app.post("/compile", response_model=CompileResponse)
async def compile_latex(request: CompileRequest):
    """
    Compile LaTeX code to PDF.
    
    Returns:
        - success: bool
        - pdf_base64: Base64 encoded PDF (if successful)
        - errors: List of error messages (if failed)
        - warnings: List of warning messages
        - log: Compilation log
    """
    if not request.code or not request.code.strip():
        raise HTTPException(status_code=400, detail="LaTeX code is required")
    
    # Create unique working directory
    work_dir = os.path.join(LATEX_WORK_DIR, str(uuid.uuid4()))
    os.makedirs(work_dir, exist_ok=True)
    
    try:
        # Write LaTeX file
        tex_file = os.path.join(work_dir, "document.tex")
        with open(tex_file, "w", encoding="utf-8") as f:
            f.write(request.code)
        
        # Compile LaTeX to PDF
        compile_cmd = [
            "pdflatex",
            "-interaction=nonstopmode",
            "-halt-on-error",
            "-output-directory", work_dir,
            tex_file
        ]
        
        try:
            result = subprocess.run(
                compile_cmd,
                cwd=work_dir,
                capture_output=True,
                text=True,
                timeout=COMPILATION_TIMEOUT,
            )
            
            # Check if PDF was created
            pdf_path = os.path.join(work_dir, "document.pdf")
            pdf_exists = os.path.exists(pdf_path)
            
            # Read log file
            log_path = os.path.join(work_dir, "document.log")
            log_content = ""
            if os.path.exists(log_path):
                with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
                    log_content = f.read()
            
            if not pdf_exists:
                # Compilation failed
                errors = parse_latex_errors(log_content or result.stderr)
                return CompileResponse(
                    success=False,
                    errors=errors,
                    log=log_content or result.stderr,
                )
            
            # Read PDF and encode to base64
            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()
                pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
            
            # Parse warnings
            warnings = parse_latex_warnings(log_content or result.stdout)
            
            return CompileResponse(
                success=True,
                pdf_base64=pdf_base64,
                warnings=warnings if warnings else None,
                log=log_content if log_content else None,
            )
            
        except subprocess.TimeoutExpired:
            return CompileResponse(
                success=False,
                errors=["Compilation timeout exceeded"],
                log="Compilation took longer than 30 seconds",
            )
        except Exception as e:
            return CompileResponse(
                success=False,
                errors=[f"Compilation error: {str(e)}"],
                log=str(e),
            )
    
    finally:
        # Cleanup: remove temp directory
        try:
            if os.path.exists(work_dir):
                shutil.rmtree(work_dir)
        except Exception:
            pass  # Ignore cleanup errors


@app.get("/health")
async def health():
    """Health check endpoint."""
    # Check if pdflatex is available
    try:
        result = subprocess.run(
            ["pdflatex", "--version"],
            capture_output=True,
            timeout=5,
        )
        if result.returncode == 0:
            return {"status": "ok", "pdflatex": "available"}
        else:
            return {"status": "error", "pdflatex": "not available"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
