# Build stage: compile TypeScript and prepare dependencies
FROM node:20-alpine AS builder

# Install bun
RUN npm install -g bun

WORKDIR /app

# Copy monorepo files (only the lockfile and root package.json are needed for installation)
COPY package.json bun.lock ./
COPY apps/api ./apps/api
COPY packages ./packages

# Install all dependencies using bun's frozen lockfile
# This ensures exact dependency resolution from lockfile
RUN bun install --frozen-lockfile

# Build the shared package first (runtime Node can't execute its raw .ts source)
WORKDIR /app/packages/shared
RUN bun run build

# Build the API application
WORKDIR /app/apps/api
RUN bun run build

# Runtime stage: minimal production image
FROM node:20-alpine

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application from builder, preserving the workspace layout so
# apps/api/node_modules's relative symlinks (bun hoists most deps there, not
# to the root node_modules) still resolve correctly.
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Copy packages (shared dependencies) if they exist
COPY --from=builder /app/packages ./packages

# Copy root package.json for workspace resolution
COPY --from=builder /app/package.json ./

# Copy node_modules from builder (use exact same resolved dependencies as build stage)
COPY --from=builder /app/node_modules ./node_modules

# Remove dev dependencies from runtime to keep image small
# We keep node_modules to ensure the exact same dependency resolution as build time
RUN find ./node_modules -type d -name '.bin' -prune -o -type d -name '*.test.*' -prune

# Switch to non-root user
USER nodejs

# Expose port 3001
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the application
CMD ["node", "apps/api/dist/index.js"]
