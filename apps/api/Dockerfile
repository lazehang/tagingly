# Build from the monorepo root:
#   docker build -f apps/api/Dockerfile .
FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY apps ./apps
COPY packages ./packages
RUN npm ci
RUN npm run build -w api
WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]
