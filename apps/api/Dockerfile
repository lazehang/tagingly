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

# Bake OpenCV Zoo YuNet + SFace ONNX (MIT / Apache-2.0) into the image
ARG OPENCV_ZOO_BASE=https://github.com/opencv/opencv_zoo/raw/main/models
RUN mkdir -p /app/apps/api/face-models \
  && curl -fsSL "${OPENCV_ZOO_BASE}/face_detection_yunet/face_detection_yunet_2023mar.onnx" \
    -o /app/apps/api/face-models/face_detection_yunet_2023mar.onnx \
  && curl -fsSL "${OPENCV_ZOO_BASE}/face_recognition_sface/face_recognition_sface_2021dec.onnx" \
    -o /app/apps/api/face-models/face_recognition_sface_2021dec.onnx

WORKDIR /app/apps/api
ENV NODE_ENV=production
ENV NODE_NO_WARNINGS=1
# ONNX Runtime + canvas; typical RSS ≪ legacy TensorFlow face-api (512–1024 MB often sufficient)
ENV NODE_OPTIONS="--max-old-space-size=1024"
EXPOSE 4000
CMD ["node", "dist/index.js"]
