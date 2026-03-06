FROM node:20-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
      libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
      libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
      libxshmfence1 fonts-liberation && \
    rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 -s /bin/bash agent

USER agent
WORKDIR /workspace

COPY --chown=agent:agent package.json package-lock.json ./
RUN npm ci --ignore-scripts && \
    npx playwright install --with-deps chromium

COPY --chown=agent:agent scripts/ ./scripts/
COPY --chown=agent:agent prompts/ ./prompts/
COPY --chown=agent:agent templates/ ./templates/
COPY --chown=agent:agent config/ ./config/

HEALTHCHECK --interval=30s --timeout=5s \
  CMD node -e "process.exit(0)"

CMD ["node", "scripts/pre-build-check.js", "/project"]
