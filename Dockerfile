# ============================================================
# QuizRush — single-container production image
# Builds the React client, then runs the Express/Socket.io
# server which serves the built client as static files.
#
# Requires an external Redis instance (see docker-compose.yml
# for local dev, or use a managed Redis add-on in production).
# ============================================================

# ---- Stage 1: install workspace deps + build the client ----
FROM node:22-alpine AS build
WORKDIR /app

# Copy only manifests first so this layer is cache-friendly
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
COPY tests/package.json tests/package.json
RUN npm ci

# Vite bakes VITE_* env vars into the JS bundle at build time.
# Render automatically forwards its env vars as Docker build args.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Now copy source and build the client bundle
COPY . .
RUN npm run build --workspace=client

# ---- Stage 2: production runtime (server only) ----
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Manifests for all workspaces (npm needs them to validate the lockfile),
# but --workspace=server means only the server's prod deps get installed.
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
COPY tests/package.json tests/package.json
RUN npm ci --omit=dev --workspace=server

COPY server server
COPY --from=build /app/client/dist client/dist

EXPOSE 3001
CMD ["node", "server/src/index.js"]
