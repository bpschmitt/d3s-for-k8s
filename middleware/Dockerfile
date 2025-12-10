# Multi-stage build for Go middleware

# Stage 1: Build
FROM --platform=$BUILDPLATFORM golang:1.21-alpine AS builder

# Build arguments for cross-compilation
ARG TARGETOS
ARG TARGETARCH

WORKDIR /app

# Install git (required for go mod)
RUN apk add --no-cache git

# Copy all source code
COPY . .

# Download dependencies and tidy (this will create go.sum)
RUN go mod tidy && go mod download

# Build the application for the target platform
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -a -installsuffix cgo -o main .

# Stage 2: Run
FROM --platform=$TARGETPLATFORM alpine:latest

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/main .

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001

# Change ownership
RUN chown -R appuser:appuser /root/

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

# Run the application
CMD ["./main"]

