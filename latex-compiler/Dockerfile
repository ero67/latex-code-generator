FROM texlive/texlive:latest
WORKDIR /app

# Install Python, pip, and curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install required Python packages
# Using --break-system-packages is safe in Docker containers since they're isolated
COPY requirements.txt .
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy application code
COPY . .

# Create directory for LaTeX temporary files
RUN mkdir -p /tmp/latex && chmod 777 /tmp/latex

EXPOSE 8080
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]


