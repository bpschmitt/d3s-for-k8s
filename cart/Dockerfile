# Python cart service Dockerfile

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup --gid 1001 --system appuser && \
    adduser --uid 1001 --system --gid 1001 appuser

# Copy requirements first for better layer caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:3003/health').read()"

# Run with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:3003", "--workers", "2", "--threads", "4", "--timeout", "60", "app:app"]

