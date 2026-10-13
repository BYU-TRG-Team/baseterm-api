# Build Args
#
# ENV=production|development
#

FROM node:16-bullseye-slim
ARG ENV=production
WORKDIR /usr/src/app
COPY . .
RUN sed -i \
      -e 's|http://deb.debian.org/debian-security|http://archive.debian.org/debian-security|g' \
      -e '/bullseye-updates/d' \
      /etc/apt/sources.list \
    && apt-get -o Acquire::Check-Valid-Until=false update \
    && apt-get install -y --no-install-recommends python3 python3-pip git \
    && rm -rf /var/lib/apt/lists/* \
    && pip3 install --no-cache-dir -r requirements.txt \
    && npm ci \
    && npm run build \
    && if [ "${ENV}" = "production" ]; then npm prune --production; fi
ENV NODE_ENV="${ENV}"
CMD npm run start