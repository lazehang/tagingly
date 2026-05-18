# Build from the monorepo root:
#   docker build -f apps/api/Dockerfile .
FROM node:22-bookworm-slim

# Runtime libs for `canvas` + tools to fetch face model weights at build time
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm ci
RUN npm run build -w api
RUN npm prune --omit=dev

# Bake face-api weights into the image (avoids download + extra RAM spike on first request)
ARG FACE_MODEL_BASE=https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights
RUN mkdir -p /app/apps/api/face-models \
  && cd /app/apps/api/face-models \
  && for f in \
    ssd_mobilenetv1_model-weights_manifest.json \
    ssd_mobilenetv1_model-shard1 \
    ssd_mobilenetv1_model-shard2 \
    face_landmark_68_model-weights_manifest.json \
    face_landmark_68_model-shard1 \
    face_recognition_model-weights_manifest.json \
    face_recognition_model-shard1 \
    face_recognition_model-shard2; do \
      curl -fsSL "${FACE_MODEL_BASE}/${f}" -o "${f}"; \
    done

WORKDIR /app/apps/api
ENV NODE_ENV=production
# Quieter TensorFlow logs (oneDNN INFO lines)
ENV TF_CPP_MIN_LOG_LEVEL=2
EXPOSE 4000
CMD ["node", "dist/index.js"]
