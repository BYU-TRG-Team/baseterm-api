FROM python:3.14-slim-bookworm AS python-base
FROM node:24-bookworm-slim
ARG ENV=production
COPY --from=python-base /usr/local/ /usr/local/
WORKDIR /usr/src/app
COPY . .
RUN apt-get update \
    && apt-get install -y --no-install-recommends git libxml2 libxslt1.1 \
    && rm -rf /var/lib/apt/lists/* \
    && python3 --version \
    && pip3 --version \
    && pip3 install --no-cache-dir -r requirements.txt \
    && npm ci \
    && npm run build \
    && if [ "${ENV}" = "production" ]; then npm prune --production; fi
ENV NODE_ENV="${ENV}"
CMD ["npm", "run", "start"]