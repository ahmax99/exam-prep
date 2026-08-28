ARG NODE_VERSION=24
# -------------------
# Bun base
# -------------------
FROM public.ecr.aws/lambda/nodejs:${NODE_VERSION} AS bun-base

# Install unzip (required by Bun installer) and Bun runtime, clean up in same layer
ADD --chmod=755 https://bun.sh/install /tmp/bun-install.sh
RUN dnf install -y unzip && \
    bash /tmp/bun-install.sh "bun-v1.3.11" && \
    rm /tmp/bun-install.sh && \
    dnf clean all && \
    rm -rf /var/cache/dnf/*
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

WORKDIR /app

# -------------------
# Build base
# -------------------
FROM bun-base AS build-base

ARG NODE_VERSION

# Install Node.js 24.x (required by Turbo and Next.js)
ADD --chmod=755 https://rpm.nodesource.com/setup_${NODE_VERSION}.x /tmp/nodesource-setup.sh
RUN bash /tmp/nodesource-setup.sh && \
    rm /tmp/nodesource-setup.sh && \
    dnf install -y nodejs && \
    dnf clean all && \
    rm -rf /var/cache/dnf/*

# -------------------
# Prepare stage
# -------------------
FROM build-base AS prepare

# Copy only the files turbo prune needs
COPY package.json bun.lock turbo.json ./
COPY apps/ ./apps/
COPY shared/ ./shared/

# Prune to target workspace (creates /app/out/json and /app/out/full)
RUN bunx --bun turbo prune nextjs-boilerplate --docker

# -------------------
# Builder stage
# -------------------
FROM build-base AS builder

# Copy pruned lockfile and package.json files
COPY --from=prepare /app/out/json/ .
# Install dependencies from pruned workspace
RUN bun install
# Copy source code
COPY --from=prepare /app/out/full/ .
# Ensure public directory exists, then build the Next.js project (standalone output)
RUN mkdir -p /app/apps/nextjs-boilerplate/public && \
    bunx --bun turbo build --filter=nextjs-boilerplate

# -------------------
# Runner stage
# -------------------
FROM bun-base AS runner

# Copy AWS Lambda Web Adapter
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:1.0.0 /lambda-adapter /opt/extensions/lambda-adapter

# Copy Next.js standalone output
COPY --from=builder /app/apps/nextjs-boilerplate/.next/standalone ./
# Copy static files
COPY --from=builder /app/apps/nextjs-boilerplate/.next/static ./apps/nextjs-boilerplate/.next/static
# Copy public files
COPY --from=builder /app/apps/nextjs-boilerplate/public ./apps/nextjs-boilerplate/public

# Copy workspace packages (@shared/config)
COPY --from=builder /app/shared/config/dist ./shared/config/dist
COPY --from=builder /app/shared/config/package.json ./shared/config/package.json

# Lambda Web Adapter configuration
ENV PORT=3000
ENV NODE_ENV=production

# Run as non-root user (numeric UID)
RUN chown -R 1001:1001 /app
USER 1001

WORKDIR /app/apps/nextjs-boilerplate

# Override ENTRYPOINT for AWS Lambda base image. Nextjs standalone output is not compatible yet with bun run server.js
ENTRYPOINT []
CMD ["node", "server.js"]
